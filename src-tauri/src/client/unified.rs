use crate::client::impl_cluster::RedisMeCluster;
use crate::client::impl_single::RedisMeSingle;
use crate::utils::model::RedisConn;
use redis::aio::{ConnectionLike, MultiplexedConnection};
use redis::cluster_async::ClusterConnection;
use redis::cluster_routing::RoutingInfo;
use redis::{Cmd, Pipeline, RedisFuture, RedisResult, Value};
use std::sync::atomic::{AtomicBool, AtomicU8};
use std::sync::Arc;
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
    
    pub fn db_list(&self) -> AnyResult<Vec<RedisDB>> {
        match self {
            UnifiedClient::Single(client) => client.db_list(),
            UnifiedClient::Cluster(client) => client.db_list(),
        }
    }

    pub fn select_db(&self, db: u8) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.select_db(db),
            UnifiedClient::Cluster(client) => client.select_db(db),
        }
    }

    pub fn info(&self, node: Option<String>) -> AnyResult<RedisInfo> {
        match self {
            UnifiedClient::Single(client) => client.info(node),
            UnifiedClient::Cluster(client) => client.info(node),
        }
    }

    pub fn info_list(&self) -> AnyResult<Vec<RedisInfo>> {
        match self {
            UnifiedClient::Single(client) => client.info_list(),
            UnifiedClient::Cluster(client) => client.info_list(),
        }
    }

    pub fn node_list(&self) -> AnyResult<Vec<RedisNode>> {
        match self {
            UnifiedClient::Single(client) => client.node_list(),
            UnifiedClient::Cluster(client) => client.node_list(),
        }
    }

    pub fn scan(&self, param: ScanParam) -> AnyResult<ScanResult> {
        match self {
            UnifiedClient::Single(client) => client.scan(param),
            UnifiedClient::Cluster(client) => client.scan(param),
        }
    }

    pub fn get(&self, key: RedisKey, hash_key: Option<String>) -> AnyResult<RedisValue> {
        match self {
            UnifiedClient::Single(client) => client.get(key, hash_key),
            UnifiedClient::Cluster(client) => client.get(key, hash_key),
        }
    }

    pub fn ttl(&self, key: RedisKey, ttl: i64) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.ttl(key, ttl),
            UnifiedClient::Cluster(client) => client.ttl(key, ttl),
        }
    }

    pub fn set(&self, key: RedisKey, value: String, ttl: i64) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.set(key, value, ttl),
            UnifiedClient::Cluster(client) => client.set(key, value, ttl),
        }
    }

    pub fn del(&self, key: RedisKey) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.del(key),
            UnifiedClient::Cluster(client) => client.del(key),
        }
    }

    pub fn field_add(&self, param: RedisFieldAdd) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.field_add(param),
            UnifiedClient::Cluster(client) => client.field_add(param),
        }
    }

    pub fn field_set(&self, param: RedisFieldSet) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.field_set(param),
            UnifiedClient::Cluster(client) => client.field_set(param),
        }
    }

    pub fn field_del(&self, param: RedisFieldDel) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.field_del(param),
            UnifiedClient::Cluster(client) => client.field_del(param),
        }
    }

    pub fn execute_command(&self, param: RedisCommand) -> AnyResult<String> {
        match self {
            UnifiedClient::Single(client) => client.execute_command(param),
            UnifiedClient::Cluster(client) => client.execute_command(param),
        }
    }

    pub fn config_get(&self, pattern: &str, node: Option<String>) -> AnyResult<HashMap<String, String>> {
        match self {
            UnifiedClient::Single(client) => client.config_get(pattern, node),
            UnifiedClient::Cluster(client) => client.config_get(pattern, node),
        }
    }

    pub fn config_set(&self, key: &str, value: &str, node: Option<String>) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.config_set(key, value, node),
            UnifiedClient::Cluster(client) => client.config_set(key, value, node),
        }
    }

    pub fn slow_log(&self, count: Option<u64>, node: Option<String>) -> AnyResult<Vec<RedisSlowLog>> {
        match self {
            UnifiedClient::Single(client) => client.slow_log(count, node),
            UnifiedClient::Cluster(client) => client.slow_log(count, node),
        }
    }

    pub fn memory_usage(&self, param: RedisMemoryParam) -> AnyResult<Vec<RedisKeySize>> {
        match self {
            UnifiedClient::Single(client) => client.memory_usage(param),
            UnifiedClient::Cluster(client) => client.memory_usage(param),
        }
    }

    pub fn client_list(&self, node: Option<String>, client_type: Option<String>) -> AnyResult<Vec<RedisClientInfo>> {
        match self {
            UnifiedClient::Single(client) => client.client_list(node, client_type),
            UnifiedClient::Cluster(client) => client.client_list(node, client_type),
        }
    }

    pub fn publish(&self, channel: &str, message: &str) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.publish(channel, message),
            UnifiedClient::Cluster(client) => client.publish(channel, message),
        }
    }

    pub fn subscribe(&self, app_handle: AppHandle, channel: Option<String>) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.subscribe(app_handle, channel),
            UnifiedClient::Cluster(client) => client.subscribe(app_handle, channel),
        }
    }

    pub fn subscribe_stop(&self) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.subscribe_stop(),
            UnifiedClient::Cluster(client) => client.subscribe_stop(),
        }
    }

    pub fn monitor(&self, app_handle: AppHandle, node: &str) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.monitor(app_handle, node),
            UnifiedClient::Cluster(client) => client.monitor(app_handle, node),
        }
    }

    pub fn monitor_stop(&self) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.monitor_stop(),
            UnifiedClient::Cluster(client) => client.monitor_stop(),
        }
    }

    pub fn batch_del(&self, param: RedisBatchDelete) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.batch_del(param),
            UnifiedClient::Cluster(client) => client.batch_del(param),
        }
    }

    pub fn mock_data(&self, count: u64) -> AnyResult<()> {
        match self {
            UnifiedClient::Single(client) => client.mock_data(count),
            UnifiedClient::Cluster(client) => client.mock_data(count),
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
