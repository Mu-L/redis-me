use crate::client::unified_conn::UnifiedConn;
use crate::utils::conn::set_client_name;
use crate::utils::model::*;
use crate::utils::util::{
    assert_is_true, vec8_to_display_string, AnyResult, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE,
};
use anyhow::bail;
use chrono::Local;
use log::info;
use parking_lot::MutexGuard;
use redis::{from_redis_value, AsyncCommands, Connection, IntegerReplyOrNoOp, Msg, SetExpiry, SetOptions, ValueType};
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::thread::JoinHandle;
use tauri::{AppHandle, Emitter};

/// RedisME服务接口
pub trait RedisMeClient: Send + Sync {

    async fn get_conn(&self) -> AnyResult<UnifiedConn>;

    async fn set_client_name(&self) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let _: () = redis::cmd("CLIENT")
            .arg("SETNAME")
            .arg("RedisME")
            .query_async(&mut conn).await?;
        info!("设置客户端名称RedisME成功");
        Ok(())
    }

    async fn select_db(&self, db: u8) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let _: () = redis::cmd("SELECT").arg(db).query_async(&mut conn).await?;
        info!("select db: {}", db);
        Ok(())
    }

    async fn db_list(&self) -> AnyResult<Vec<RedisDB>> {
        let map = self.config_get("databases", None).await?;
        let db_count = map
            .get("databases")
            .unwrap_or(&"0".to_string())
            .parse::<u8>()?;
        info!("db_count: {}", db_count);
        let mut db_list = vec![];
        for i in 0..db_count {
            db_list.push(RedisDB {
                db: i,
                name: "".to_string(),
                size: 0,
            })
        }
        Ok(db_list)
    }

    async fn info(&self, node: Option<String>) -> AnyResult<RedisInfo> {
        let mut conn = self.get_conn().await?;
        let info: String = redis::cmd("info").query_async(&mut conn).await?;
        Ok(RedisInfo {
            node: "".to_string(),
            info,
        })
    }

    async fn info_list(&self) -> AnyResult<Vec<RedisInfo>> {
        let info = self.info(None).await?;
        Ok(vec![info])
    }

    async fn node_list(&self) -> AnyResult<Vec<RedisNode>> {
        Ok(vec![])
    }

    async fn scan(&self, param: ScanParam) -> AnyResult<ScanResult> {
        let mut conn = self.get_conn().await?;

        let mut cc = param.cursor.unwrap_or_default();
        let batch_count = if param.pattern.replace("*", "").chars().count() <= 1 {
            1000
        } else {
            10000
        };

        let mut keys: Vec<Vec<u8>> = vec![];

        loop {
            let mut cmd = redis::cmd("scan");
            cmd.arg(cc.now_cursor)
                .arg("match")
                .arg(param.pattern.clone())
                .arg("count")
                .arg(batch_count);

            if let Some(ref scan_type) = param.scan_type
                && !scan_type.is_empty()
            {
                cmd.arg("type").arg(scan_type);
            }

            let (next_cursor, new_keys): (u64, Vec<Vec<u8>>) = cmd.query_async(&mut conn).await?;
            keys.extend(new_keys);

            cc.now_cursor = next_cursor;
            if !param.load_all && param.count > 0 && keys.len() >= param.count as usize {
                break;
            }

            if next_cursor == 0 {
                cc.finished = true;
                break;
            }
        }

        // 映射为返回值
        let key_list = keys
            .into_iter()
            .map(|key| RedisKey {
                key: vec8_to_display_string(&key),
                bytes: key,
            })
            .collect();

        Ok(ScanResult {
            cursor: cc,
            key_list,
        })
    }

    async fn get(&self, key: RedisKey, hash_key: Option<String>) -> AnyResult<RedisValue> {
        let mut conn = self.get_conn().await?;
        let ttl: i64 = match conn.ttl(&key).await? {
            IntegerReplyOrNoOp::IntegerReply(ttl) => ttl as i64,
            IntegerReplyOrNoOp::NotExists => {
                bail!("NotExists: {}", vec8_to_display_string(key.to_bytes()))
            }
            IntegerReplyOrNoOp::ExistsButNotRelevant => {
                bail!("ExistsButNotRelevant: {}", vec8_to_display_string(key.to_bytes()))
            }
            _ => {
                bail!("TTL error: {}", vec8_to_display_string(key.to_bytes()))
            }
        };

        let key_type: ValueType = conn.key_type(&key).await?;

        let value: serde_json::Value = match key_type {
            ValueType::Unknown(other) => {
                if "none" == other {
                    bail!("键不存在: {}", vec8_to_display_string(key.to_bytes()))
                } else {
                    bail!("未知类型: {other}")
                }
            }
            ValueType::String => {
                let value: Vec<u8> = conn.get(&key).await?;
                let value: String = vec8_to_display_string(&value);
                serde_json::to_value(value)
            }
            // 注意: 原始返回的信息用Vec<u8>接收，再手动转换为String，避免无效UTF8字符串时直接报错
            ValueType::List => {
                let value: Vec<Vec<u8>> = conn.lrange(&key, 0, -1).await?;
                let value: Vec<String> = value.iter().map(|v| vec8_to_display_string(v)).collect();
                serde_json::to_value(value)
            }
            ValueType::Set => {
                let value: HashSet<Vec<u8>> = conn.smembers(&key).await?;
                let value: Vec<String> = value.iter().map(|v| vec8_to_display_string(v)).collect();
                serde_json::to_value(value)
            }
            ValueType::ZSet => {
                let value: Vec<(Vec<u8>, f64)> = conn.zrange_withscores(&key, 0, -1).await?;
                let list: Vec<RedisZetItem> = value
                    .into_iter()
                    .map(|(value, score)| RedisZetItem {
                        value: vec8_to_display_string(&value),
                        score,
                    })
                    .collect();
                serde_json::to_value(list)
            }
            ValueType::Hash => {
                if let Some(hash_key) = hash_key
                    && !hash_key.is_empty()
                {
                    let value: Option<Vec<u8>> = conn.hget(&key, &hash_key).await?;
                    if let Some(str) = value {
                        let value: String = vec8_to_display_string(&str);
                        serde_json::to_value(value)
                    } else {
                        bail!("哈希键不存在: {}", hash_key)
                    }
                } else {
                    let value: HashMap<Vec<u8>, Vec<u8>> = conn.hgetall(&key).await?;
                    let value = value
                        .into_iter()
                        .map(|(key, value)| {
                            let key: String = vec8_to_display_string(&key);
                            let value: String = vec8_to_display_string(&value);
                            (key, value)
                        })
                        .collect::<HashMap<String, String>>();
                    serde_json::to_value(value)
                }
            }
            ValueType::Stream => bail!("stream类型暂不支持获取值"),
            _ => todo!(),
        }?;

        Ok(RedisValue {
            key_type: key_type.into(),
            ttl,
            value,
        })

    }

    async fn ttl(&self, key: RedisKey, ttl: i64) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        if ttl < 0 {
            // 移除 key 上已有的过期时间，将键从易失（设置了过期时间的键）变为变为持久
            // 整型回复: 如果 key 不存在或没有关联的过期时间，则返回 0。
            // 整型回复: 如果已移除过期时间，则返回 1。
            let _: () = conn.persist(&key).await?;
        } else {
            // 为 key 设置超时时间。超时时间到期后，该 key 将被自动删除。
            // 请注意，调用 EXPIRE/`PEXPIRE` 时使用非正数超时，或调用 `EXPIREAT`/`PEXPIREAT` 时使用过去的时间，
            // 将导致 key 被 删除 而非过期（相应地，发出的 key 事件 将是 del，而不是 expired）。
            // 整数回复：如果未设置超时时间则返回 0；例如，key 不存在，或者由于提供的参数而跳过了操作。
            // 整数回复：如果已设置超时时间则返回 1。
            let _: () = conn.expire(&key, ttl).await?;
        };
        Ok(())
    }

    async fn set(&self, key: RedisKey, value: String, ttl: i64) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        if ttl < 0 {
            let _: () = conn.set(&key, value).await?;
        } else {
            let options = SetOptions::default().with_expiration(SetExpiry::EX(ttl as u64));
            let _: () = conn.set_options(&key, value, options).await?;
        };
        Ok(())
    }

    async fn del(&self, key: RedisKey) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let _: () = conn.del(&key).await?;
        Ok(())
    }

    async fn field_add(&self, param: RedisFieldAdd) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let key: RedisKey = param.key.into();
        let mode = param.mode;
        let mut key_type = ValueType::from(param.key_type);

        if "key" == mode {
            // 新增键
            let exists: bool = conn.exists(&key).await?;
            assert_is_true(
                !exists,
                format!("键已存在: {}", vec8_to_display_string(key.to_bytes())),
            )?
        } else if "field" == mode {
            // 新增字段
            key_type = conn.key_type(&key).await?
        } else {
            bail!("模式: {} 暂不支持", mode)
        }

        let fv_list = param.field_value_list;

        match key_type {
            ValueType::String => conn.set(&key, &param.value).await?,
            ValueType::Hash => fv_list
                .into_iter()
                .try_for_each(async |f| conn.hset(&key, f.field_key, f.field_value).await)?,
            ValueType::List => {
                if "lpush" == param.list_push_method {
                    // 插入头部时保持原有顺序
                    fv_list
                        .into_iter()
                        .rev()
                        .try_for_each(|fv| conn.lpush(&key, fv.field_value).await)?;
                } else {
                    fv_list
                        .into_iter()
                        .try_for_each(|f| conn.rpush(&key, f.field_value).await)?;
                }
            }
            ValueType::Set => fv_list
                .into_iter()
                .try_for_each(async |f| conn.sadd(&key, f.field_value).await)?,
            ValueType::ZSet => fv_list
                .into_iter()
                .try_for_each(async |f| conn.zadd(&key, f.field_value, f.field_score).await)?,
            ValueType::Stream => bail!("stream类型暂不支持新增字段值"),
            ValueType::Unknown(other) => {
                if "none" == other {
                    bail!("键不存在: {}", vec8_to_display_string(key.to_bytes()))
                } else {
                    bail!("未知类型: {other}")
                }
            }
            _ => todo!(),
        };

        if "key" == mode && param.ttl > 0 {
            let _: () = conn.expire(&key, param.ttl).await?;
        }
        Ok(())
    }

    async fn field_set(&self, param: RedisFieldSet) -> AnyResult<()>;

    async fn field_del(&self, param: RedisFieldDel) -> AnyResult<()>;

    async fn execute_command(&self, param: RedisCommand) -> AnyResult<String>;

    async fn config_get(&self, pattern: &str, node: Option<String>)
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

    fn batch_del(&self, param: RedisBatchDelete) -> AnyResult<()>;
    fn mock_data(&self, count: u64) -> AnyResult<()>;


}

// 通用实现: 由于Connection动态兼容问题，无法写在接口里面，因此写在方法中

pub fn get0(
    mut conn: MutexGuard<impl Commands>,
    key: RedisKey,
    hash_key: Option<String>,
) -> AnyResult<RedisValue> {
    let ttl: i64 = conn.ttl(&key)?;
    let key_type: ValueType = conn.key_type(&key)?;

    let value: serde_json::Value = match key_type {
        ValueType::Unknown(other) => {
            if "none" == other {
                bail!("键不存在: {}", vec8_to_display_string(key.to_bytes()))
            } else {
                bail!("未知类型: {other}")
            }
        }
        ValueType::String => {
            let value: Vec<u8> = conn.get(&key)?;
            let value: String = vec8_to_display_string(&value);
            serde_json::to_value(value)
        }
        // 注意: 原始返回的信息用Vec<u8>接收，再手动转换为String，避免无效UTF8字符串时直接报错
        ValueType::List => {
            let value: Vec<Vec<u8>> = conn.lrange(&key, 0, -1)?;
            let value: Vec<String> = value.iter().map(|v| vec8_to_display_string(v)).collect();
            serde_json::to_value(value)
        }
        ValueType::Set => {
            let value: HashSet<Vec<u8>> = conn.smembers(&key)?;
            let value: Vec<String> = value.iter().map(|v| vec8_to_display_string(v)).collect();
            serde_json::to_value(value)
        }
        ValueType::ZSet => {
            let value: Vec<(Vec<u8>, f64)> = conn.zrange_withscores(&key, 0, -1)?;
            let list: Vec<RedisZetItem> = value
                .into_iter()
                .map(|(value, score)| RedisZetItem {
                    value: vec8_to_display_string(&value),
                    score,
                })
                .collect();
            serde_json::to_value(list)
        }
        ValueType::Hash => {
            if let Some(hash_key) = hash_key
                && !hash_key.is_empty()
            {
                let value: Option<Vec<u8>> = conn.hget(&key, &hash_key)?;
                if let Some(str) = value {
                    let value: String = vec8_to_display_string(&str);
                    serde_json::to_value(value)
                } else {
                    bail!("哈希键不存在: {}", hash_key)
                }
            } else {
                let value: HashMap<Vec<u8>, Vec<u8>> = conn.hgetall(&key)?;
                let value = value
                    .into_iter()
                    .map(|(key, value)| {
                        let key: String = vec8_to_display_string(&key);
                        let value: String = vec8_to_display_string(&value);
                        (key, value)
                    })
                    .collect::<HashMap<String, String>>();
                serde_json::to_value(value)
            }
        }
        ValueType::Stream => bail!("stream类型暂不支持获取值"),
        _ => todo!(),
    }?;

    Ok(RedisValue {
        key_type: key_type.into(),
        ttl,
        value,
    })
}

pub fn ttl0(mut conn: MutexGuard<impl Commands>, key: RedisKey, ttl: i64) -> AnyResult<()> {
    if ttl < 0 {
        // 移除 key 上已有的过期时间，将键从易失（设置了过期时间的键）变为变为持久
        // 整型回复: 如果 key 不存在或没有关联的过期时间，则返回 0。
        // 整型回复: 如果已移除过期时间，则返回 1。
        let _: () = conn.persist(&key)?;
    } else {
        // 为 key 设置超时时间。超时时间到期后，该 key 将被自动删除。
        // 请注意，调用 EXPIRE/`PEXPIRE` 时使用非正数超时，或调用 `EXPIREAT`/`PEXPIREAT` 时使用过去的时间，
        // 将导致 key 被 删除 而非过期（相应地，发出的 key 事件 将是 del，而不是 expired）。
        // 整数回复：如果未设置超时时间则返回 0；例如，key 不存在，或者由于提供的参数而跳过了操作。
        // 整数回复：如果已设置超时时间则返回 1。
        let _: () = conn.expire(&key, ttl)?;
    };
    Ok(())
}

pub fn set0(
    mut conn: MutexGuard<impl Commands>,
    key: RedisKey,
    value: String,
    ttl: i64,
) -> AnyResult<()> {
    if ttl < 0 {
        let _: () = conn.set(&key, value)?;
    } else {
        let options = SetOptions::default().with_expiration(SetExpiry::EX(ttl as u64));
        let _: () = conn.set_options(&key, value, options)?;
    };
    Ok(())
}

pub fn del0(mut conn: MutexGuard<impl Commands>, key: RedisKey) -> AnyResult<()> {
    let _: () = conn.del(&key)?;
    Ok(())
}

pub fn field_add0(mut conn: MutexGuard<impl Commands>, param: RedisFieldAdd) -> AnyResult<()> {
    let key: RedisKey = param.key.into();
    let mode = param.mode;
    let mut key_type = ValueType::from(param.key_type);

    if "key" == mode {
        // 新增键
        let exists: bool = conn.exists(&key)?;
        assert_is_true(
            !exists,
            format!("键已存在: {}", vec8_to_display_string(key.to_bytes())),
        )?
    } else if "field" == mode {
        // 新增字段
        key_type = conn.key_type(&key)?
    } else {
        bail!("模式: {} 暂不支持", mode)
    }

    let fv_list = param.field_value_list;

    match key_type {
        ValueType::String => conn.set(&key, &param.value)?,
        ValueType::Hash => fv_list
            .into_iter()
            .try_for_each(|f| conn.hset(&key, f.field_key, f.field_value))?,
        ValueType::List => {
            if "lpush" == param.list_push_method {
                // 插入头部时保持原有顺序
                fv_list
                    .into_iter()
                    .rev()
                    .try_for_each(|fv| conn.lpush(&key, fv.field_value))?;
            } else {
                fv_list
                    .into_iter()
                    .try_for_each(|f| conn.rpush(&key, f.field_value))?;
            }
        }
        ValueType::Set => fv_list
            .into_iter()
            .try_for_each(|f| conn.sadd(&key, f.field_value))?,
        ValueType::ZSet => fv_list
            .into_iter()
            .try_for_each(|f| conn.zadd(&key, f.field_value, f.field_score))?,
        ValueType::Stream => bail!("stream类型暂不支持新增字段值"),
        ValueType::Unknown(other) => {
            if "none" == other {
                bail!("键不存在: {}", vec8_to_display_string(key.to_bytes()))
            } else {
                bail!("未知类型: {other}")
            }
        }
        _ => todo!(),
    };

    if "key" == mode && param.ttl > 0 {
            let _: () = conn.expire(&key, param.ttl)?;
        }
    Ok(())
}

pub fn field_set0(mut conn: MutexGuard<impl Commands>, param: RedisFieldSet) -> AnyResult<()> {
    let key: RedisKey = param.key;
    let key_type: ValueType = conn.key_type(&key)?;

    match key_type {
        ValueType::Hash => {
            let _: () = conn.hset(&key, param.field_key, param.field_value)?;
        }
        ValueType::List => {
            let _: () = conn.lset(&key, param.field_index, param.field_value)?;
        }
        ValueType::Set => {
            let _: () = conn.srem(&key, param.src_field_value)?;
            let _: () = conn.sadd(&key, param.field_value)?;
        }
        ValueType::ZSet => {
            let _: () = conn.zrem(&key, param.src_field_value)?;
            let _: () = conn.zadd(&key, param.field_value, param.field_score)?;
        }
        ValueType::String => bail!("string类型暂不支持设置字段值"),
        ValueType::Stream => bail!("stream类型暂不支持设置字段值"),
        ValueType::Unknown(other) => {
            if "none" == other {
                bail!("键不存在: {}", vec8_to_display_string(key.to_bytes()))
            } else {
                bail!("未知类型: {other}")
            }
        }
        _ => todo!(),
    };
    Ok(())
}

pub fn field_del0(mut conn: MutexGuard<impl Commands>, param: RedisFieldDel) -> AnyResult<()> {
    let key: RedisKey = param.key;
    let key_type: ValueType = conn.key_type(&key)?;

    match key_type {
        ValueType::Hash => {
            let _: () = conn.hdel(&key, param.field_key)?;
        }
        ValueType::List => {
            let _: () = conn.lset(&key, param.field_index, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE)?;
            let _: () = conn.lrem(&key, 1, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE)?;
        }
        ValueType::Set => {
            let _: () = conn.srem(&key, param.field_value)?;
        }
        ValueType::ZSet => {
            let _: () = conn.zrem(&key, param.field_value)?;
        }
        ValueType::String => bail!("string类型暂不支持删除字段值"),
        ValueType::Stream => bail!("stream类型暂不支持删除字段值"),
        ValueType::Unknown(other) => {
            if "none" == other {
                bail!("键不存在: {}", vec8_to_display_string(key.to_bytes()))
            } else {
                bail!("未知类型: {other}")
            }
        }
        _ => todo!(),
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

pub fn subscribe0(
    mut conn: Connection,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    channel: Option<String>,
    id: String,
) -> AnyResult<()> {
    set_client_name(&mut conn)?;
    running.store(true, Ordering::Relaxed);

    let channel = channel
        .filter(|c| !c.is_empty())
        .unwrap_or_else(|| "*".into());

    let _: JoinHandle<AnyResult<()>> = thread::spawn(move || {
        conn.send_packed_command(&redis::cmd("PSUBSCRIBE").arg(&channel).get_packed_command())?;
        info!("subscribe start: {}", &channel);
        while running.load(Ordering::Relaxed) {
            let response = conn.recv_response()?;
            if let Some(msg) = Msg::from_value(&response) {
                let payload: String = msg.get_payload()?;
                let event = SubscribeEvent {
                    id: id.clone(),
                    datetime: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
                    channel: msg.get_channel_name().to_string(),
                    message: payload,
                };
                let _ = &app_handle.emit("subscribe", event);
            }
        }
        info!("subscribe end: {}", &channel);
        Ok(())
    });
    Ok(())
}

pub fn subscribe_stop0(running: Arc<AtomicBool>) -> AnyResult<()> {
    running.store(false, Ordering::Relaxed);
    Ok(())
}

pub fn monitor0(
    mut conn: Connection,
    running: Arc<AtomicBool>,
    app_handle: AppHandle,
    id: String,
) -> AnyResult<()> {
    set_client_name(&mut conn)?;
    running.store(true, Ordering::Relaxed);

    let _: JoinHandle<AnyResult<()>> = thread::spawn(move || {
        conn.send_packed_command(&redis::cmd("MONITOR").get_packed_command())?;
        info!("monitor start");
        while running.load(Ordering::Relaxed) {
            let response = conn.recv_response()?;
            let command: String = from_redis_value(response)?;
            let event = MonitorEvent {
                id: id.clone(),
                datetime: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
                command,
            };
            let _ = &app_handle.emit("monitor", event);
        }
        info!("monitor end");
        Ok(())
    });

    Ok(())
}

pub fn monitor_stop0(running: Arc<AtomicBool>) -> AnyResult<()> {
    info!("monitor stop");
    running.store(false, Ordering::Relaxed);
    Ok(())
}

// 集群和单机共享的方法, 由于Commands不是dyn 兼容的, 无法直接写在父类中(也许有其他办法?)
#[macro_export]
macro_rules! implement_pipeline_commands {
    ($struct_name:ident) => {
        fn batch_del(&self, param: RedisBatchDelete) -> AnyResult<()> {
            let key_list = if param.key_list.is_empty() {
                if param.pattern.is_empty() {
                    bail!("键列表和匹配参数不能同时为空")
                }
                let scan_result = self.scan(ScanParam::all(param.pattern))?;
                info!("扫描出键个数: {}", scan_result.key_list.len());
                scan_result.key_list
            } else {
                param.key_list
            };

            if key_list.is_empty() {
                return Ok(());
            }

            let size = key_list.len();
            let mut pipe = $struct_name::with_capacity(size);
            for key in key_list.into_iter() {
                pipe.del(&key).ignore();
            }
            let mut conn = self.get_conn()?;
            let _: () = pipe.query(&mut conn)?;
            info!("批量删除键完成: {}", size);
            Ok(())
        }

        fn mock_data(&self, count: u64) -> AnyResult<()> {
            let mut pipe = $struct_name::with_capacity(count as usize);
            for _ in 0..count {
                // string
                let key = format!("redis-me-mock:string:{}", random_string(10));
                pipe.set(&key, random_string(10)).ignore();

                // hash
                let field_count = random_range(3, 20);
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
