use crate::client::client_trait::*;
use crate::implement_pipeline_commands;
use crate::utils::conn::{get_client_single, set_client_name};
use crate::utils::model::*;
use crate::utils::util::*;
use anyhow::bail;
use chrono::Utc;
use log::info;
use parking_lot::{Mutex, MutexGuard};
use redis::{Client, Connection, ConnectionLike, Pipeline, Value};
use std::collections::{HashMap};
use std::ops::Deref;
use std::sync::atomic::Ordering::Relaxed;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;

pub struct RedisMeSingle {
    base:  RedisMeBase,
    client: Client,
    conn: Mutex<Connection>,
}

impl Deref for RedisMeSingle {
    type Target = RedisMeBase;

    fn deref(&self) -> &Self::Target {
        &self.base
    }
}

impl Drop for RedisMeSingle {
    fn drop(&mut self) {
        self.subscribe_stop().unwrap_or(());
        self.monitor_stop().unwrap_or(());
    }
}

impl RedisMeClient for RedisMeSingle {

    fn name(&self) -> String {
        self.conf.name.clone()
    }

    fn db_list(&self) -> AnyResult<Vec<RedisDB>> {
        let map = self.config_get("databases", None)?;
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

    fn select_db(&self, db: u8) -> AnyResult<()> {
        if self.db.load(Relaxed) == db {
            return Ok(());
        }

        self.db.store(db, Relaxed);
        let mut conn = self.get_conn()?;
        let _: () = redis::cmd("SELECT").arg(db).query(&mut conn)?;
        info!("select db: {}", db);
        Ok(())
    }

    fn info(&self, _node: Option<String>) -> AnyResult<RedisInfo> {
        let mut conn = self.get_conn()?;
        let info: String = redis::cmd("info").query(&mut conn)?;
        Ok(RedisInfo {
            node: "".to_string(),
            info,
        })
    }

    fn info_list(&self) -> AnyResult<Vec<RedisInfo>> {
        let info = self.info(None)?;
        Ok(vec![info])
    }

    fn node_list(&self) -> AnyResult<Vec<RedisNode>> {
        Ok(vec![])
    }

    fn scan(&self, param: ScanParam) -> AnyResult<ScanResult> {
        let mut conn = self.get_conn()?;
        let mut cc = param.cursor.unwrap_or_default();
        let batch_count = scan_0_batch_count(&param.pattern);

        let mut keys: Vec<Vec<u8>> = vec![];

        loop {
            let cmd = scan_1_cmd(cc.now_cursor, &param.pattern, batch_count, param.scan_type.clone());
            let (next_cursor, new_keys): (u64, Vec<Vec<u8>>) = cmd.query(&mut conn)?;
            keys.extend(new_keys);

            cc.now_cursor = next_cursor;
            if next_cursor == 0 {
                cc.finished = true;
                break;
            }

            if !param.load_all && param.count > 0 && keys.len() >= param.count as usize {
                break;
            }
        }

        Ok(ScanResult {
            cursor: cc,
            key_list: ui_key_list(keys),
        })
    }

    fn field_scan(&self, param: FieldScanParam) -> AnyResult<FieldScanResult> {
        let mut conn = self.get_conn()?;
        let (mut value, key_type, mut cc) = field_scan_0_get(&mut conn, param.clone())?;

        let key = param.key;
        if value.is_none() {
            let mut scan_value = FieldScanValue::default();
            let mut ready_count = 0;
            loop {
                let cmd = field_scan_1_cmd(&key_type, &key, cc.now_cursor, param.count)?;
                let (next_cursor, new_value): (u64, Value) = cmd.query(&mut conn)?;
                let new_count = field_scan_2_value(&key_type, &mut scan_value, new_value)?;

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

        field_scan_4_return(conn, key, key_type, value.unwrap_or_default(), cc)
    }

    fn get(&self, key: RedisKey, hash_key: Option<String>) -> AnyResult<RedisValue> {
        get0(self.get_conn()?, key, hash_key)
    }

    fn ttl(&self, key: RedisKey, ttl: i64) -> AnyResult<()> {
        ttl0(self.get_conn()?, key, ttl)
    }

    fn set(&self, key: RedisKey, value: String, ttl: i64) -> AnyResult<()> {
        set0(self.get_conn()?, key, value, ttl)
    }

    fn del(&self, key: RedisKey) -> AnyResult<()> {
        del0(self.get_conn()?, key)
    }

    fn field_add(&self, param: RedisFieldAdd) -> AnyResult<()> {
        field_add0(self.get_conn()?, param)
    }

    fn field_set(&self, param: RedisFieldSet) -> AnyResult<()> {
        field_set0(self.get_conn()?, param)
    }

    fn field_del(&self, param: RedisFieldDel) -> AnyResult<()> {
        field_del0(self.get_conn()?, param)
    }

    fn execute_command(&self, param: RedisCommand) -> AnyResult<String> {
        let (cmd, args) = parse_command(param.command.as_str())?;
        if cmd.is_empty() {
            return Ok("".into());
        };

        let mut conn = self.get_conn()?;
        let value = redis::cmd(cmd.as_str()).arg(args).query(&mut conn)?;
        Ok(redis_value_to_string(value, "\n"))
    }

    fn config_get(
        &self,
        pattern: &str,
        _node: Option<String>,
    ) -> AnyResult<HashMap<String, String>> {
        let mut conn = self.get_conn()?;
        let result: HashMap<String, String> = redis::cmd("config")
            .arg("get")
            .arg(pattern)
            .query(&mut conn)?;
        Ok(result)
    }

    fn config_set(&self, key: &str, value: &str, _node: Option<String>) -> AnyResult<()> {
        let mut conn = self.get_conn()?;
        let _: () = redis::cmd("config")
            .arg("set")
            .arg(key)
            .arg(value)
            .query(&mut conn)?;
        Ok(())
    }

    fn slow_log(&self, count: Option<u64>, _node: Option<String>) -> AnyResult<Vec<RedisSlowLog>> {
        let mut conn = self.get_conn()?;
        let mut logs = vec![];
        let value_list: Vec<Value> = redis::cmd("slowlog")
            .arg("get")
            .arg(count.unwrap_or(128))
            .query(&mut conn)?;
        for value in value_list {
            let log = redis_value_to_log(value, "")?;
            logs.push(log);
        }
        Ok(logs)
    }

    fn memory_usage(&self, param: RedisMemoryParam) -> AnyResult<Vec<RedisKeySize>> {
        let mut conn = self.get_conn()?;
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
            let (next_cursor, new_keys): (u64, Vec<Vec<u8>>) = cmd.query(&mut conn)?;
            cursor = next_cursor;

            // 计算键大小
            if !new_keys.is_empty() {
                let mut pipe = Pipeline::with_capacity(new_keys.len());
                for key in new_keys.iter() {
                    pipe.cmd("memory").arg("usage").arg(key);
                }

                let sizes: Vec<Option<u64>> = pipe.query(&mut conn)?;
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

            thread::sleep(Duration::from_millis(param.sleep_millis));

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

    fn client_list(
        &self,
        _node: Option<String>,
        client_type: Option<String>,
    ) -> AnyResult<Vec<RedisClientInfo>> {
        let mut conn = self.get_conn()?;
        let mut cmd = redis::cmd("client");
        cmd.arg("list");
        if let Some(ref client_type_val) = client_type
            && !client_type_val.is_empty()
        {
            cmd.arg("type").arg(client_type_val);
        }
        let client: String = cmd.query(&mut conn)?;

        let mut clients = vec![];
        for client_info in client.lines() {
            let client: RedisClientInfo = parse_client_info(client_info)?;
            clients.push(client);
        }
        Ok(clients)
    }

    fn publish(&self, channel: &str, message: &str) -> AnyResult<()> {
        publish0(self.get_conn()?, channel, message)
    }

    fn subscribe(&self, app_handle: AppHandle, channel: Option<String>) -> AnyResult<()> {
        let conn = self.client.get_connection()?;
        let id = self.id.clone();
        let running = self.subscribe_running.clone();
        subscribe0(conn, running, app_handle, channel, id)
    }

    fn subscribe_stop(&self) -> AnyResult<()> {
        subscribe_stop0(self.subscribe_running.clone())
    }

    fn monitor(&self, app_handle: AppHandle, _node: &str) -> AnyResult<()> {
        let conn = self.client.get_connection()?;
        let id = self.id.clone();
        let running = self.monitor_running.clone();
        monitor0(conn, running, app_handle, id)
    }

    fn monitor_stop(&self) -> AnyResult<()> {
        monitor_stop0(self.monitor_running.clone())
    }

    implement_pipeline_commands!(Pipeline);
}

// 个性化方法
impl RedisMeSingle {
    pub fn init(redis_conn: &RedisConf) -> AnyResult<Box<dyn RedisMeClient>> {
        let client = get_client_single(redis_conn)?;
        let conn = Self::new_conn(&client, redis_conn.db)?;
        info!("Redis单机连接初始化成功: {}", redis_conn.name);
        Ok(Box::new(RedisMeSingle {
            base: RedisMeBase::from(redis_conn),
            client,
            conn: Mutex::new(conn),
        }))
    }

    fn new_conn(client: &Client, db: u8) -> AnyResult<Connection> {
        let mut conn = client.get_connection()?;

        // 设置客户端名称
        set_client_name(&mut conn)?;

        // 切换到当前的数据库
        if db != 0 {
            let _: () = redis::cmd("SELECT").arg(db).query(&mut conn)?;
            info!("SELECT {db}");
        }
        Ok(conn)
    }

    // 重新连接
    fn reconnect(&self) -> AnyResult<()> {
        let new_conn = Self::new_conn(&self.client, self.db.load(Relaxed))?;
        let mut conn_guard = self.conn.lock(); // 使用阻塞锁来替换连接
        *conn_guard = new_conn;
        self.last_check_time.store(Utc::now().timestamp(), Relaxed);
        info!("Redis单机连接重连成功: {}", self.conf.name);
        Ok(())
    }

    // 获取已经建立的连接
    fn get_conn(&'_ self) -> AnyResult<MutexGuard<'_, Connection>> {
        // match self.conn.lock() {
        //     Ok(conn) => Ok(conn),
        //     Err(_) => {
        //         bail!("获取连接加锁失败");
        //     }
        // }
        // 标准库的Mutex不支持重入及超时时间设置，因此引入parking_lot解决此问题
        // 备注: parking_lot的 ReentrantMutexGuard 不支持 deref_mut 所以暂不支持重入
        match self.conn.try_lock_for(Duration::from_secs(10)) {
            Some(mut conn) => Ok({
                let curr = Utc::now().timestamp();
                let last = self.last_check_time.load(Relaxed);
                if conn.is_open() && curr - last < CONNECTION_CHECK_SECONDS {
                    conn
                } else {
                    self.last_check_time.store(curr, Relaxed);
                    if conn.check_connection() {
                        info!("检查Redis单机连接正常: {}", self.conf.name);
                        conn
                    } else {
                        drop(conn);  // 此处一定要释放锁
                        self.reconnect()?;
                        self.get_conn()?
                    }
                }
            }),
            None => bail!("Connection acquisition lock timeout")
        }
    }
}
