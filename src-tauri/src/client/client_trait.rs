use crate::utils::conn::set_client_name;
use crate::utils::error::AppError;
use crate::utils::model::*;
use crate::utils::util::*;
use Ordering::Relaxed;
use anyhow::{Context, bail};
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use chrono::Local;
use log::{info, warn};
use parking_lot::MutexGuard;
use redis::streams::{StreamInfoConsumersReply, StreamInfoGroupsReply, StreamRangeReply};
use redis::{
    Cmd, Commands, Connection, ExpireOption, FromRedisValue, IntegerReplyOrNoOp, JsonCommands, Msg,
    SetExpiry, SetOptions, Value, ValueType, from_redis_value,
};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::{BufRead, BufReader, BufWriter, Write};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::thread::JoinHandle;
use tauri::{AppHandle, Emitter};

// RedisME服务接口
pub trait MeClient: Send + Sync {
    fn base(&self) -> &MeBase;

    fn name(&self) -> String {
        self.base().conf.name.clone()
    }

    fn db_list(&self) -> AnyResult<Vec<RedisDB>>;

    fn select_db(&self, db: u16) -> AnyResult<()>;

    fn info(&self, node: Option<String>) -> AnyResult<RedisInfo>;

    fn info_list(&self) -> AnyResult<Vec<RedisInfo>>;

    fn chart(&self, node: Option<String>) -> AnyResult<RedisChart> {
        info_to_chart(self.info(node)?)
    }

    fn chart_list(&self) -> AnyResult<Vec<RedisChart>> {
        let info_list = self.info_list()?;
        info_list.into_iter().map(info_to_chart).collect()
    }

    fn node_list(&self) -> AnyResult<Vec<RedisNode>>;

    fn scan(&self, param: ScanParam) -> AnyResult<ScanResult>;

    fn field_scan(&self, param: FieldScanParam) -> AnyResult<FieldScanResult>;

    fn ttl(&self, key: RedisKey, ttl: i64) -> AnyResult<()>;

    fn set(&self, param: RedisSetParam) -> AnyResult<()>;

    fn del(&self, key: RedisKey) -> AnyResult<()>;

    fn rename(&self, key: RedisKey, new_key: RedisKey) -> AnyResult<RedisKey>;

    fn field_add(&self, param: RedisFieldAdd) -> AnyResult<RedisKey>;

    fn field_set(&self, param: RedisFieldSet) -> AnyResult<()>;

    fn field_del(&self, param: RedisFieldDel) -> AnyResult<()>;

    fn execute_command(&self, param: RedisCommand) -> AnyResult<String>;

    fn config_get(&self, pattern: &str, node: Option<String>)
    -> AnyResult<HashMap<String, String>>;

    fn config_set(&self, key: &str, value: &str, node: Option<String>) -> AnyResult<()>;

    fn slow_log(&self, count: Option<u64>, node: Option<String>) -> AnyResult<Vec<RedisSlowLog>>;

    fn memory_usage(&self, param: RedisMemoryParam) -> AnyResult<Vec<RedisKeySize>>;

    fn client_list(
        &self,
        node: Option<String>,
        client_type: Option<String>,
    ) -> AnyResult<Vec<RedisClientInfo>>;

    fn publish(&self, channel: &str, message: &str) -> AnyResult<()>;

    fn subscribe(&self, app_handle: AppHandle, channel: Option<String>) -> AnyResult<()>;
    fn subscribe_stop(&self) -> AnyResult<()>;

    fn monitor(&self, app_handle: AppHandle, node: &str) -> AnyResult<()>;
    fn monitor_stop(&self) -> AnyResult<()>;

    fn batch_del(&self, param: RedisBatchKey) -> AnyResult<()>;
    fn batch_ttl(&self, param: RedisBatchTtl) -> AnyResult<()>;
    fn export_csv(&self, app_handle: AppHandle, param: RedisExportCsv) -> AnyResult<()>;
    fn import_csv(&self, app_handle: AppHandle, param: RedisImportCsv) -> AnyResult<()>;
    fn import_cmd(&self, app_handle: AppHandle, file: String) -> AnyResult<()>;

    fn mock_data(&self, count: u64) -> AnyResult<()>;
    fn key_type(&self, key: RedisKey) -> AnyResult<String>;
    fn xinfo_groups(&self, key: RedisKey) -> AnyResult<Vec<XInfoGroup>>;
    fn xinfo_consumers(&self, key: RedisKey, group: String) -> AnyResult<Vec<XInfoConsumer>>;
    fn key_slot(&self, key: RedisKey) -> AnyResult<u64>;
    fn key_node(&self, key: RedisKey) -> AnyResult<Vec<RedisNode>>;
    fn flush_db(&self) -> AnyResult<()>;
    fn flush_all(&self) -> AnyResult<()>;
}

// 通用实现: 由于Connection动态兼容问题，无法写在接口里面，因此写在方法中

pub fn scan_0_batch_count(pattern: &str) -> u64 {
    // 空白或单字母查询，扫描1000槽位数即可；否则扫描10000个槽位数
    if pattern.replace("*", "").chars().count() <= 1 {
        1000
    } else {
        10000
    }
}

pub fn scan_1_cmd(cursor: u64, pattern: &str, batch_count: u64, scan_type: Option<String>) -> Cmd {
    // SCAN cursor [MATCH pattern] [COUNT count] [TYPE type]
    let mut cmd = redis::cmd("scan");
    cmd.arg(cursor)
        .arg("match")
        .arg(pattern)
        .arg("count")
        .arg(batch_count);

    if let Some(mut scan_type) = scan_type
        && !scan_type.is_empty()
    {
        if scan_type == ME_JSON_TYPE_NAME {
            scan_type = REDIS_JSON_TYPE_NAME.to_string();
        }
        cmd.arg("type").arg(scan_type);
    }
    cmd
}

pub fn field_scan0(
    mut conn: MutexGuard<impl Commands>,
    param: FieldScanParam,
    capabilities: &ServerCapabilities,
) -> AnyResult<FieldScanResult> {
    let bytes_format = param.bytes_format.as_ref().cloned().unwrap_or_default();

    // String, Json, List, Hash(WithKey), Stream(WithKey), Stream 直接获取得到值
    let (mut value, key_type, mut cc, length) = field_scan_0_get(&mut conn, &param, &bytes_format)?;

    // Hash, Set, Zset 进行扫描(hscan, sscan, zscan)
    let key = param.key;
    if value.is_none() {
        let mut scan_value = FieldScanValue::default();
        let mut ready_count = 0;
        loop {
            // 优化字段扫描个数
            let count = if param.load_all {
                1000
            } else if param.count == 0 {
                20
            } else {
                param.count
            };

            let cmd = field_scan_1_cmd(&key_type, &key, cc.now_cursor, count)?;
            let (next_cursor, new_value): (u64, Value) = cmd.query(&mut conn)?;
            let new_count = field_scan_2_value(
                &mut conn,
                &key_type,
                &mut scan_value,
                new_value,
                &key,
                capabilities,
                &bytes_format,
            )?;

            ready_count += new_count;
            cc.now_cursor = next_cursor;

            if next_cursor == 0 {
                cc.finished = true;
                break;
            }

            if !param.load_all && ready_count >= param.count as usize {
                break;
            }
        }
        value = Some(field_scan_3_json(&key_type, &scan_value)?)
    }

    let with_field_key = param
        .hash_key
        .as_ref()
        .is_some_and(|k| !k.is_empty());
    // 返回值添加 TTL、内存占用与元素总数
    field_scan_4_return(
        conn,
        key,
        key_type,
        value.unwrap_or_default(),
        cc,
        length,
        with_field_key,
    )
}

pub fn field_scan_0_get(
    mut conn: &mut MutexGuard<impl Commands>,
    param: &FieldScanParam,
    bytes_format: &BytesFormat,
) -> AnyResult<(Option<serde_json::Value>, ValueType, ScanCursor, usize)> {
    let key = &param.key;
    let hash_key = param.hash_key.clone();

    let key_type: ValueType = conn.key_type(key)?;
    let mut cc = param.cursor.clone().unwrap_or_default();

    // String类型的bytes长度
    let mut length = 0;

    let value: Option<serde_json::Value> = match key_type {
        ValueType::String => {
            let value: Vec<u8> = conn.get(key)?;
            length = value.len();
            let value: String = format_bytes(&value, bytes_format);
            cc.finished = true;
            Some(serde_json::to_value(value)?)
        }
        ValueType::JSON => {
            let value: Value = redis::cmd("JSON.GET").arg(key).query(&mut conn)?;
            cc.finished = true;
            //Some(serde_json::to_value(redis_value_to_string(value, "\n"))?)
            Some(serde_json::from_str(&redis_value_to_string(value, "\n"))?)
        }
        ValueType::Hash => {
            if let Some(hash_key) = hash_key
                && !hash_key.is_empty()
            {
                let value: Option<Vec<u8>> = conn.hget(key, &hash_key)?;
                match value {
                    Some(str) => {
                        length = str.len();
                        cc.finished = true;
                        Some(serde_json::to_value(format_bytes(&str, bytes_format))?)
                    }
                    None => bail!(AppError::FieldNotFound { hash_key }),
                }
            } else {
                None
            }
        }
        ValueType::List => {
            // 如果你有一个从 0 到 100 的数字列表，LRANGE list 0 10 将返回 11 个元素，也就是说，最右边的项是包含在内的
            // 超出范围的索引不会产生错误。如果 start 大于列表的末尾，将返回一个空列表。如果 stop 大于列表的实际末尾，Redis 会将其视为列表的最后一个元素。
            let end_index: isize = if param.load_all {
                -1
            } else {
                (cc.now_cursor + param.count) as isize
            };
            let value: Vec<Vec<u8>> = conn.lrange(key, cc.now_cursor as isize, end_index)?;

            // 0 ~ 10 获取到11元素, 表示还没有获取到全部数据。序号为10的元素本次不取
            let value: Vec<String> = if !param.load_all && value.len() > param.count as usize {
                cc.finished = false;
                cc.now_cursor += param.count;
                ui_list_value(&value[0..param.count as usize], bytes_format)
            } else {
                cc.finished = true;
                ui_list_value(&value, bytes_format)
            };
            Some(serde_json::to_value(value)?)
        }
        ValueType::Stream => {
            // stream的id, 复用hash_key字段
            if let Some(hash_key) = hash_key
                && !hash_key.is_empty()
            {
                let mut reply: StreamRangeReply = conn.xrange(key, &hash_key, &hash_key)?;
                match reply.ids.pop() {
                    Some(entry) => {
                        cc.finished = true;
                        Some(serde_json::to_value(ui_stream_id(entry.map))?)
                    }
                    None => bail!(AppError::FieldNotFoundStream {
                        stream_id: hash_key
                    }),
                }
            } else {
                // https://redis.ac.cn/docs/latest/commands/xrange/
                // XRANGE key start end [COUNT count]   注意start/end是包含在内的
                // 起始参数: - 表示最小值, 游标有值则取值
                // 结束参数: + 表示最大值
                // 加载所有: 不追加count参数，否则追加count + 1参数，多获取1个用于判断是否已扫描结束
                //let start = if cc.stream_cursor.is_empty() { "-" } else { &cc.stream_cursor };
                //let end = "+";
                //let count = if cc.stream_cursor.is_empty() { param.count + 1 } else { param.count };
                //let mut cmd = redis::cmd("XRANGE");
                //cmd.arg(key).arg(start).arg(end);

                // 倒序: 更符合实际的使用习惯, 即查看最新的消息。TinyRDM/AnotherRDM都是倒序的
                // XREVRANGE key end start [COUNT count]
                let end = if cc.stream_cursor.is_empty() {
                    match param.meta.as_ref() {
                        Some(meta) if !meta.max_id.is_empty() => &meta.max_id,
                        _ => "+",
                    }
                } else {
                    &cc.stream_cursor
                };

                let start = match param.meta.as_ref() {
                    Some(meta) if !meta.min_id.is_empty() => &meta.min_id,
                    _ => "-",
                };

                let count = if cc.stream_cursor.is_empty() {
                    param.count + 1
                } else {
                    param.count
                };

                let mut cmd = redis::cmd("XREVRANGE");
                cmd.arg(key).arg(end).arg(start);
                if !param.load_all {
                    cmd.arg("COUNT").arg(count);
                }
                let reply: StreamRangeReply = cmd.query(&mut conn)?;
                let mut value = ui_stream_value(reply);

                if !param.load_all && value.len() > param.count as usize {
                    cc.finished = false;
                    cc.stream_cursor = value.pop().unwrap().id; // 弹出最后1个元素，作为下次游标
                } else {
                    cc.finished = true;
                };
                Some(serde_json::to_value(value)?)
            }
        }
        // 注意此处SET/ZSET等是支持的，只是需要进行扫描，不能直接使用通用的: handle_other_value_type
        ValueType::Unknown(_) => {
            handle_other_value_type(&key_type, key)?;
            None
        }
        _ => None,
    };
    Ok((value, key_type, cc, length))
}

pub fn field_scan_1_cmd(
    key_type: &ValueType,
    key: &RedisKey,
    cursor: u64,
    count: u64,
) -> AnyResult<Cmd> {
    let scan_command = match key_type {
        ValueType::Hash => "hscan",
        ValueType::Set => "sscan",
        ValueType::ZSet => "zscan",
        _ => bail!(AppError::FieldScanNotSupported {
            value_type: ui_key_type(key_type.clone())
        }),
    };

    // SCAN cursor [MATCH pattern] [COUNT count] [TYPE type]
    // HSCAN key cursor [MATCH pattern] [COUNT count] [NOVALUES]
    // SSCAN key cursor [MATCH pattern] [COUNT count]
    // ZSCAN key cursor [MATCH pattern] [COUNT count]
    let mut cmd = redis::cmd(scan_command);
    cmd.arg(key).arg(cursor).arg("count").arg(count);
    Ok(cmd)
}

pub fn field_scan_2_value(
    conn: &mut impl Commands,
    key_type: &ValueType,
    scan_value: &mut FieldScanValue,
    new_value: Value,
    key: &RedisKey,
    capabilities: &ServerCapabilities,
    bytes_format: &BytesFormat,
) -> AnyResult<usize> {
    let new_count = match key_type {
        ValueType::Hash => {
            let value: Vec<(Vec<u8>, Vec<u8>)> = FromRedisValue::from_redis_value(new_value)?;
            let new_count = value.len();
            let mut new_value = ui_hash_value(&value, bytes_format);

            // 补充hash字段ttl
            if capabilities.hash_field_ttl {
                let fields: Vec<&Vec<u8>> = value.iter().map(|(f, _)| f).collect();
                let ttl_values: Vec<IntegerReplyOrNoOp> = conn.httl(key, fields)?;

                for (item, ttl_reply) in new_value.iter_mut().zip(ttl_values) {
                    item.ttl = match ttl_reply {
                        IntegerReplyOrNoOp::IntegerReply(ttl) => Some(ttl as i64),
                        IntegerReplyOrNoOp::NotExists => Some(-2),
                        IntegerReplyOrNoOp::ExistsButNotRelevant => Some(-1),
                        _ => None, // 其他场景
                    };
                }
            }

            scan_value.hash.extend(new_value);
            new_count
        }
        ValueType::Set => {
            let value: HashSet<Vec<u8>> = FromRedisValue::from_redis_value(new_value)?;
            let new_count = value.len();
            scan_value.set.extend(ui_set_value(value, bytes_format));
            new_count
        }

        ValueType::ZSet => {
            let value: Vec<(Vec<u8>, f64)> = FromRedisValue::from_redis_value(new_value)?;
            let new_count = value.len();
            scan_value.zset.extend(ui_zset_value(value, bytes_format));
            new_count
        }
        _ => bail!(AppError::FieldScanNotSupported {
            value_type: ui_key_type(key_type.clone())
        }),
    };
    Ok(new_count)
}

pub fn field_scan_3_json(
    key_type: &ValueType,
    scan_value: &FieldScanValue,
) -> AnyResult<serde_json::value::Value> {
    let value = match key_type {
        ValueType::Hash => serde_json::to_value(&scan_value.hash)?,
        ValueType::Set => serde_json::to_value(&scan_value.set)?,
        ValueType::ZSet => serde_json::to_value(&scan_value.zset)?,
        _ => bail!(AppError::FieldScanNotSupported {
            value_type: ui_key_type(key_type.clone())
        }),
    };
    Ok(value)
}

/// 集合类型用 HLEN/LLEN 等填充 length；String/单字段仍用已算好的 bytes 长度
fn resolve_field_scan_length(
    conn: &mut MutexGuard<impl Commands>,
    key: &RedisKey,
    key_type: &ValueType,
    field_byte_len: usize,
    with_field_key: bool,
) -> AnyResult<usize> {
    if with_field_key {
        return Ok(field_byte_len);
    }
    let len = match key_type {
        ValueType::String => field_byte_len,
        ValueType::Hash => conn.hlen(key)?,
        ValueType::List => conn.llen(key)?,
        ValueType::Set => conn.scard(key)?,
        ValueType::ZSet => conn.zcard(key)?,
        ValueType::Stream => redis::cmd("XLEN").arg(key).query(conn)?,
        _ => field_byte_len,
    };
    Ok(len)
}

pub fn field_scan_4_return(
    mut conn: MutexGuard<impl Commands>,
    key: RedisKey,
    key_type: ValueType,
    value: serde_json::Value,
    cursor: ScanCursor,
    length: usize,
    with_field_key: bool,
) -> AnyResult<FieldScanResult> {
    let ttl: i64 = conn.ttl(&key)?;
    let size: u64 = redis::cmd("memory")
        .arg("usage")
        .arg(&key)
        .query(&mut conn)
        // 兼容腾讯云Redis等不支持memory usage的第三方缓存数据库 #81
        .unwrap_or(0);
    let length = resolve_field_scan_length(&mut conn, &key, &key_type, length, with_field_key)?;

    Ok(FieldScanResult {
        key_type: ui_key_type(key_type),
        ttl,
        size,
        value,
        cursor,
        length,
    })
}

pub fn ttl0(mut conn: MutexGuard<impl Commands>, key: RedisKey, ttl: i64) -> AnyResult<()> {
    if ttl > 0 {
        // 为 key 设置超时时间。超时时间到期后，该 key 将被自动删除。
        // 请注意，调用 EXPIRE/`PEXPIRE` 时使用非正数超时，或调用 `EXPIREAT`/`PEXPIREAT` 时使用过去的时间，
        // 将导致 key 被 删除 而非过期（相应地，发出的 key 事件 将是 del，而不是 expired）。
        // 整数回复：如果未设置超时时间则返回 0；例如，key 不存在，或者由于提供的参数而跳过了操作。
        // 整数回复：如果已设置超时时间则返回 1。
        let _: () = conn.expire(&key, ttl)?;
    } else {
        // 移除 key 上已有的过期时间，将键从易失（设置了过期时间的键）变为变为持久
        // 整型回复: 如果 key 不存在或没有关联的过期时间，则返回 0。
        // 整型回复: 如果已移除过期时间，则返回 1。
        let _: () = conn.persist(&key)?;
    };
    Ok(())
}

pub fn set0(mut conn: MutexGuard<impl Commands>, param: RedisSetParam) -> AnyResult<()> {
    let key = param.key;
    let format = param.input_format.as_ref().cloned().unwrap_or_default();
    // 解析输入格式为字节（MsgPack 由前端编码为 base64 后传入）
    let bytes = parse_bytes(&param.value, &format)?;

    if param.key_type.unwrap_or_default() == ME_JSON_TYPE_NAME {
        // json 类型
        let value: serde_json::Value =
            serde_json::from_str(&param.value).with_context(|| "json parse error")?;
        let _: () = conn.json_set(&key, "$", &value)?;
        if param.ttl > 0 {
            let _: () = conn.expire(&key, param.ttl)?;
        }
    } else {
        // string 类型
        if param.ttl > 0 {
            let options = SetOptions::default().with_expiration(SetExpiry::EX(param.ttl as u64));
            let _: () = conn.set_options(&key, &bytes, options)?;
        } else {
            let _: () = conn.set(&key, &bytes)?;
        };
    }
    Ok(())
}

pub fn del0(mut conn: MutexGuard<impl Commands>, key: RedisKey) -> AnyResult<()> {
    let _: () = conn.del(&key)?;
    Ok(())
}

pub fn field_add0(
    mut conn: MutexGuard<impl Commands>,
    param: RedisFieldAdd,
    capabilities: &ServerCapabilities,
) -> AnyResult<RedisKey> {
    let key_fmt = param.key_fmt.as_ref().cloned().unwrap_or_default();
    let val_fmt = param.val_fmt.as_ref().cloned().unwrap_or_default();

    // `bytes` 为空：沿用界面上的键名 + key_fmt 解析；非空：扫描/详情得到的二进制键，避免经 String 丢失
    let key: RedisKey = if param.key.bytes.is_empty() {
        parse_bytes(&param.key.key, &key_fmt)?.into()
    } else {
        param.key
    };
    let mode = param.mode;
    let mut key_type = to_key_type(&param.key_type);

    match mode.as_str() {
        "key" => {
            let exists: bool = conn.exists(&key)?;
            if exists {
                bail!(AppError::KeyAlreadyExists {
                    key: vec8_to_display_string(key.to_bytes())
                })
            }
        }
        // 当键不存在时，下面的match会抛出对应异常
        "field" => key_type = conn.key_type(&key)?,
        _ => bail!(AppError::FieldOperationNotSupported { mode }),
    }

    let fv_list = param.field_value_list;

    match key_type {
        ValueType::String => {
            // 解析输入格式为字节，然后写入
            let bytes = parse_bytes(&param.value, &val_fmt)?;
            conn.set(&key, &bytes)?
        }
        ValueType::Hash => {
            // 先解析再写入，避免中途解析失败导致已写入部分字段
            let (field_pairs, ttls): (Vec<(Vec<u8>, Vec<u8>)>, Vec<i64>) = fv_list
                .iter()
                .map(|f| -> AnyResult<_> {
                    Ok((
                        (
                            parse_bytes(&f.field_key, &val_fmt)?,
                            parse_bytes(&f.field_value, &val_fmt)?,
                        ),
                        f.field_ttl,
                    ))
                })
                .collect::<AnyResult<Vec<_>>>()?
                .into_iter()
                .unzip();
            let _: () = conn.hset_multiple(&key, &field_pairs)?;
            if capabilities.hash_field_ttl {
                for ((fk, _), ttl) in field_pairs.iter().zip(&ttls) {
                    if *ttl > 0 {
                        let _: () = conn.hexpire(&key, *ttl, ExpireOption::NONE, fk)?;
                    }
                }
            }
        }
        ValueType::List => {
            let mut elems: Vec<Vec<u8>> = fv_list
                .iter()
                .map(|f| parse_bytes(&f.field_value, &val_fmt))
                .collect::<AnyResult<Vec<_>>>()?;
            let lpush = param.list_push_method == "lpush";
            if lpush {
                // 与一次 LPUSH key v_n … v_1 相同：表头插入后顺序与 fv_list 一致
                elems.reverse();
            }
            let _: usize = if lpush {
                conn.lpush(&key, &elems)?
            } else {
                conn.rpush(&key, &elems)?
            };
        }
        ValueType::Set => {
            let members: Vec<Vec<u8>> = fv_list
                .iter()
                .map(|f| parse_bytes(&f.field_value, &val_fmt))
                .collect::<AnyResult<Vec<_>>>()?;
            let _: usize = conn.sadd(&key, &members)?;
        }
        ValueType::ZSet => {
            let items: Vec<(Vec<u8>, f64)> = fv_list
                .iter()
                .map(|f| -> AnyResult<_> {
                    Ok((parse_bytes(&f.field_value, &val_fmt)?, f.field_score))
                })
                .collect::<AnyResult<Vec<_>>>()?;
            let pairs: Vec<(f64, Vec<u8>)> = items.into_iter().map(|(m, s)| (s, m)).collect();
            let _: usize = conn.zadd_multiple(&key, &pairs)?;
        }
        ValueType::Stream => {
            let items: Vec<(Vec<u8>, Vec<u8>)> = fv_list
                .iter()
                .map(|f| -> AnyResult<(Vec<u8>, Vec<u8>)> {
                    Ok((
                        parse_bytes(&f.field_key, &val_fmt)?,
                        parse_bytes(&f.field_value, &val_fmt)?,
                    ))
                })
                .collect::<AnyResult<Vec<_>>>()?;
            conn.xadd(&key, &param.stream_id, &items)?
        }
        ValueType::JSON => {
            let value: serde_json::Value =
                serde_json::from_str(&param.value).with_context(|| "json parse error")?;
            conn.json_set(&key, "$", &value)?
        }
        _ => {
            handle_other_value_type(&key_type, &key)?;
        }
    };

    if "key" == mode && param.ttl > 0 {
        let _: () = conn.expire(&key, param.ttl)?;
    }
    Ok(key)
}

pub fn field_set0(
    mut conn: MutexGuard<impl Commands>,
    param: RedisFieldSet,
    capabilities: &ServerCapabilities,
) -> AnyResult<()> {
    let key: RedisKey = param.key;
    let key_type: ValueType = conn.key_type(&key)?;
    let val_fmt = param.val_fmt.as_ref().cloned().unwrap_or_default();

    match key_type {
        ValueType::Hash => {
            // HSET 会清除字段级的 TTL，将其置为 -1（永久）。因此只需要处理>0的场景
            let key_bytes = parse_bytes(&param.field_key, &val_fmt)?;
            let value_bytes = parse_bytes(&param.field_value, &val_fmt)?;
            let _: () = conn.hset(&key, &key_bytes, &value_bytes)?;
            if capabilities.hash_field_ttl && param.field_ttl > 0 {
                let _: () = conn.hexpire(&key, param.field_ttl, ExpireOption::NONE, &key_bytes)?;
            }
        }
        ValueType::List => {
            let bytes = parse_bytes(&param.field_value, &val_fmt)?;
            let _: () = conn.lset(&key, param.field_index, &bytes)?;
        }
        ValueType::Set => {
            let src_bytes = parse_bytes(&param.src_field_value, &val_fmt)?;
            let bytes = parse_bytes(&param.field_value, &val_fmt)?;
            let _: () = conn.srem(&key, &src_bytes)?;
            let _: () = conn.sadd(&key, &bytes)?;
        }
        ValueType::ZSet => {
            let src_bytes = parse_bytes(&param.src_field_value, &val_fmt)?;
            let bytes = parse_bytes(&param.field_value, &val_fmt)?;
            let _: () = conn.zrem(&key, &src_bytes)?;
            let _: () = conn.zadd(&key, &bytes, param.field_score)?;
        }
        _ => {
            handle_other_value_type(&key_type, &key)?;
        }
    };
    Ok(())
}

pub fn field_del0(mut conn: MutexGuard<impl Commands>, param: RedisFieldDel) -> AnyResult<()> {
    let key: RedisKey = param.key;
    let key_type: ValueType = conn.key_type(&key)?;
    let val_fmt = param.val_fmt.as_ref().cloned().unwrap_or_default();

    match key_type {
        ValueType::Hash => {
            let field_key = parse_bytes(&param.field_key, &val_fmt)?;
            let _: () = conn.hdel(&key, field_key)?;
        }
        ValueType::List => {
            let _: () = conn.lset(&key, param.field_index, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE)?;
            let _: () = conn.lrem(&key, 1, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE)?;
        }
        ValueType::Set => {
            let bytes = parse_bytes(&param.field_value, &val_fmt)?;
            let _: () = conn.srem(&key, bytes)?;
        }
        ValueType::ZSet => {
            let bytes = parse_bytes(&param.field_value, &val_fmt)?;
            let _: () = conn.zrem(&key, bytes)?;
        }
        ValueType::Stream => {
            let _: () = conn.xdel(&key, &[param.stream_id])?;
        }
        _ => {
            handle_other_value_type(&key_type, &key)?;
        }
    };
    Ok(())
}

pub fn publish0(
    mut conn: MutexGuard<impl Commands>,
    channel: &str,
    message: &str,
) -> AnyResult<()> {
    let _: () = conn.publish(channel, message)?;
    Ok(())
}

/// 将订阅框内容拆成多个 `PSUBSCRIBE` 模式（空白分隔，与 RedisInsight 一致）；无有效模式时等价于 `*`。
fn psubscribe_patterns(channel: Option<String>) -> Vec<String> {
    let Some(raw) = channel.filter(|c| !c.is_empty()) else {
        return vec!["*".into()];
    };
    let mut parts: Vec<String> = raw
        .split_whitespace()
        .map(str::to_string)
        .filter(|p| !p.is_empty())
        .collect();
    if parts.is_empty() {
        vec!["*".into()]
    } else {
        // 添加停止订阅频道, 用于停止订阅时发送消息避免阻塞
        parts.push(REDIS_ME_SUBSCRIBE_STOP_CHANNEL.into());
        parts
    }
}

pub fn subscribe0(
    mut conn: Connection,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    channel: Option<String>,
    id: String,
) -> AnyResult<()> {
    set_client_name(&mut conn)?;
    running.store(true, Relaxed);

    let patterns = psubscribe_patterns(channel);

    let _: JoinHandle<AnyResult<()>> = thread::spawn(move || {
        conn.send_packed_command(&redis::cmd("PSUBSCRIBE").arg(&patterns).get_packed_command())?;
        info!("subscribe start: {:?}", patterns);
        while running.load(Relaxed) {
            let response = conn.recv_response()?;
            if let Some(msg) = Msg::from_value(&response) {
                let payload: String = msg.get_payload()?;
                let event = SubscribeEvent {
                    id: id.clone(),
                    datetime: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
                    channel: msg.get_channel_name().to_string(),
                    message: payload,
                };
                let _ = &app_handle.emit(EVENT_SUBSCRIBE, event);
            }
        }
        info!("subscribe end: {:?}", patterns);
        Ok(())
    });
    Ok(())
}

pub fn subscribe_stop0(conn: MutexGuard<impl Commands>, running: Arc<AtomicBool>) -> AnyResult<()> {
    running.store(false, Relaxed);
    // 停止订阅时必须发送一个消息，否则会阻塞
    publish0(
        conn,
        REDIS_ME_SUBSCRIBE_STOP_CHANNEL,
        REDIS_ME_SUBSCRIBE_STOP_CHANNEL,
    )
}

pub fn monitor0(
    mut conn: Connection,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) -> AnyResult<()> {
    set_client_name(&mut conn)?;
    running.store(true, Relaxed);

    let _: JoinHandle<AnyResult<()>> = thread::spawn(move || {
        conn.send_packed_command(&redis::cmd("MONITOR").get_packed_command())?;
        info!("monitor start");
        while running.load(Relaxed) {
            let response = conn.recv_response()?;
            let command: String = from_redis_value(response)?;
            let event = MonitorEvent {
                id: id.clone(),
                datetime: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
                command,
            };
            let _ = &app_handle.emit(EVENT_MONITOR, event);
        }
        info!("monitor end");
        Ok(())
    });

    Ok(())
}

pub fn monitor_stop0(running: Arc<AtomicBool>) -> AnyResult<()> {
    info!("monitor stop");
    running.store(false, Relaxed);
    Ok(())
}

fn handle_other_value_type(value_type: &ValueType, key: &RedisKey) -> AnyResult<serde_json::Value> {
    match value_type {
        ValueType::Unknown(other) => {
            if "none" == other {
                bail!(AppError::KeyNotFound {
                    key: vec8_to_display_string(key.to_bytes())
                })
            } else {
                bail!(AppError::KeyTypeUnknown {
                    value_type: other.into()
                })
            }
        }
        //ValueType::Stream => bail!("Unsupported Type: Stream"),
        _ => bail!(AppError::KeyTypeUnsupported {
            value_type: format!("{:?}", value_type)
        }),
    }
}

pub fn batch_key0(
    rmc: &impl MeClient,
    param: RedisBatchKey,
    assert_not_empty: bool,
) -> AnyResult<Vec<RedisKey>> {
    let key_list = if param.key_list.is_empty() {
        if param.pattern.is_empty() {
            bail!(AppError::EmptyParameters)
        }
        let scan_result = rmc.scan(ScanParam::all(param.pattern))?;
        info!("scan key count: {}", scan_result.key_list.len());
        scan_result.key_list
    } else {
        param.key_list
    };

    if assert_not_empty && key_list.is_empty() {
        bail!(AppError::EmptyKeyList)
    }

    Ok(key_list)
}

pub fn export_import_check_running(running: Arc<AtomicBool>) -> AnyResult<()> {
    if running.load(Relaxed) {
        bail!(AppError::ExportImportRunning)
    }
    running.store(true, Relaxed);
    Ok(())
}

pub fn export_csv_0_thread(
    conn: &mut impl Commands,
    key_list: Vec<RedisKey>,
    file: String,
    with_ttl: bool,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) {
    info!("export keys count: {}", key_list.len());
    let result = export_keys(
        conn,
        key_list,
        &file,
        with_ttl,
        running.clone(),
        app_handle,
        id,
    );
    match result {
        Ok(_) => info!("export keys ok"),
        Err(e) => warn!("export keys err: {e}"),
    }
    running.store(false, Relaxed);
}

fn export_keys(
    mut conn: impl Commands,
    key_list: Vec<RedisKey>,
    file: &str,
    with_ttl: bool,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) -> AnyResult<()> {
    info!("export keys file: {}", file);
    let mut writer = BufWriter::new(File::create(file)?);
    let mut ok_count = 0;
    let mut err_count = 0;
    let total_count = key_list.len() as u64;
    for key in key_list {
        if running.load(Relaxed) {
            let result = export_key(&mut conn, &mut writer, key, with_ttl);
            match result {
                Ok(_) => ok_count += 1,
                Err(e) => {
                    warn!("export key err: {e}");
                    err_count += 1;
                }
            };
            // 通知导出进度
            let event = ExportImportEvent {
                id: id.clone(),
                ok_count,
                err_count,
                total_count,
                ignore_count: 0,
                finished: false,
            };
            let _ = &app_handle.emit(EVENT_EXPORT, event);
        }
    }

    let event = ExportImportEvent {
        id: id.clone(),
        ok_count,
        err_count,
        total_count,
        ignore_count: 0,
        finished: true,
    };
    let _ = &app_handle.emit(EVENT_EXPORT, event);
    writer.flush()?;
    Ok(())
}

fn export_key(
    conn: &mut impl Commands,
    writer: &mut BufWriter<File>,
    key: RedisKey,
    with_ttl: bool,
) -> AnyResult<()> {
    let ttl = if with_ttl { conn.ttl(&key)? } else { -1 };

    // https://redis.ac.cn/docs/latest/commands/dump/
    // DUMP key
    let bytes: Vec<u8> = redis::cmd("dump").arg(&key).query(conn)?;
    let key = BASE64_STANDARD.encode(key.to_bytes());
    let value = BASE64_STANDARD.encode(&bytes);
    // 文件写入一行
    writeln!(writer, "{key},{value},{ttl}")?;
    Ok(())
}

pub fn import_csv_0_thread(
    conn: &mut impl Commands,
    param: RedisImportCsv,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) {
    info!("import csv file: {}", &param.file);
    let result = import_keys(conn, param, running.clone(), app_handle, id);
    match result {
        Ok(_) => info!("import csv file ok"),
        Err(e) => warn!("import csv file err: {e}"),
    }
    running.store(false, Relaxed);
}

fn import_keys(
    conn: &mut impl Commands,
    param: RedisImportCsv,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) -> AnyResult<()> {
    let reader = BufReader::new(File::open(&param.file)?);
    let total_count = reader.lines().count() as u64;
    info!("import keys count: {}", total_count);

    let mut ok_count = 0;
    let mut err_count = 0;
    let mut ignore_count = 0;

    let reader = BufReader::new(File::open(&param.file)?);
    for line in reader.lines() {
        let line = line?;
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if running.load(Relaxed) {
            let result = import_key(
                conn,
                line,
                param.ttl,
                &param.handle_ttl,
                &param.handle_conflict,
            );
            match result {
                Ok(_) => ok_count += 1,
                Err(e) => {
                    // 文档说明: RESTORE will return a "Target key name is busy" error when key already exists unless you use the REPLACE modifier.
                    // 实际测试: Redis 8.4.0返回的错误: "BUSYKEY": Target key name already exists.
                    if e.to_string().contains("Target key name") {
                        ignore_count += 1;
                    } else {
                        warn!("import key err: {e}");
                        err_count += 1
                    }
                }
            };
            // 通知导入进度
            let event = ExportImportEvent {
                id: id.clone(),
                ok_count,
                err_count,
                total_count,
                ignore_count,
                finished: false,
            };
            let _ = &app_handle.emit(EVENT_IMPORT, event);
        }
    }

    let event = ExportImportEvent {
        id: id.clone(),
        ok_count,
        err_count,
        total_count,
        ignore_count,
        finished: true,
    };
    let _ = &app_handle.emit(EVENT_IMPORT, event);
    Ok(())
}

fn import_key(
    conn: &mut impl Commands,
    line: &str,
    ttl: i64,
    handle_ttl: &str,
    handle_conflict: &str,
) -> AnyResult<()> {
    let parts: Vec<&str> = line.split(',').collect();
    if parts.len() != 2 && parts.len() != 3 {
        bail!(AppError::ImportInvalidLine { line: line.into() })
    }

    let ttl_part = if parts.len() == 3 { parts[2] } else { "-1" };

    // https://redis.ac.cn/docs/latest/commands/restore/
    // RESTORE key ttl serialized-value [REPLACE] [ABSTTL] [IDLETIME seconds] [FREQ frequency]
    // 如果 ttl 为 0，则创建键时不设置过期时间；否则，设置指定的过期时间（以毫秒为单位）。
    // 除非使用 REPLACE 修饰符，否则当 key 已存在时，RESTORE 将返回“Target key name is busy”错误。
    let key = BASE64_STANDARD.decode(parts[0])?;
    let value = BASE64_STANDARD.decode(parts[1])?;
    let ttl = import_restore_ttl(ttl_part, ttl, handle_ttl);

    let mut cmd = redis::cmd("restore");
    cmd.arg(&key).arg(ttl).arg(value);
    if handle_conflict == "replace" {
        cmd.arg("replace");
    }
    let _: () = cmd.query(conn)?;
    Ok(())
}

fn import_restore_ttl(part_ttl: &str, ttl: i64, handle_ttl: &str) -> i64 {
    let ttl = match handle_ttl {
        "custom" => ttl,
        "parse" => part_ttl.parse::<i64>().unwrap_or(-1),
        _ => -1,
    };

    // 注意: 导出时TTL命令返回的单位是秒, restore的ttl参数是毫秒
    if ttl <= 0 { 0 } else { ttl * 1000 }
}

pub fn import_cmd_0_thread(
    conn: &mut impl Commands,
    file: String,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) {
    info!("import cmd file: {}", &file);
    let result = import_cmds(conn, file, running.clone(), app_handle, id);
    match result {
        Ok(_) => info!("import cmd file ok"),
        Err(e) => warn!("import cmd file err: {e}"),
    }
    running.store(false, Relaxed);
}

fn import_cmds(
    conn: &mut impl Commands,
    file: String,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) -> AnyResult<()> {
    let reader = BufReader::new(File::open(&file)?);
    let total_count = reader.lines().count() as u64;
    info!("import cmds lines: {}", total_count);

    let mut ok_count = 0;
    let mut err_count = 0;

    let reader = BufReader::new(File::open(&file)?);
    for line in reader.lines() {
        let line = line?;
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if running.load(Relaxed) {
            let result = import_cmd(conn, line);
            match result {
                Ok(_) => ok_count += 1,
                Err(e) => {
                    warn!("import cmd err: {e}");
                    err_count += 1
                }
            }
            // 通知导入进度
            let event = ExportImportEvent {
                id: id.clone(),
                ok_count,
                err_count,
                total_count,
                ignore_count: 0,
                finished: false,
            };
            let _ = &app_handle.emit(EVENT_IMPORT, event);
        }
    }

    let event = ExportImportEvent {
        id: id.clone(),
        ok_count,
        err_count,
        total_count,
        ignore_count: 0,
        finished: true,
    };
    let _ = &app_handle.emit(EVENT_IMPORT, event);
    Ok(())
}

fn import_cmd(mut conn: &mut impl Commands, line: &str) -> AnyResult<()> {
    info!("line: {}", line);
    let (cmd, args) = parse_command(line)?;
    redis::cmd(cmd.as_str()).arg(args).exec(&mut conn)?;
    Ok(())
}

pub fn key_type0(mut conn: MutexGuard<impl Commands>, key: RedisKey) -> AnyResult<String> {
    // 简单字符串回复：key 的类型，如果 key 不存在则返回 none
    let key_type: ValueType = conn.key_type(&key)?;
    Ok(ui_key_type(key_type))
}

pub fn xinfo_groups0(
    mut conn: MutexGuard<impl Commands>,
    key: RedisKey,
) -> AnyResult<Vec<XInfoGroup>> {
    let reply: StreamInfoGroupsReply = conn.xinfo_groups(&key)?;
    Ok(reply.groups.into_iter().map(ui_xinfo_group).collect())
}

pub fn xinfo_consumers0(
    mut conn: MutexGuard<impl Commands>,
    key: RedisKey,
    group: String,
) -> AnyResult<Vec<XInfoConsumer>> {
    let reply: StreamInfoConsumersReply = conn.xinfo_consumers(&key, &group)?;
    Ok(reply.consumers.into_iter().map(ui_xinfo_consumer).collect())
}

pub fn flush_db0(mut conn: MutexGuard<impl Commands>) -> AnyResult<()> {
    let _: () = conn.flushdb()?;
    Ok(())
}

pub fn flush_all0(mut conn: MutexGuard<impl Commands>) -> AnyResult<()> {
    let _: () = conn.flushall()?;
    Ok(())
}

// 集群和单机共享的方法, 由于Commands不是dyn 兼容的, 无法直接写在父类中(也许有其他办法?)
#[macro_export]
macro_rules! implement_pipeline_commands {
    ($struct_name:ident) => {
        fn mock_data(&self, count: u64) -> AnyResult<()> {
            let mut pipe = $struct_name::with_capacity(count as usize);
            for _ in 0..count {
                // string
                let key = format!("redis-me-mock:string:{}", random_string(10));
                pipe.set(&key, random_string(10)).ignore();

                // hash
                let field_count = random_range(3, 200);
                let key = format!("redis-me-mock:hash:{}", random_string(10));
                for x in 0..field_count {
                    pipe.hset(&key, format!("key{x}"), random_string(10))
                        .ignore();
                }

                // list
                let key = format!("redis-me-mock:list:{}", random_string(10));
                for _ in 0..field_count {
                    pipe.rpush(&key, random_string(10)).ignore();
                }

                // set
                let key = format!("redis-me-mock:set:{}", random_string(10));
                for _ in 0..field_count {
                    pipe.sadd(&key, random_string(10)).ignore();
                }

                // zset
                let key = format!("redis-me-mock:zset:{}", random_string(10));
                for _ in 0..field_count {
                    pipe.zadd(&key, random_string(10), random_range(1, 100))
                        .ignore();
                }
            }

            let mut conn = self.get_conn()?;
            let _: () = pipe.query(&mut conn)?;
            Ok(())
        }
    };
}
