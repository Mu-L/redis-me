use crate::client::client_trait::*;
use crate::client::unified::{UnifiedClient, UnifiedConn, UnifiedProp};
use crate::utils::conn::{get_client_single, set_client_name};
use crate::utils::model::*;
use crate::utils::util::*;
use log::info;
use redis::aio::MultiplexedConnection;
use redis::{Connection};

pub struct RedisMeSingle {
    prop: UnifiedProp,
    conn: MultiplexedConnection,
}

impl Drop for RedisMeSingle {
    fn drop(&mut self) {
        info!("Redis连接释放Drop方法调用: {}", self.prop.id);
        self.subscribe_stop().unwrap_or(());
        self.monitor_stop().unwrap_or(());
    }
}

impl RedisMeClient for RedisMeSingle {
    fn get_prop(&self) -> &UnifiedProp {
        &self.prop
    }

    async fn get_conn(&self) -> AnyResult<UnifiedConn> {
        // TODO 检查连接是否有效，失效时重连
        let conn = UnifiedConn::Single(self.conn.clone());
        Ok(conn)
    }

    async fn init(redis_conn: &RedisConn) -> AnyResult<UnifiedClient> {
        let client = get_client_single(redis_conn)?;

        let mut conn = client.get_multiplexed_async_connection().await?;
        set_client_name(&mut conn)?;

        // 单机初始化db
        let _: () = redis::cmd("SELECT").arg(redis_conn.db).query_async(&mut conn).await?;
        info!("初始化select db: {}", redis_conn.db);
        info!("Redis单机连接初始化成功: {}", redis_conn.name);

        let client = RedisMeSingle {
            prop: redis_conn.into(),
            conn
        };
        Ok(UnifiedClient::Single(client))
    }
}

