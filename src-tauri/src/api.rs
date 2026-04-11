use crate::client::state::ClientAccess;
use crate::utils::model::*;
use crate::utils::util::*;
use crate::{api_commands, api_commands2};
use std::collections::HashMap;
use tauri::{AppHandle, command};

// 默认示例
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 测试连接
#[command]
pub fn test_conn(conf: ConnConfig) -> ApiResult<()> {
    to_api_result(conf.test())
}

// 哨兵模式获取主节点列表
#[command]
pub fn masters(conf: ConnConfig) -> ApiResult<Vec<HashMap<String, String>>> {
    to_api_result(conf.masters())
}

// 连接信息发送到后端
#[command]
pub fn conn_list(app_handle: AppHandle, conn_list: Vec<ConnConfig>) -> ApiResult<()> {
    to_api_result(app_handle.conn_list(conn_list))
}

// 连接
#[command]
pub fn connect(app_handle: AppHandle, id: &str) -> ApiResult<ServerCapabilities> {
    to_api_result(app_handle.connect(id)).map(|client| (*client.base().capabilities).clone())
}

// 断开
#[command]
pub fn disconnect(app_handle: AppHandle, id: &str) -> ApiResult<()> {
    to_api_result(app_handle.disconnect(id))
}

// 使用宏简化代码
// to_api_result(app_handle.get_client(id).and_then(|client| client.$name($($param),*)))
api_commands!(
    db_list() -> Vec<RedisDB>;                 // 数据库列表
    select_db(db: u16) -> ();                  // 切换数据库
    info(node: Option<String>)  -> RedisInfo;  // 信息
    info_list() -> Vec<RedisInfo>;             // 信息列表
    chart(node: Option<String>) -> RedisChart; // 图表
    chart_list() -> Vec<RedisChart>;           // 图表列表
    node_list() -> Vec<RedisNode>;             // 节点列表
    scan(param: ScanParam) -> ScanResult;      // 扫描
    field_scan(param: FieldScanParam)  -> FieldScanResult;      // 字段扫描
    //get(key: RedisKey, hash_key: Option<String>) -> RedisValue; // 获取值(不扫描，直接获取所有)
    ttl(key: RedisKey, ttl: i64) -> ();                 // 设置TTL
    set(key: RedisKey, value: String, ttl: i64, key_type: Option<String>) -> ();  // 设置值
    del(key: RedisKey) -> ();                           // 删除键
    rename(key: RedisKey, new_key: RedisKey) -> ();     // 重命名键
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
    batch_del(param: RedisBatchKey) -> ();       // 批量删除
    batch_ttl(param: RedisBatchTtl) -> ();       // 批量更新过期时间
    mock_data(count: u64) -> ();                 // 模拟数据
    key_type(key: RedisKey) -> String;           // 获取键类型
    xinfo_groups(key: RedisKey) -> Vec<XInfoGroup>; // 获取Stream类型的组信息
    xinfo_consumers(key: RedisKey, group: String) -> Vec<XInfoConsumer>; // 获取Stream类型的消费者信息
);

// 需要将app_handle传递过去的命令
api_commands2!(
    monitor(node: &str) -> ();                   // 监控命令
    subscribe(channel: Option<String>)-> ();     // 订阅消息
    export_csv(param: RedisExportCsv) -> ();     // 导出CSV
    import_csv(param: RedisImportCsv) -> ();     // 导入CSV
    import_cmd(file: String) -> ();              // 导入命令
);
