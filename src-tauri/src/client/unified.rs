use std::collections::HashMap;
use crate::client::impl_cluster::RedisMeCluster;
use crate::client::impl_single::RedisMeSingle;
use crate::utils::model::*;
use crate::utils::util::*;
use redis::aio::{ConnectionLike, MultiplexedConnection};
use redis::cluster_async::ClusterConnection;
use redis::cluster_routing::RoutingInfo;
use redis::{Cmd, Pipeline, RedisFuture, RedisResult, Value};
use std::sync::atomic::{AtomicBool, AtomicU8};
use std::sync::Arc;
use tauri::AppHandle;
use crate::client::client_trait::RedisMeClient;
use crate::unified_commands;

/// 统一的配置属性
pub struct UnifiedProp {
    pub id: String,
    pub conf: RedisConn,
    pub db: Arc<AtomicU8>,
    pub subscribe_running: Arc<AtomicBool>,
    pub monitor_running: Arc<AtomicBool>,
}

impl From<&RedisConn> for UnifiedProp {
    fn from(conf: &RedisConn) -> Self {
        UnifiedProp {
            id: conf.id.clone(),
            conf: conf.clone(),
            db: Arc::new(AtomicU8::new(0)),
            subscribe_running: Arc::new(AtomicBool::new(false)),
            monitor_running: Arc::new(AtomicBool::new(false)),
        }
    }
}

/// 统一的Redis客户端~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
pub enum UnifiedClient {
    Single(RedisMeSingle),
    Cluster(RedisMeCluster),
}

/// 实现api调用的所有方法: 从 db_list 到 mock_data
impl UnifiedClient {
    unified_commands!(
        db_list() -> Vec<RedisDB>;               // 数据库列表
        select_db(db: u8) -> ();                 // 切换数据库
        info(node: Option<String>) -> RedisInfo; // 信息
        info_list() -> Vec<RedisInfo>;           // 信息列表
        node_list() -> Vec<RedisNode>;           // 节点列表
        scan(param: ScanParam) -> ScanResult;    // 扫描
        get(key: RedisKey, hash_key: Option<String>) -> RedisValue; // 获取值
        ttl(key: RedisKey, ttl: i64) -> ();                 // 设置TTL
        set(key: RedisKey, value: String, ttl: i64) -> ();  // 设置值
        del(key: RedisKey) -> ();                           // 删除键
        batch_del(param: RedisBatchDelete) -> ();           // 批量删除
        field_add(param: RedisFieldAdd) -> ();              // 新增字段
        field_set(param: RedisFieldSet) -> ();              // 编辑字段
        field_del(param: RedisFieldDel) -> ();              // 删除字段
        execute_command(param: RedisCommand) -> String;     // 执行命令
        config_get(pattern: &str, node: Option<String>) -> HashMap<String, String>; // 获取配置
        config_set(key: &str, value: &str, node: Option<String>) -> ();             // 设置配置
        slow_log(count: Option<u64>, node: Option<String>) -> Vec<RedisSlowLog>;    // 慢日志
        memory_usage(param: RedisMemoryParam) -> Vec<RedisKeySize>;                 // 内存分析
        client_list(node: Option<String>, client_type: Option<String>) -> Vec<RedisClientInfo>; // 客户端列表
        publish(channel: &str, message: &str) -> (); // 发布消息
        subscribe_stop() -> ();                      // 订阅消息停止
        monitor_stop()   -> ();                      // 监控命令停止
        mock_data(count: u64) -> ();                 // 模拟数据
    );

    pub async fn subscribe(&self, app_handle: AppHandle, channel: Option<String>) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.subscribe(app_handle, channel).await,
            UnifiedClient::Cluster(client) => client.subscribe(app_handle, channel).await,
        }
    }
    pub async fn monitor(&self, app_handle: AppHandle, node: &str) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.monitor(app_handle, node).await,
            UnifiedClient::Cluster(client) => client.monitor(app_handle, node).await,
        }
    }
}

/// 统一的Redis连接~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
pub enum UnifiedConn {
    Single(MultiplexedConnection),
    Cluster(ClusterConnection),
}

impl ConnectionLike for UnifiedConn {
    fn req_packed_command<'a>(&'a mut self, cmd: &'a Cmd) -> RedisFuture<'a, Value> {
        match self {
            UnifiedConn::Single(conn) => conn.req_packed_command(cmd),
            UnifiedConn::Cluster(conn) => conn.req_packed_command(cmd),
        }
    }

    fn req_packed_commands<'a>(
        &'a mut self,
        cmd: &'a Pipeline,
        offset: usize,
        count: usize,
    ) -> RedisFuture<'a, Vec<Value>> {
        match self {
            UnifiedConn::Single(conn) => conn.req_packed_commands(cmd, offset, count),
            UnifiedConn::Cluster(conn) => conn.req_packed_commands(cmd, offset, count),
        }
    }

    fn get_db(&self) -> i64 {
        match self {
            UnifiedConn::Single(conn) => conn.get_db(),
            UnifiedConn::Cluster(conn) => conn.get_db(),
        }
    }
}

impl UnifiedConn {
    pub async fn route_command(&mut self, cmd: Cmd, routing: RoutingInfo) -> RedisResult<Value> {
        match self {
            UnifiedConn::Single(conn) => cmd.query_async(conn).await,
            UnifiedConn::Cluster(conn) => conn.route_command(cmd, routing).await,
        }
    }
}
