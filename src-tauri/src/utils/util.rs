use crate::utils::error::AppError;
use crate::utils::model::*;
use anyhow::bail;
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use chrono::DateTime;
use log::error;
use rand::RngExt;
use rand::distr::{Alphanumeric, SampleString};
use rand::prelude::IteratorRandom;
use redis::streams::{StreamId, StreamInfoConsumer, StreamInfoGroup, StreamRangeReply};
use redis::{FromRedisValue, Value, ValueType};
use serde_json::{Map, Value as JsonValue};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::time::Duration;

// 统一应用返回值
pub type AnyResult<T> = anyhow::Result<T>;
pub type ApiResult<T> = Result<T, String>;

// 常量定义
pub const REDIS_ME_FIELD_TO_DELETE_TMP_VALUE: &str = "REDIS_ME_FIELD_TO_DELETE_TMP_VALUE";
pub const REDIS_ME_SUBSCRIBE_STOP_CHANNEL: &str = "REDIS_ME_SUBSCRIBE_STOP_CHANNEL";
pub const CONNECTION_CHECK_SECONDS: i64 = 30; // 30s 检查 1 次连接，避免频繁检查
pub const CONNECTION_CHECK_TIMEOUT: Duration = Duration::from_secs(2); // 检查连接超时
pub const CONNECTION_NORMAL_TIMEOUT: Duration = Duration::from_secs(30); // 连接操作默认操作时长

pub const EVENT_SUBSCRIBE: &str = "subscribe";
pub const EVENT_MONITOR: &str = "monitor";
pub const EVENT_EXPORT: &str = "export";
pub const EVENT_IMPORT: &str = "import";

pub const ME_JSON_TYPE_NAME: &str = "json";
pub const REDIS_JSON_TYPE_NAME: &str = "ReJSON-RL";

// tauri 的错误处理中需要返回的错误实现序列化，anyhow 的错误并没有实现，因此简单返回字符串错误
pub fn to_api_result<T>(result: anyhow::Result<T>) -> ApiResult<T> {
    match result {
        Ok(value) => Ok(value),
        Err(err) => {
            // 尝试解析为 AppError（国际化的错误码）
            let error_message = err.to_string();
            if let Ok(app_error) = serde_json::from_str::<AppError>(&error_message) {
                // 返回序列化的 AppError JSON
                return Err(serde_json::to_string(&app_error).unwrap_or(error_message));
            }

            // 避免原始错误和 source 错误的字符串一致，提示两遍（比如 connection timed out）
            let message = match err.source() {
                Some(source)
                    if !source.to_string().is_empty() && err.to_string() != source.to_string() =>
                {
                    format!("{}: {}", err, source)
                }
                _ => err.to_string(),
            };
            error!("错误：{}", message);
            Err(message)
        }
    }
}

pub fn ui_key_type(key_type: ValueType) -> String {
    let key_type: String = key_type.into();
    ui_key_type_str(&key_type)
}

/// `TYPE` 等返回的原始类型名（含模块名如 ReJSON-RL）统一为与 `ui_key_type` 一致的展示名
pub fn ui_key_type_str(key_type: &str) -> String {
    if key_type == REDIS_JSON_TYPE_NAME {
        ME_JSON_TYPE_NAME.to_string()
    } else {
        key_type.to_string()
    }
}

pub fn to_key_type(key_type: &str) -> ValueType {
    match key_type {
        ME_JSON_TYPE_NAME => ValueType::JSON,
        _ => key_type.into(),
    }
}

pub fn ui_xinfo_group(group: StreamInfoGroup) -> XInfoGroup {
    XInfoGroup {
        name: group.name,
        consumers: group.consumers,
        pending: group.pending,
        last_delivered_id: group.last_delivered_id,
        entries_read: group.entries_read,
        lag: group.lag,
    }
}

pub fn ui_xinfo_consumer(consumer: StreamInfoConsumer) -> XInfoConsumer {
    XInfoConsumer {
        name: consumer.name,
        pending: consumer.pending,
        idle: consumer.idle,
    }
}

// 字节数组转字符串：无效的 UTF-8 字节显示为十六进制转义（如 \xFF） [DeepSeek]
// 实测十六进制转义并不好用，还是先采用比较简单的方法处理
pub fn vec8_to_display_string(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).to_string()
}

/// 按 wire 格式将字节转为 IPC 字符串
pub fn format_bytes(bytes: &[u8], format: &BytesFormat) -> String {
    match format {
        BytesFormat::Base64 => BASE64_STANDARD.encode(bytes),
        BytesFormat::UTF8 => vec8_to_display_string(bytes),
    }
}

/// 将 IPC 字符串解析为字节（hex/binary/msgpack 等在前端转为 base64 后再传入）
pub fn parse_bytes(input: &str, format: &BytesFormat) -> AnyResult<Vec<u8>> {
    match format {
        BytesFormat::Base64 => BASE64_STANDARD
            .decode(input)
            .map_err(|e| anyhow::anyhow!("Base64 decode error: {}", e)),
        BytesFormat::UTF8 => Ok(input.as_bytes().to_vec()),
    }
}

// 辅助函数
pub fn tuple_to_key_size(keys: Vec<(Vec<u8>, u64, String)>) -> Vec<RedisKeySize> {
    let mut key_list: Vec<RedisKeySize> = keys
        .into_iter()
        .map(|(key, size, key_type)| RedisKeySize::from((key, size, ui_key_type_str(&key_type))))
        .collect();
    key_list.sort_by_key(|x| x.size);
    key_list.reverse();
    key_list
}

pub fn ui_key_list(keys: Vec<Vec<u8>>) -> Vec<RedisKey> {
    keys.into_iter()
        .map(|key| RedisKey {
            key: vec8_to_display_string(&key),
            bytes: key,
        })
        .collect()
}

pub fn ui_list_value(value: &[Vec<u8>], format: &BytesFormat) -> Vec<String> {
    value.iter().map(|v| format_bytes(v, format)).collect()
}

pub fn ui_hash_value(value: &[(Vec<u8>, Vec<u8>)], format: &BytesFormat) -> Vec<RedisHashItem> {
    value
        .iter()
        .map(|(key, value)| {
            let key: String = format_bytes(key, format);
            let value: String = format_bytes(value, format);
            RedisHashItem {
                key,
                value,
                ttl: None,
            }
        })
        .collect()
}

pub fn ui_set_value(value: HashSet<Vec<u8>>, format: &BytesFormat) -> Vec<String> {
    value
        .into_iter()
        .map(|v| format_bytes(&v, format))
        .collect()
}

pub fn ui_zset_value(value: Vec<(Vec<u8>, f64)>, format: &BytesFormat) -> Vec<RedisZetItem> {
    value
        .into_iter()
        .map(|(value, score)| RedisZetItem {
            value: format_bytes(&value, format),
            score,
        })
        .collect()
}

pub fn ui_stream_value(reply: StreamRangeReply) -> Vec<RedisStreamItem> {
    reply
        .ids
        .into_iter()
        .map(|sid| {
            let StreamId { id, map, .. } = sid;
            RedisStreamItem {
                id,
                value: ui_stream_id(map),
            }
        })
        .collect()
}

pub fn ui_stream_id(stream_id: HashMap<String, Value>) -> HashMap<String, String> {
    stream_id
        .into_iter()
        .map(|(k, v)| (k, redis_value_to_string(v, "\n")))
        .collect()
}

// 字节数组转 Base64 字符串：RedisKey 的 bytes
// pub fn vec8_to_base64_string(bytes: &[u8]) -> String {
//     BASE64_STANDARD.encode(bytes)
// }

// vec 中随机选择一个
pub fn random_item<T>(vec: &[T]) -> &T {
    vec.iter().choose(&mut rand::rng()).unwrap()
}

// 随机 N 个字符
pub fn random_string(len: usize) -> String {
    Alphanumeric.sample_string(&mut rand::rng(), len)
}

// 随机范围
pub fn random_range(min: i32, max: i32) -> i32 {
    rand::rng().random_range(min..=max)
}

// 解析命令：主要考虑解析带有引号的参数，比如：config set save "3600 1 300 100 60 10000"
pub fn parse_command(command: &str) -> AnyResult<(String, Vec<String>)> {
    let tokens = shell_words::split(command.trim())?;
    let first = tokens.first().cloned().unwrap_or_default();
    let other = tokens.into_iter().skip(1).collect();
    Ok((first, other))
}

// 命令返回值转换
pub fn redis_value_to_string(value: Value, sep: &str) -> String {
    match value {
        // 参考 FromRedisValue::from_redis_value
        Value::BulkString(bytes) => vec8_to_display_string(&bytes),
        Value::Okay => "OK".to_string(),
        Value::SimpleString(val) => val,
        Value::VerbatimString {
            format: _,
            ref text,
        } => text.to_string(),
        Value::Double(val) => val.to_string(),
        Value::Int(val) => val.to_string(),
        // 以下为扩展补充的
        Value::Nil => "".to_string(),
        Value::Boolean(val) => val.to_string(),
        Value::BigNumber(bigint) => bigint.to_string(),
        Value::Array(vec) => vec
            .into_iter()
            .map(|v| redis_value_to_string(v, sep))
            .collect::<Vec<String>>()
            .join(sep),
        Value::Set(set) => set
            .into_iter()
            .map(|v| redis_value_to_string(v, sep))
            .collect::<Vec<String>>()
            .join(sep),
        Value::Map(map) => map
            .into_iter()
            .map(|(k, v)| (redis_value_to_string(k, sep), redis_value_to_string(v, sep)))
            .map(|(k, v)| format!("{}: {}", k, v))
            .collect::<Vec<String>>()
            .join(sep),
        // 其余暂不解析，直接转换为字符串
        _ => format!("{:?}", value),
    }
}

// 慢查询结果转换
pub fn redis_value_to_log(value: Value, node: &str) -> AnyResult<RedisSlowLog> {
    let items = match value {
        Value::Array(arr) if arr.len() >= 4 => arr,
        Value::Array(_) => bail!("slow query entries have at least 4 elements"),
        _ => bail!("should be an array of slow query entries"),
    };

    let id: u64 = FromRedisValue::from_redis_value_ref(&items[0])?;
    let time = timestamp_to_string(FromRedisValue::from_redis_value_ref(&items[1])?);
    let cost: f64 = FromRedisValue::from_redis_value_ref(&items[2])?;
    let command: String = redis_value_to_string(items[3].clone(), " ");
    let client: String = if items.len() > 4 {
        FromRedisValue::from_redis_value_ref(&items[4])?
    } else {
        "".into()
    };

    let client_name: String = if items.len() > 5 {
        FromRedisValue::from_redis_value_ref(&items[5])?
    } else {
        "".into()
    };

    Ok(RedisSlowLog {
        node: node.to_string(),
        id,
        time,
        cost: cost / 1000.0,
        command,
        client,
        client_name,
    })
}

// 时间戳 (秒) 转字符串
pub fn timestamp_to_string(timestamp: i64) -> String {
    let datetime = DateTime::from_timestamp(timestamp, 0)
        .unwrap()
        .with_timezone(&chrono_tz::Asia::Shanghai);
    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
}

/// `tot_mem` → `totMem`，与 `RedisClientInfo` 的 `rename_all = "camelCase"` 一致。
fn redis_client_json_key(norm_snake: &str) -> String {
    let parts: Vec<&str> = norm_snake.split('_').filter(|p| !p.is_empty()).collect();
    if parts.is_empty() {
        return String::new();
    }
    let mut out = String::from(parts[0]);
    for p in parts.iter().skip(1) {
        let mut c = p.chars();
        if let Some(f) = c.next() {
            out.push(f.to_ascii_uppercase());
            out.extend(c);
        }
    }
    out
}

fn redis_client_put_u64(obj: &mut Map<String, JsonValue>, raw: &HashMap<String, &str>, norm: &str) {
    if let Some(v) = raw.get(norm) {
        let n = v.parse::<u64>().unwrap_or(0);
        obj.insert(redis_client_json_key(norm), JsonValue::Number(n.into()));
    }
}

fn redis_client_put_i64(obj: &mut Map<String, JsonValue>, raw: &HashMap<String, &str>, norm: &str) {
    if let Some(v) = raw.get(norm) {
        let n = v.parse::<i64>().unwrap_or(0);
        obj.insert(redis_client_json_key(norm), serde_json::json!(n));
    }
}

fn redis_client_put_u8(obj: &mut Map<String, JsonValue>, raw: &HashMap<String, &str>, norm: &str) {
    if let Some(v) = raw.get(norm) {
        if let Ok(n) = v.parse::<u8>() {
            obj.insert(redis_client_json_key(norm), JsonValue::Number(n.into()));
        }
    }
}

fn redis_client_put_str(obj: &mut Map<String, JsonValue>, raw: &HashMap<String, &str>, norm: &str) {
    if let Some(v) = raw.get(norm) {
        obj.insert(
            redis_client_json_key(norm),
            JsonValue::String((*v).to_string()),
        );
    }
}

// 解析客户端信息（Redis 行里缺字段时由 `RedisClientInfo` 上 `#[serde(default)]` 填 0 / ""）
pub fn parse_client_info(client_info: &str) -> AnyResult<RedisClientInfo> {
    let mut raw: HashMap<String, &str> = HashMap::with_capacity(32);
    for key_eq_val in client_info.split_whitespace() {
        if let Some((key, val)) = key_eq_val.split_once('=') {
            raw.insert(key.replace('-', "_"), val);
        }
    }

    let mut obj = Map::new();

    for k in [
        "id",
        "fd",
        "age",
        "idle",
        "db",
        "sub",
        "psub",
        "ssub",
        "watch",
        "qbuf",
        "qbuf_free",
        "argv_mem",
        "multi_mem",
        "obl",
        "oll",
        "omem",
        "tot_mem",
        "redir",
        "rbp",
        "rbs",
        "io_thread",
    ] {
        redis_client_put_u64(&mut obj, &raw, k);
    }
    redis_client_put_i64(&mut obj, &raw, "multi");
    redis_client_put_u8(&mut obj, &raw, "resp");

    for k in ["addr", "laddr", "name", "flags", "events", "cmd", "user"] {
        redis_client_put_str(&mut obj, &raw, k);
    }

    let client: RedisClientInfo = serde_json::from_value(JsonValue::Object(obj))?;
    Ok(client)
}

// info 信息转换成图表数据
pub fn info_to_chart(redis_info: RedisInfo) -> AnyResult<RedisChart> {
    let mut chart = RedisChart::default();

    let mut key_total = 0;
    for line in redis_info.info.lines() {
        if line.is_empty() || line.starts_with("#") {
            continue;
        }

        if let Some((key, value)) = line.split_once(":").map(|(k, v)| (k.trim(), v.trim())) {
            match key {
                "connected_clients" => chart.connected_clients = value.parse().unwrap_or_default(),
                "instantaneous_ops_per_sec" => {
                    chart.instantaneous_ops_per_sec = value.parse().unwrap_or_default()
                }
                "used_memory" => chart.used_memory = value.parse().unwrap_or_default(),
                "instantaneous_input_kbps" => {
                    chart.instantaneous_input_kbps = value.parse().unwrap_or_default()
                }
                "instantaneous_output_kbps" => {
                    chart.instantaneous_output_kbps = value.parse().unwrap_or_default()
                }
                "total_connections_received" => {
                    chart.total_connections_received = value.parse().unwrap_or_default()
                }
                "total_commands_processed" => {
                    chart.total_commands_processed = value.parse().unwrap_or_default()
                }
                "keyspace_hits" => chart.keyspace_hits = value.parse().unwrap_or_default(),
                "keyspace_misses" => chart.keyspace_misses = value.parse().unwrap_or_default(),
                _ => {
                    // db0:keys=14410,expires=3997,avg_ttl=736124073
                    // db1:keys=50,expires=0,avg_ttl=0,subexpiry=0
                    // 匹配以 db 开头，后跟 1-2 位数字的 key
                    if key.starts_with("db") && key.len() >= 3 {
                        let num_part = &key[2..]; // 截取 db 后的数字部分
                        if num_part.chars().all(|c| c.is_ascii_digit()) && num_part.len() <= 2 {
                            // 解析 value 中的 keys 数值，包含完整的错误处理
                            let size = value
                                .split(',')
                                .next() // 取第一个逗号前的部分 (keys=14410)
                                .and_then(|part| part.split_once('=')) // 分割 key=value
                                .and_then(|(_, val)| val.parse::<u64>().ok()); // 解析数值

                            // 3. 更新数据结构（无 unwrap，安全处理解析失败）
                            if let Some(size) = size {
                                key_total += size;
                            }
                        }
                    }
                }
            }
        }
    }
    chart.key_total = key_total;
    chart.cache_hit_ratio = if chart.keyspace_hits + chart.keyspace_misses > 0 {
        chart.keyspace_hits as f64 / (chart.keyspace_hits + chart.keyspace_misses) as f64
    } else {
        0.0
    };
    Ok(chart)
}

// 新增：从 INFO SERVER 输出解析版本号
pub fn parse_server_version(info_output: &str) -> String {
    // Valkey 的 INFO SERVER 会同时输出:
    //   valkey_version:7.2.5
    //   redis_version:7.2.5
    // 优先获取 valkey_version，否则获取 redis_version
    let mut valkey_version: Option<&str> = None;
    let mut redis_version: Option<&str> = None;

    for line in info_output.lines() {
        let line = line.trim();
        if line.starts_with("valkey_version:") {
            valkey_version = Some(line.trim_start_matches("valkey_version:"));
        } else if line.starts_with("redis_version:") {
            redis_version = Some(line.trim_start_matches("redis_version:"));
        }
    }

    // 优先返回 valkey_version
    valkey_version
        .or(redis_version)
        .unwrap_or("0.0.0")
        .trim()
        .to_string()
}

/// 解析路径：shellexpand 自动处理 ~ 和环境变量
pub fn parse_path(path: &str) -> PathBuf {
    let expanded = shellexpand::full(path).unwrap_or(std::borrow::Cow::Borrowed(path));
    PathBuf::from(expanded.as_ref())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::model::RedisKey;
    use base64::Engine;
    use base64::prelude::BASE64_STANDARD;

    #[test]
    fn test_serde() -> AnyResult<()> {
        let key = RedisKey {
            key: "hepengju".to_string(),
            bytes: "hepengju".into(),
        };

        let json = serde_json::to_string(&key)?;
        println!("json: {}", json);
        // json: {"key":"hepengju","bytes":[104,101,112,101,110,103,106,117]}
        let base64 = BASE64_STANDARD.encode(b"hepengju");
        println!("base64: {}", base64);
        // base64: aGVwZW5nanU=
        Ok(())
    }

    #[test]
    fn test_parse_command() -> () {
        // cmd: , args: []
        // cmd: ping, args: []
        // cmd: set, args: ["name", "hepengju"]
        // cmd: config, args: ["set", "save", "3600 1 300 100 60 10000"]
        // cmd: config, args: ["set", "save", "3600 1 300 100 60 10000"]
        let (cmd, args) = parse_command("").unwrap();
        println!("cmd: {}, args: {:?}", cmd, args);
        let (cmd, args) = parse_command("ping").unwrap();
        println!("cmd: {}, args: {:?}", cmd, args);
        let (cmd, args) = parse_command("set name hepengju").unwrap();
        println!("cmd: {}, args: {:?}", cmd, args);
        let (cmd, args) = parse_command(r#"config set save "3600 1 300 100 60 10000" "#).unwrap();
        println!("cmd: {}, args: {:?}", cmd, args);
        let (cmd, args) = parse_command(r#"config set save '3600 1 300 100 60 10000' "#).unwrap();
        println!("cmd: {}, args: {:?}", cmd, args);
    }

    #[test]
    fn test_timestamp_to_string() {
        let timestamp = 1759409274;
        println!("{}", timestamp_to_string(timestamp));
    }

    #[test]
    fn test_parse_path() {
        // 支持多种格式
        let paths = vec![
            "~/.ssh/id_rsa",                  // Unix 风格
            r"~\.ssh\id_rsa",                 // Unix 风格
            "$HOME/.ssh/id_rsa",              // 环境变量
            "C:\\Users\\he_pe\\.ssh\\id_rsa", // Windows 风格
            r"C:\Users\he_pe\.ssh\id_rsa",    // 原始字符串
        ];

        for path in paths {
            println!("\nTrying: {}", path);
            println!("Parsed: {:?}", parse_path(path))
        }
    }
}
