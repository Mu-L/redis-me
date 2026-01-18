use crate::client::client_trait::RedisMeClient;
use crate::client::impl_cluster::RedisMeCluster;
use crate::client::impl_single::RedisMeSingle;
use crate::client::unified::UnifiedClient;
use crate::utils::model::RedisConn;
use crate::utils::util::AnyResult;
use anyhow::anyhow;
use log::info;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use tokio::sync::{Mutex, RwLock};

#[derive(Default)]
pub struct AppState {
    // 初始化连接列表
    pub connections: Mutex<HashMap<String, RedisConn>>,

    // 缓存连接客户端
    pub clients: RwLock<HashMap<String, Arc<UnifiedClient>>>,
}

pub trait ClientAccess {
    async fn conn_list(&self, conn_list: Vec<RedisConn>) -> AnyResult<()>;
    async fn get_client(&self, id: &str) -> AnyResult<Arc<UnifiedClient>>;
    async fn connect(&self, id: &str) -> AnyResult<Arc<UnifiedClient>>;
    async fn disconnect(&self, id: &str) -> AnyResult<()>;
}

impl ClientAccess for AppHandle {
    async fn conn_list(&self, conn_list: Vec<RedisConn>) -> AnyResult<()> {
        let state: State<AppState> = self.state();
        let mut map = state.connections.lock().await;
        map.clear();
        for conn in conn_list {
            map.insert(conn.id.clone(), conn);
        }
        info!("同步连接列表完成: {}", map.len());
        Ok(())
    }

    async fn get_client(&self, id: &str) -> AnyResult<Arc<UnifiedClient>> {
        let state: State<AppState> = self.state();
        {
            // Read lock在此代码块内，自动释放锁; 即如果客户端已存在则直接返回
            let clients = state.clients.read().await;
            if let Some(client) = clients.get(id) {
                return Ok(Arc::clone(client));
            }
        }

        // 客户端不存在则连接后返回
        self.connect(id).await
    }

    async fn connect(&self, id: &str) -> AnyResult<Arc<UnifiedClient>> {
        let state: State<AppState> = self.state();
        let map = state.connections.lock().await;
        let conn = map.get(id).ok_or(anyhow!("未找到连接: {}", id))?;

        let mut clients = state.clients.write().await;
        let client = Arc::new(if conn.cluster {
            RedisMeCluster::init(conn).await?
        } else {
            RedisMeSingle::init(conn).await?
        });

        clients.insert(id.to_string(), Arc::clone(&client));
        info!("连接成功: {}", id);
        Ok(client)
    }

    async fn disconnect(&self, id: &str) -> AnyResult<()> {
        let state: State<AppState> = self.state();
        let mut clients = state.clients.write().await;
        if clients.get(id).is_some() {
            clients.remove(id);
            info!("断开连接: {}", id);
        } else {
            info!("未找到连接, 断开忽略: {}", id)
        }
        Ok(())
    }
}
