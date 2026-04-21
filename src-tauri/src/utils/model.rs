#![cfg_attr(test, allow(warnings))] // 整个文件在测试时禁用该警告

use crate::api_model;
use crate::utils::conn::{get_client_cluster, get_client_single};
use crate::utils::util::{
    AnyResult, parse_server_version, redis_value_to_string, vec8_to_display_string,
};
use chrono::Utc;
use log::info;
use redis::{Commands, RedisWrite, ToRedisArgs, ToSingleRedisArg, Value};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicI64, AtomicU16};

/// 数据显示格式
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DisplayFormat {
    #[default]
    UTF8, // 默认字符串（UTF-8 lossy）
    Hex,    // 十六进制：00 FF 80
    Binary, // 二进制：00000000 11111111 10000000
    Base64, // Base64 编码
}

// 连接信息
api_model!(
    #[derive(Default)]
    ConnConfig {
        id: String,
        name: String,

        host: String,
        port: u16,
        username: String,
        password: String,
        db: u16,

        // 集群模式
        cluster: bool,

        // SSL连接
        ssl: bool,
        ssl_option: SslOption,

        // 哨兵模式
        sentinel: bool,
        sentinel_option: SentinelOption,

        // SSH隧道
        ssh: bool,
        ssh_option: SshOption
    }
);

api_model!(
    #[derive(Default)]
    SslOption {
        key: String,
        cert: String,
        ca: String,
    }
);

api_model!(
    #[derive(Default)]
    SentinelOption {
        master_name: String,
        master_username: String,
        master_password: String,
    }
);

api_model!(
    #[derive(Default)]
    SshOption {
        host: String,
        port: u16,

        login_type: String, // pwd 用户名/密码, pkfile 私钥文件
        username: String,
        password: String,
        pkfile: String,
        passphrase: String,
    }
);

impl ConnConfig {
    pub fn test(&self) -> AnyResult<()> {
        if self.cluster {
            get_client_cluster(self)?;
        } else {
            get_client_single(self)?;
        };
        // 单机模式返回的元组在测试后丢弃，SSH 隧道随之关闭
        // 集群模式不支持 SSH
        Ok(())
    }

    pub fn masters(&self) -> AnyResult<Vec<HashMap<String, String>>> {
        let mut conf = self.clone();
        conf.sentinel = false;
        let (client, _) = get_client_single(&conf)?;
        let mut conn = client.get_connection()?;
        let masters: Vec<HashMap<String, String>> =
            redis::cmd("sentinel").arg("masters").query(&mut conn)?;
        Ok(masters)
    }
}

// 客户端的公共属性
api_model!(
    MeBase {
        id: String,
        conf: ConnConfig,
        db: Arc<AtomicU16>,
        subscribe_running: Arc<AtomicBool>,
        monitor_running: Arc<AtomicBool>,
        export_import_running: Arc<AtomicBool>,
        last_check_time: Arc<AtomicI64>,

        // 服务器信息缓存
        server_version: String,               // Redis/Valkey 版本
        capabilities: Arc<ServerCapabilities>, // 能力标识
    }
);

impl From<&ConnConfig> for MeBase {
    fn from(conf: &ConnConfig) -> Self {
        MeBase {
            id: conf.id.clone(),
            conf: conf.clone(),
            db: Arc::new(AtomicU16::new(conf.db)),
            subscribe_running: Arc::new(AtomicBool::new(false)),
            monitor_running: Arc::new(AtomicBool::new(false)),
            export_import_running: Arc::new(AtomicBool::new(false)),
            last_check_time: Arc::new(AtomicI64::new(Utc::now().timestamp())),

            // 默认值，实际在创建客户端时更新
            server_version: String::new(),
            capabilities: Arc::new(ServerCapabilities::default()),
        }
    }
}

// 新增：MeBase 更新版本和能力的方法
impl MeBase {
    pub fn update_server_info(&mut self, info_output: &str, conn: &mut impl Commands) {
        // 解析版本号
        self.server_version = parse_server_version(info_output);
        // 通过命令检测能力
        self.capabilities = Arc::new(ServerCapabilities::from_command_info(conn));
        info!(
            "Detected server: {} (capabilities: hash_field_ttl={})",
            self.server_version, self.capabilities.hash_field_ttl
        );
    }
}

// 能力标识
api_model!(
    #[derive(Default)]
    ServerCapabilities {
        hash_field_ttl: bool, // Redis/Valkey >= 7.4.0
                              // 未来可扩展其他特性
    }
);

impl ServerCapabilities {
    // 通过 COMMAND INFO HTTL 检测是否支持字段级 TTL
    pub fn from_command_info(conn: &mut impl Commands) -> Self {
        // COMMAND INFO HTTL 返回命令信息，如果命令不存在返回 Nil
        let result: Result<Value, _> = redis::cmd("COMMAND").arg("INFO").arg("HTTL").query(conn);

        let hash_field_ttl = match result {
            Ok(value) => {
                let str = redis_value_to_string(value, "");
                !str.trim().is_empty() // HTTL 命令存在
            }
            _ => false,
        };

        Self { hash_field_ttl }
    }
}

// 数据库信息
api_model!(RedisDB { db: u16, size: u64 });

// 信息 图形
api_model!(
    #[derive(Default)]
    RedisChart {
        node: String,

        // db0:keys=1558,expires=0,avg_ttl=0,subexpiry=0; db1:keys=50,expires=0,avg_ttl=0,subexpiry=0
        key_total: u64,                 // 键总数
        connected_clients: u64,         // 客户端数量
        instantaneous_ops_per_sec: f64, // 命令执行数/秒
        used_memory: u64,               // 内存使用量
        instantaneous_input_kbps: f64,  // 网络输入
        instantaneous_output_kbps: f64, // 网络输出

        total_connections_received: u64, // 服务器接受的总连接数
        total_commands_processed: u64,   // 服务器处理的总命令数

        // 计算缓存命中率: Cache Hit Ratio = keyspace_hits / (keyspace_hits + keyspace_misses)
        keyspace_hits: u64,   // 在主字典中成功查找键的数量
        keyspace_misses: u64, // 在主字典中查找键失败的数量
        cache_hit_ratio: f64, // 缓存命中率
    }
);

// 信息 info命令
api_model!(RedisInfo {
    node: String,
    info: String,
});

// 集群节点
api_model!(
#[derive(Default)]
RedisNode {
    id: String,
    node: String,
    flags: String,
    slots: Option<String>,
    slave_of_node: Option<String>
});

// 扫描参数
api_model!(ScanParam {
    #[serde(rename = "match")]
    pattern: String,
    count: u64,

    #[serde(rename = "type")]
    scan_type: Option<String>,

    cursor: Option<ScanCursor>,
    load_all: bool,
});

impl ScanParam {
    pub fn all(pattern: String) -> Self {
        ScanParam {
            pattern,
            count: 0,
            scan_type: None,
            cursor: None,
            load_all: true,
        }
    }
}

api_model!(FieldScanParam {
    key: RedisKey,
    hash_key: Option<String>, // Hash键 或 StreamId
    count: u64,
    cursor: Option<ScanCursor>,
    load_all: bool,
    meta: Option<FiledScanMeta>, // 扩展参数
    display_format: Option<DisplayFormat>, // 显示格式
});

api_model!(FiledScanMeta {
    max_id: String,
    min_id: String
});

api_model!(XInfoGroup{
    name: String,
    consumers: usize,
    pending: usize,
    last_delivered_id: String,
    entries_read: Option<usize>,
    lag: Option<usize>
});

api_model!(XInfoConsumer {
    name: String,
    pending: usize,
    idle: usize,
});

api_model!(
#[derive(Default)]
FieldScanValue {
    hash: Vec<RedisHashItem>,
    set: Vec<String>,
    zset: Vec<RedisZetItem>,
});

// 扫描游标
api_model!(
#[derive(Default)]
ScanCursor {
    ready_nodes: Vec<String>,
    now_node: String,
    now_cursor: u64,
    stream_cursor: String,
    finished: bool,
});

// 扫描结果
api_model!(ScanResult {
    key_list: Vec<RedisKey>,
    cursor: ScanCursor,
});

api_model!(FieldScanResult {
    #[serde(rename = "type")]
    key_type: String,
    ttl: i64,
    size: u64,
    value: serde_json::Value,
    cursor: ScanCursor,
    length: usize, // String类型的原始bytes长度
});

// Redis键: 由于键是字节存储的，考虑转换为utf-8字符串显示后可能会丢失信息，因此封装为对象
// 备注: 为了方便传输与前端对比是否相等，将bytes序列化为base64字符串。
//     （jackson针对bytes序列化, 默认会进行base64编码, 返回是字符串）
api_model!(RedisKey {
    key: String,    // 显示

    #[serde(with = "v8_base64")]
    bytes: Vec<u8>, // 修改、删除等依据 ==> 查询出来的二进制键
});

impl RedisKey {
    pub fn to_bytes(&self) -> &[u8] {
        // 扫描出来的键进行修改或删除时, 传入bytes. 完全新增的键，传入字符串, bytes为空
        if self.bytes.is_empty() {
            self.key.as_bytes()
        } else {
            &self.bytes
        }
    }

    pub fn to_normal(&self) -> Self {
        if self.key.is_empty() {
            RedisKey::from(self.bytes.clone())
        } else if self.bytes.is_empty() {
            RedisKey::from(self.key.clone())
        } else {
            self.clone()
        }
    }
}

impl From<&str> for RedisKey {
    fn from(s: &str) -> Self {
        RedisKey {
            key: s.to_string(),
            bytes: Vec::from(s),
        }
    }
}
impl From<String> for RedisKey {
    fn from(s: String) -> Self {
        RedisKey {
            key: s.clone(),
            bytes: Vec::from(s),
        }
    }
}
impl From<Vec<u8>> for RedisKey {
    fn from(bytes: Vec<u8>) -> Self {
        RedisKey {
            key: vec8_to_display_string(&bytes),
            bytes,
        }
    }
}

impl From<RedisKey> for String {
    fn from(redis_key: RedisKey) -> Self {
        if redis_key.key.is_empty() {
            String::from_utf8_lossy(&redis_key.bytes).to_string()
        } else {
            redis_key.key.clone()
        }
    }
}

impl ToRedisArgs for RedisKey {
    fn write_redis_args<W>(&self, out: &mut W)
    where
        W: ?Sized + RedisWrite,
    {
        out.write_arg(self.to_bytes())
    }
}
impl ToSingleRedisArg for RedisKey {}

// 批量删除
api_model!(RedisBatchKey {
    #[serde(rename = "match")]
    pattern: String,
    key_list: Vec<RedisKey>,
});

// 批量更新过期时间
api_model!(RedisBatchTtl {
    key_list: Vec<RedisKey>,
    ttl: i64
});

// 导出
api_model!(RedisExportCsv {
    #[serde(rename = "match")]
    pattern: String,
    key_list: Vec<RedisKey>,
    file: String,
    with_ttl: bool,
});

impl From<RedisExportCsv> for RedisBatchKey {
    fn from(value: RedisExportCsv) -> Self {
        RedisBatchKey {
            pattern: value.pattern,
            key_list: value.key_list,
        }
    }
}

// 导入
api_model!(RedisImportCsv {
    file: String,
    ttl: i64,
    handle_ttl: String, // TTL处理: 尝试读取 parse, 自定义 custom, 永久 forever
    handle_conflict: String, // 冲突处理: 覆盖 replace, 忽略 ignore
});

// Hash条目
api_model!(RedisHashItem{
    key: String,
    value: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    ttl: Option<i64>,
});

// Zset条目
api_model!(RedisZetItem {
    value: String,
    score: f64,
});

// Stream条目
api_model!(RedisStreamItem {
    id: String,
    value: HashMap<String, String>, // map转化为的json字符串
});

// 字段新增
api_model!(RedisFieldAdd {
    key: String,
    mode: String,    // key-新增键, field-新增字段

    #[serde(rename = "type")]
    key_type: String,
    ttl: i64,
    value: String, // 字段类型为String时的值
    input_format: Option<DisplayFormat>, // 输入格式（Hex/Binary/Base64 等）

    list_push_method: String, // lpush, rpush
    field_value_list: Vec<RedisFieldValue>,
    stream_id: String, // stream
});

// 字段修改
api_model!(RedisFieldSet {
    key: RedisKey,
    src_field_value: String,
    field_index: isize,
    field_key: String,
    field_value: String,
    field_score: f64,
    field_ttl: i64, // 字段 TTL（秒），仅 Redis/Valkey >= 7.4
    input_format: Option<DisplayFormat>, // 输入格式（Hex/Binary/Base64 等）
});

// 字段值
api_model!(RedisFieldValue {
    field_key: String,
    field_value: String,
    field_score: f64,
    field_ttl: i64, // 字段 TTL（秒），仅 Redis/Valkey >= 7.4
});

// 字段删除
api_model!(RedisFieldDel {
    key: RedisKey,
    field_index: isize,
    field_key: String,
    field_value: String,
    stream_id: String, // stream
});

// 设置参数
api_model!(RedisSetParam {
    key: RedisKey,
    value: String,
    ttl: i64,
    key_type: Option<String>,
    input_format: Option<DisplayFormat>,
});

// 执行命令
api_model!(RedisCommand {
    command: String,
    node: Option<String>,
    auto_broadcast: Option<bool>,
});

// 慢日志
api_model!(RedisSlowLog {
    node: String,
    id: u64,
    time: String,
    client: String,
    command: String,
    cost: f64,
    client_name: String
});

// 内存分析参数
api_model!(RedisMemoryParam {
    #[serde(rename = "match")]
    pattern: Option<String>, // 匹配模式

    size_limit: u64,   // 大小限制, 推荐: 100kb 即102400
    count_limit: u64,  // 数量限制, 推荐: 1000
    scan_count: u64,   // 每次扫描, 推荐: 1000
    scan_total: u64,   // 扫描数量限制, 推荐: 10000
    sleep_millis: u64, // 扫描间隔, 推荐: 1000

    need_key_type: Option<bool>, // 是否需要返回键类型
});

// 内存分析结果
api_model!(RedisKeySize {
    key: String,    // 显示

    #[serde(with = "v8_base64")]
    bytes: Vec<u8>, // 修改、删除等依据

    #[serde(rename = "type")]
    key_type: String ,  // 类型
    size: u64,        // 大小
});

impl From<(Vec<u8>, u64, String)> for RedisKeySize {
    fn from((key, size, key_type): (Vec<u8>, u64, String)) -> Self {
        RedisKeySize {
            key: vec8_to_display_string(&key),
            bytes: key,
            size,
            key_type,
        }
    }
}

// 客户端
api_model!(RedisClientInfo {
    id: Option<String>,             // 唯一的 64 位客户端 ID
    addr: Option<String>,           // 客户端的地址/端口
    laddr: Option<String>,          // 客户端连接到的本地地址/端口（绑定地址）
    fd: Option<String>,             // 对应于套接字的文件描述符
    name: Option<String>,           // 客户端使用 CLIENT SETNAME 设置的名称
    age: Option<String>,            // 连接的总持续时间（秒）
    idle: Option<String>,           // 连接的空闲时间（秒）
    flags: Option<String>,          // 客户端标志（见下文）
    db: Option<String>,             // 当前数据库 ID
    sub: Option<String>,            // 频道订阅数
    psub: Option<String>,           // 模式匹配订阅数
    ssub: Option<String>,           // 分片频道订阅数。在 Redis 7.0.3 中添加
    multi: Option<String>,          // MULTI/EXEC 上下文中的命令数
    watch: Option<String>,          // 此客户端当前正在监视的键数。在 Redis 7.4 中添加
    qbuf: Option<String>,           // 查询缓冲区长度（0 表示没有待处理的查询）
    qbuf_free: Option<String>,       // 查询缓冲区的可用空间（0 表示缓冲区已满）
    argv_mem: Option<String>,        // 下一个命令的不完整参数（已从查询缓冲区中提取）
    multi_mem: Option<String>,       // 缓冲的多命令使用的内存。在 Redis 7.0 中添加
    obl: Option<String>,            // 输出缓冲区长度
    oll: Option<String>,            // 输出列表长度（当缓冲区满时，回复在此列表中排队）
    omem: Option<String>,           // 输出缓冲区内存使用情况
    tot_mem: Option<String>,         // 此客户端在其各种缓冲区中消耗的总内存
    events: Option<String>,         // 文件描述符事件（见下文）
    cmd: Option<String>,            // 执行的最后一条命令
    user: Option<String>,           // 客户端的已认证用户名
    redir: Option<String>,          // 当前客户端跟踪重定向的客户端 id
    resp: Option<String>,           // 客户端 RESP 协议版本。在 Redis 7.0 中添加
    rbp: Option<String>,            // 客户端连接以来其读取缓冲区的峰值大小。在 Redis 7.0 中添加
    rbs: Option<String>,            // 客户端读取缓冲区当前大小（字节）。在 Redis 7.0 中添加
    io_thread: Option<String>,       // 分配给客户端的 I/O 线程 ID。在 Redis 8.0 中添加
});

api_model!(SubscribeEvent {
    id: String,
    datetime: String,
    channel: String,
    message: String,
});

api_model!(MonitorEvent {
    id: String,
    datetime: String,
    command: String,
});

api_model!(ExportImportEvent {
    id: String,
    ok_count: u64,
    err_count: u64,
    total_count: u64,
    ignore_count: u64,
    finished: bool
});

//~~~~~ 自定义Vec<u8>序列化为Base64字符串
mod v8_base64 {
    use base64::Engine;
    use base64::prelude::BASE64_STANDARD;
    use serde::de::Error;
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &Vec<u8>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let base64_string = BASE64_STANDARD.encode(bytes);
        serializer.serialize_str(&base64_string)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let base64_string = String::deserialize(deserializer)?;
        let bytes = BASE64_STANDARD
            .decode(base64_string.as_bytes())
            .map_err(|e| Error::custom(format!("Base64 decode error: {}", e)))?;
        Ok(bytes)
    }
}
