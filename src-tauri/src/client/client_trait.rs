use crate::client::unified::{UnifiedClient, UnifiedConn, UnifiedProp};
use crate::utils::conn::{get_client_single, set_client_name};
use crate::utils::model::*;
use crate::utils::util::{assert_is_true, parse_client_info, parse_command, random_range, random_string, redis_value_to_log, redis_value_to_string, tuple_to_key_size, vec8_to_display_string, AnyResult, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE};
use anyhow::bail;
use chrono::Local;
use log::info;
use redis::aio::MultiplexedConnection;
use redis::cluster_routing::{RoutingInfo, SingleNodeRoutingInfo};
use redis::{from_redis_value, AsyncCommands, FromRedisValue, IntegerReplyOrNoOp, Msg, Pipeline, SetExpiry, SetOptions, Value, ValueType};
use std::collections::{HashMap, HashSet};
use std::sync::atomic::Ordering;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use Ordering::Relaxed;
use std::thread;

/// RedisME服务接口
pub trait RedisMeClient: Send + Sync {

    fn get_prop(&self) -> &UnifiedProp;

    // 获取节点路由 ==> 方便统一config_get/set等方法
    fn get_node_route(&self, node: Option<String>) -> AnyResult<(RoutingInfo, String)> {
        let route_info = RoutingInfo::SingleNode(SingleNodeRoutingInfo::Random);
        Ok((route_info, node.unwrap_or("single".to_string())))
    }

    async fn init(redis_conn: &RedisConn) -> AnyResult<UnifiedClient>;

    async fn get_conn(&self) -> AnyResult<UnifiedConn>;

    async fn new_conn_single(&mut self) -> AnyResult<MultiplexedConnection> {
        let client = get_client_single(&self.get_prop().conf)?;
        let mut conn = client.get_multiplexed_async_connection().await?;
        set_client_name(&mut conn).await?;
        Ok(conn)
    }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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

    async fn select_db(&self, db: u8) -> AnyResult<()> {
        let prop = self.get_prop();
        if prop.db.load(Relaxed) == db {
            return Ok(());
        }
        prop.db.store(db, Relaxed);

        let mut conn = self.get_conn().await?;
        let _: () = redis::cmd("SELECT").arg(db).query_async(&mut conn).await?;
        info!("select db: {}", db);
        Ok(())
    }

    async fn info(&self, node: Option<String>) -> AnyResult<RedisInfo> {
        let mut conn = self.get_conn().await?;
        let (route, exec_node) = self.get_node_route(node)?;
        let value = conn.route_command(redis::cmd("info"), route).await?;
        let info: String = FromRedisValue::from_redis_value(value)?;
        Ok(RedisInfo {
            node: exec_node,
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
            ValueType::Hash => {
                for f in fv_list {
                    conn.hset(&key, f.field_key, f.field_value).await?;
                }
            },
            ValueType::List => {
                if "lpush" == param.list_push_method {
                    // 插入头部时保持原有顺序
                    for f in fv_list.iter().rev() {
                        conn.lpush(&key, f.field_value).await?;
                    }
                } else {
                    for f in fv_list {
                        conn.rpush(&key, f.field_value).await?;
                    }
                }
            }
            ValueType::Set => {
                for f in fv_list {
                    conn.sadd(&key, f.field_value).await?;
                }
            }
            ValueType::ZSet => {
                for f in fv_list {
                    conn.zadd(&key, f.field_value, f.field_score).await?;
                }
            },
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

    async fn field_set(&self, param: RedisFieldSet) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let key: RedisKey = param.key;
        let key_type: ValueType = conn.key_type(&key).await?;

        match key_type {
            ValueType::Hash => {
                let _: () = conn.hset(&key, param.field_key, param.field_value).await?;
            }
            ValueType::List => {
                let _: () = conn.lset(&key, param.field_index, param.field_value).await?;
            }
            ValueType::Set => {
                let _: () = conn.srem(&key, param.src_field_value).await?;
                let _: () = conn.sadd(&key, param.field_value).await?;
            }
            ValueType::ZSet => {
                let _: () = conn.zrem(&key, param.src_field_value).await?;
                let _: () = conn.zadd(&key, param.field_value, param.field_score).await?;
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

    async fn field_del(&self, param: RedisFieldDel) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let key: RedisKey = param.key;
        let key_type: ValueType = conn.key_type(&key).await?;

        match key_type {
            ValueType::Hash => {
                let _: () = conn.hdel(&key, param.field_key).await?;
            }
            ValueType::List => {
                let _: () = conn.lset(&key, param.field_index, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE).await?;
                let _: () = conn.lrem(&key, 1, REDIS_ME_FIELD_TO_DELETE_TMP_VALUE).await?;
            }
            ValueType::Set => {
                let _: () = conn.srem(&key, param.field_value).await?;
            }
            ValueType::ZSet => {
                let _: () = conn.zrem(&key, param.field_value).await?;
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

    async fn execute_command(&self, param: RedisCommand) -> AnyResult<String> {
        let (cmd, args) = parse_command(param.command.as_str())?;
        if cmd.is_empty() {
            return Ok("".into());
        };

        let mut conn = self.get_conn().await?;
        let value = redis::cmd(cmd.as_str()).arg(args).query_async(&mut conn).await?;
        Ok(redis_value_to_string(value, "\n"))
    }

    async fn config_get(&self, pattern: &str, node: Option<String>)
    -> AnyResult<HashMap<String, String>> {
        let mut conn = self.get_conn().await?;
        let (route, _) = self.get_node_route(node)?;
        let value = conn.route_command(*redis::cmd("config").arg("get").arg(pattern), route).await?;
        let result: HashMap<String, String> = FromRedisValue::from_redis_value(value)?;
        Ok(result)
    }

    async fn config_set(&self, key: &str, value: &str, node: Option<String>) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let (route, _) = self.get_node_route(node)?;
        let _ = conn.route_command(*redis::cmd("config").arg("set").arg(key).arg(value), route).await?;
        Ok(())
    }

    async fn slow_log(&self, count: Option<u64>, _node: Option<String>) -> AnyResult<Vec<RedisSlowLog>> {
        let mut conn = self.get_conn().await?;
        let mut logs = vec![];
        let value_list: Vec<Value> = redis::cmd("slowlog")
            .arg("get")
            .arg(count.unwrap_or(128))
            .query_async(&mut conn).await?;
        for value in value_list {
            let log = redis_value_to_log(value, "")?;
            logs.push(log);
        }
        Ok(logs)
    }

    async fn memory_usage(&self, param: RedisMemoryParam) -> AnyResult<Vec<RedisKeySize>> {
        let mut conn = self.get_conn().await?;
        let mut keys: Vec<(Vec<u8>, u64, String)> = vec![];

        let mut scan_times = 0;
        let mut cursor = 0;
        loop {
            let mut cmd = redis::cmd("scan");
            cmd.arg(cursor)
                .arg("match")
                .arg(param.pattern.clone().unwrap_or("*".into()))
                .arg("count")
                .arg(param.scan_count);
            let (next_cursor, new_keys): (u64, Vec<Vec<u8>>) = cmd.query_async(&mut conn).await?;
            cursor = next_cursor;

            // 计算键大小
            if !new_keys.is_empty() {
                let mut pipe = redis::pipe();
                for key in new_keys.iter() {
                    pipe.cmd("memory").arg("usage").arg(key);
                }

                let sizes: Vec<Option<u64>> = pipe.query_async(&mut conn).await?;
                for (index, size) in sizes.into_iter().enumerate() {
                    if let Some(size) = size && size >= param.size_limit {
                        keys.push((new_keys[index].clone(), size, "unknown".into()));
                    }
                }
            }

            scan_times += 1;

            if param.count_limit > 0 && keys.len() >= param.count_limit as usize {
                info!("扫描结果>={}个, 返回", param.count_limit);
                break;
            }

            if param.scan_total > 0 && scan_times * param.scan_count >= param.scan_total {
                info!("已扫描键>={}个, 返回", param.scan_total);
                break;
            }

            tokio::time::sleep(Duration::from_millis(param.sleep_millis)).await;

            if cursor == 0 {
                break;
            }
        }

        // 计算键类型
        if param.need_key_type.unwrap_or(false) && !keys.is_empty() {
            let mut pipe = Pipeline::with_capacity(keys.len());
            for key in keys.iter() {
                pipe.cmd("type").arg(&key.0);
            }
            let types: Vec<Option<String>> = pipe.query(&mut conn)?;
            for (index, key_type) in types.into_iter().enumerate() {
                keys[index].2 = key_type.unwrap_or("deleted".into());
            }
        }

        // 映射为返回值
        Ok(tuple_to_key_size(keys))
    }

    async fn client_list(
        &self,
        _node: Option<String>,
        client_type: Option<String>,
    ) -> AnyResult<Vec<RedisClientInfo>> {
        let mut conn = self.get_conn().await?;
        let mut cmd = redis::cmd("client");
        cmd.arg("list");
        if let Some(ref client_type_val) = client_type
            && !client_type_val.is_empty()
        {
            cmd.arg("type").arg(client_type_val);
        }
        let client: String = cmd.query_async(&mut conn).await?;

        let mut clients = vec![];
        for client_info in client.lines() {
            let client: RedisClientInfo = parse_client_info(client_info)?;
            clients.push(client);
        }
        Ok(clients)
    }

    async fn publish(&self, channel: &str, message: &str) -> AnyResult<()> {
        let mut conn = self.get_conn().await?;
        let _: () = conn.publish(channel, message).await?;
        Ok(())
    }

    fn subscribe(&self, app_handle: AppHandle, channel: Option<String>) -> AnyResult<()> {
        let client = get_client_single(&self.get_prop().conf)?;
        let mut conn = client.get_connection()?;
        //set_client_name(&mut conn).await?;

        let prop = self.get_prop();
        prop.subscribe_running.store(true, Relaxed);

        let channel = channel
            .filter(|c| !c.is_empty())
            .unwrap_or_else(|| "*".into());

        thread::spawn(move || {
            conn.send_packed_command(&redis::cmd("PSUBSCRIBE").arg(&channel).get_packed_command())?;
            info!("subscribe start: {}", &channel);
            while prop.subscribe_running.load(Relaxed) {
                let response = conn.recv_response()?;
                if let Some(msg) = Msg::from_value(&response) {
                    let payload: String = msg.get_payload()?;
                    let event = SubscribeEvent {
                        id: prop.id.clone(),
                        datetime: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
                        channel: msg.get_channel_name().to_string(),
                        message: payload,
                    };
                    let _ = &app_handle.emit("subscribe", event);
                }
            }
            info!("subscribe end: {}", &channel);
        });
        Ok(())
    }

    fn subscribe_stop(&self) -> AnyResult<()> {
        let prop = self.get_prop();
        prop.subscribe_running.store(false, Relaxed);
        Ok(())
    }

    fn monitor(&self, app_handle: AppHandle, _node: &str) -> AnyResult<()> {
        let client = get_client_single(&self.get_prop().conf)?;
        let mut conn = client.get_connection()?;
        //set_client_name(&mut conn).await?;

        let prop = self.get_prop();
        prop.monitor_running.store(true, Relaxed);

        thread::spawn( move || {
            conn.send_packed_command(&redis::cmd("MONITOR").get_packed_command())?;
            info!("monitor start");
            while prop.monitor_running.load(Relaxed) {
                let response = conn.recv_response()?;
                let command: String = from_redis_value(response)?;
                let event = MonitorEvent {
                    id: prop.id.clone(),
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

    fn monitor_stop(&self) -> AnyResult<()> {
        let prop = self.get_prop();
        prop.monitor_running.store(false, Relaxed);
        Ok(())
    }

    async fn batch_del(&self, param: RedisBatchDelete) -> AnyResult<()> {
        let key_list = if param.key_list.is_empty() {
            if param.pattern.is_empty() {
                bail!("键列表和匹配参数不能同时为空")
            }
            let scan_result = self.scan(ScanParam::all(param.pattern)).await?;
            info!("扫描出键个数: {}", scan_result.key_list.len());
            scan_result.key_list
        } else {
            param.key_list
        };

        if key_list.is_empty() {
            return Ok(());
        }

        let size = key_list.len();
        let mut pipe = redis::pipe();
        for key in key_list.into_iter() {
            pipe.del(&key).ignore();
        }
        let mut conn = self.get_conn().await?;
        let _: () = pipe.query_async(&mut conn).await?;
        info!("批量删除键完成: {}", size);
        Ok(())
    }

    async fn mock_data(&self, count: u64) -> AnyResult<()> {
        let mut pipe = redis::pipe();
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

        let mut conn = self.get_conn().await?;
        let _: () = pipe.query_async(&mut conn).await?;
        Ok(())
    }
}

