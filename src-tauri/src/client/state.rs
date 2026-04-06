use crate::client::client_trait::MeClient;
use crate::client::impl_cluster::MeCluster;
use crate::client::impl_single::MeSingle;
use crate::utils::error::AppError;
use crate::utils::model::ConnConfig;
use crate::utils::util::AnyResult;
use log::{debug, info};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use tauri::{AppHandle, Manager, State};

#[derive(Default)]
pub struct AppState {
    // 初始化连接列表
    pub connections: Mutex<HashMap<String, ConnConfig>>,

    // 缓存连接客户端
    pub clients: RwLock<HashMap<String, Arc<Box<dyn MeClient>>>>,
}

pub trait ClientAccess {
    fn conn_list(&self, conn_list: Vec<ConnConfig>) -> AnyResult<()>;
    fn get_client(&self, id: &str) -> AnyResult<Arc<Box<dyn MeClient>>>;
    fn connect(&self, id: &str) -> AnyResult<Arc<Box<dyn MeClient>>>;
    fn disconnect(&self, id: &str) -> AnyResult<()>;
}

impl ClientAccess for AppHandle {
    fn conn_list(&self, conn_list: Vec<ConnConfig>) -> AnyResult<()> {
        let state: State<AppState> = self.state();
        let mut map = state.connections.lock().unwrap();
        map.clear();
        for conn in conn_list {
            map.insert(conn.id.clone(), conn);
        }
        info!("同步连接列表完成: {}", map.len());
        Ok(())
    }

    fn get_client(&self, id: &str) -> AnyResult<Arc<Box<dyn MeClient>>> {
        let state: State<AppState> = self.state();
        {
            // Read lock在此代码块内，自动释放锁
            let clients = state.clients.read().unwrap();
            if let Some(client) = clients.get(id) {
                debug!("获取连接: {}", client.name());
                return Ok(Arc::clone(client));
            }
        }
        self.connect(id)
    }

    fn connect(&self, id: &str) -> AnyResult<Arc<Box<dyn MeClient>>> {
        let state: State<AppState> = self.state();
        let map = state.connections.lock().unwrap();
        let conn = map.get(id).ok_or(AppError::ConnectionNotFound { id: id.into() })?;

        let mut clients = state.clients.write().unwrap();
        let client = Arc::new(if conn.cluster {
            MeCluster::init(conn)?
        } else {
            MeSingle::init(conn)?
        });

        clients.insert(id.to_string(), Arc::clone(&client));
        info!("连接成功: {}", client.name());
        Ok(client)
    }

    fn disconnect(&self, id: &str) -> AnyResult<()> {
        let state: State<AppState> = self.state();
        let mut clients = state.clients.write().unwrap();
        let client = clients.get(id);
        match client {
            Some(client) => {
                info!("断开连接: {}", client.name());
                clients.remove(id);
            }
            None => info!("未找到连接, 断开忽略: {}", id),
        };
        Ok(())
    }
}
