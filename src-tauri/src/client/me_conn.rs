use crate::client::me_conn::MeConn::{Cluster, Single};
use crate::utils::util::AnyResult;
use anyhow::bail;
use r2d2::PooledConnection;
use redis::cluster::ClusterClient;
use redis::cluster_routing::RoutingInfo;
use redis::{Client, Cmd, ConnectionLike, FromRedisValue, Pipeline, RedisResult, Value};

pub enum MeConn {
    Single(PooledConnection<Client>),
    Cluster(PooledConnection<ClusterClient>),
}

// pub enum MePipeline {
//     Single(redis::Pipeline),
//     Cluster(redis::cluster::Pipeline),
// }
//
// impl MePipeline {
//     pub fn with_capacity(conn: &MeConn, capacity: usize) -> MePipeline {
//         match conn {
//             Single(_) => MePipeline::Single(Pipeline::with_capacity(capacity)),
//             Cluster(_) => MePipeline::Cluster(Pipeline::with_capacity(capacity)),
//         }
//     }
//
//     pub fn query<T: FromRedisValue>(&self, con: &mut dyn ConnectionLike) -> RedisResult<T> {
//         match self {
//             MePipeline::Single(pipeline) => pipeline.query(con),
//             MePipeline::Cluster(pipeline) => pipeline.query(con),
//         }
//     }
// }

impl ConnectionLike for MeConn {
    fn req_packed_command(&mut self, cmd: &[u8]) -> RedisResult<Value> {
        match self {
            Single(client) => client.req_packed_command(cmd),
            Cluster(client) => client.req_packed_command(cmd),
        }
    }

    fn req_packed_commands(
        &mut self,
        cmd: &[u8],
        offset: usize,
        count: usize,
    ) -> RedisResult<Vec<Value>> {
        match self {
            Single(client) => client.req_packed_commands(cmd, offset, count),
            Cluster(client) => client.req_packed_commands(cmd, offset, count),
        }
    }

    fn get_db(&self) -> i64 {
        match self {
            Single(client) => client.get_db(),
            Cluster(client) => client.get_db(),
        }
    }

    fn check_connection(&mut self) -> bool {
        match self {
            Single(client) => client.check_connection(),
            Cluster(client) => client.check_connection(),
        }
    }

    fn is_open(&self) -> bool {
        match self {
            Single(client) => client.is_open(),
            Cluster(client) => client.is_open(),
        }
    }
}

impl MeConn {
    pub fn to_cluster_client(&self) -> AnyResult<&PooledConnection<ClusterClient>> {
        match self {
            Single(_) => bail!("连接类型转换为集群错误"),
            Cluster(client) => Ok(client),
        }
    }

    pub fn route_command(&mut self, cmd: &Cmd, routing: RoutingInfo) -> RedisResult<Value> {
        match self {
            Single(_) => Ok(Value::Nil),
            Cluster(client) => client.route_command(cmd, routing),
        }
    }
}
