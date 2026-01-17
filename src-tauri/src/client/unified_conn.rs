use redis::aio::{ConnectionLike, MultiplexedConnection};
use redis::cluster_async::ClusterConnection;
use redis::{Cmd, Pipeline, RedisFuture, Value};

/// 统一的Redis连接实现
pub enum UnifiedConn {
    Single(MultiplexedConnection),
    Cluster(ClusterConnection)
}

impl ConnectionLike for UnifiedConn {
    fn req_packed_command<'a>(&'a mut self, cmd: &'a Cmd) -> RedisFuture<'a, Value> {
        match self {
            UnifiedConn::Single(conn) => conn.req_packed_command(cmd),
            UnifiedConn::Cluster(conn) => conn.req_packed_command(cmd),
        }
    }

    fn req_packed_commands<'a>(&'a mut self, cmd: &'a Pipeline, offset: usize, count: usize) -> RedisFuture<'a, Vec<Value>> {
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