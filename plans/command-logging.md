# RedisME 命令执行日志功能 - 实现方案

## 一、需求分析

实现一个命令执行日志功能，记录所有发送给 Redis 的命令，包括：
- 用户通过终端执行的命令
- 界面操作触发的命令（GET/SET/HSCAN 等）
- 批量操作（Pipeline）
- 集群路由命令
- 系统初始化命令（可选过滤）

## 二、核心原理

### redis-rs 命令执行路径

```
Commands trait 方法 (conn.get, conn.set, conn.hscan 等)
    ↓
Pipeline::query()
    ↓
ConnectionLike::req_packed_command()  ← 唯一拦截点（单机模式）
    ↓
实际网络发送/接收
```

**关键发现**: redis-rs 中所有命令最终都会调用 `ConnectionLike::req_packed_command()`，
因此只需包装这个 trait，就能拦截 100% 的命令。

## 三、方案设计

### 3.1 架构概览

```
┌─────────────────────────────────────────┐
│  前端 (Vue 3)                           │
│  ┌───────────────────────────────────┐  │
│  │ CommandLog.vue  (日志面板)        │  │
│  │ - 实时滚动展示                      │  │
│  │ - 过滤/搜索/高亮                    │  │
│  │ - 复制命令/响应                     │  │
│  │ - 导出/清空                         │  │
│  └───────────┬───────────────────────┘  │
│              │ Tauri Event / invoke     │
└──────────────┼──────────────────────────┘
               │
┌──────────────┼──────────────────────────┐
│  Tauri Backend (Rust)                   │
│              │                          │
│  ┌───────────▼───────────────────────┐  │
│  │ api.rs                            │  │
│  │ - get_command_logs()              │  │
│  │ - clear_command_logs()            │  │
│  │ - toggle_command_logger()         │  │
│  └───────────┬───────────────────────┘  │
│              │                          │
│  ┌───────────▼───────────────────────┐  │
│  │ CommandLogger (全局单例)          │  │
│  │ - 环形缓冲区 (默认10000条)        │  │
│  │ - 原子操作，线程安全              │  │
│  │ - 可选: emit 事件到前端           │  │
│  └───────────▲──────────────────────┘  │
│              │ log()                   │
│  ┌───────────┴───────────────────────┐  │
│  │ LoggingConnection (包装器)        │  │
│  │ - 实现 ConnectionLike trait       │  │
│  │ - 拦截 req_packed_command()       │  │
│  │ - 解析命令/记录耗时/序列化响应    │  │
│  │ - 过滤系统命令 (可选)             │  │
│  └───────────┬──────────────────────┘  │
│              │                         │
│  ┌───────────▼───────────────────────┐  │
│  │ redis::Connection (原始连接)      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 3.2 数据结构

#### 命令日志条目

```rust
pub struct CommandLogEntry {
    /// 自增ID
    pub id: u64,
    /// 时间戳 "2026-04-12 14:30:45.123"
    pub timestamp: String,
    /// 连接名称（用户定义的连接名）
    pub conn_name: String,
    /// 数据库索引
    pub db_index: u16,
    /// 命令名（大写）如 "GET", "HSET", "SCAN"
    pub command: String,
    /// 参数列表 ["mykey", "myvalue"]
    pub args: Vec<String>,
    /// 完整命令字符串 "GET mykey"（方便复制）
    pub full_command: String,
    /// 响应内容（截断到500字符）
    pub response: String,
    /// 执行耗时（毫秒）
    pub duration_ms: u64,
    /// 状态: "ok" / "error" / "slow"（超过100ms标记为慢命令）
    pub status: String,
    /// 错误信息（如果有）
    pub error: Option<String>,
}
```

#### 命令日志管理器

```rust
pub struct CommandLogger {
    /// 日志条目（环形缓冲区，达到上限覆盖最旧的）
    entries: RwLock<Vec<CommandLogEntry>>,
    /// 下一个ID
    next_id: AtomicU64,
    /// 最大条目数（默认10000）
    max_entries: usize,
    /// 是否启用
    enabled: AtomicBool,
    /// 慢命令阈值（毫秒，默认100）
    slow_threshold_ms: u64,
}
```

### 3.3 LoggingConnection 包装器

#### 核心拦截实现

```rust
impl ConnectionLike for LoggingConnection {
    /// 执行打包好的命令（所有命令最终都走这里）
    fn req_packed_command<'a>(
        &'a mut self,
        cmd: &'a Cmd,
    ) -> RedisResult<Value> {
        let start = Instant::now();
        let result = self.inner.req_packed_command(cmd);
        let duration_ms = start.elapsed().as_millis() as u64;
        
        self.log_command(cmd, &result, duration_ms);
        result
    }
    
    /// 发送打包的命令（用于 SUBSCRIBE/MONITOR 等）
    fn send_packed_command(&mut self, cmd: &Cmd) -> RedisResult<()> {
        self.inner.send_packed_command(cmd)
    }
    
    /// 接收响应（用于 SUBSCRIBE/MONITOR 等流式命令）
    fn recv_response(&mut self) -> RedisResult<Value> {
        self.inner.recv_response()
    }
    
    /// 设置数据库索引（SELECT 命令时更新）
    fn set_db(&mut self, db: u16) {
        self.db_index = db;
        self.inner.set_db(db);
    }
    
    fn get_db(&self) -> u16 {
        self.db_index
    }
}
```

#### 命令解析与日志记录

```rust
impl LoggingConnection {
    /// 解析 Cmd 对象，提取命令名和参数
    fn parse_cmd(cmd: &Cmd) -> (String, Vec<String>) {
        let mut cmd_iter = cmd.arg_iter();
        
        // 第一个参数是命令名
        let command = cmd_iter.next()
            .and_then(|arg| arg.to_str())
            .unwrap_or("UNKNOWN")
            .to_uppercase();
        
        // 其余是参数
        let args: Vec<String> = cmd_iter
            .filter_map(|arg| arg.to_str())
            .map(|s| s.to_string())
            .collect();
        
        (command, args)
    }
    
    /// 序列化 Redis Value 为字符串
    fn value_to_string(value: &Value) -> String {
        match value {
            Value::Nil => "(nil)".to_string(),
            Value::SimpleString(s) => s.clone(),
            Value::Int(i) => i.to_string(),
            Value::BulkString(b) => String::from_utf8_lossy(b).to_string(),
            Value::Array(arr) => {
                let items: Vec<String> = arr.iter()
                    .map(|v| Self::value_to_string(v))
                    .take(10)  // 最多取10个
                    .collect();
                format!("[{}{}]", items.join(", "), 
                    if arr.len() > 10 { "..." } else { "" })
            },
            Value::Map(map) => {
                let items: Vec<String> = map.iter()
                    .take(5)
                    .map(|(k, v)| format!("{}: {}", 
                        Self::value_to_string(k), 
                        Self::value_to_string(v)))
                    .collect();
                format!("{{{}}}", items.join(", "))
            },
            _ => format!("{:?}", value),
        }
    }
    
    /// 记录命令执行
    fn log_command(&self, cmd: &Cmd, result: &RedisResult<Value>, duration_ms: u64) {
        let (command, args) = Self::parse_cmd(cmd);
        
        // 过滤系统命令（可选）
        if Self::should_skip(&command) {
            return;
        }
        
        let (status, response, error) = match result {
            Ok(value) => {
                let resp = Self::value_to_string(value);
                let status = if duration_ms > self.slow_threshold_ms { 
                    "slow" 
                } else { 
                    "ok" 
                };
                (status.to_string(), Self::truncate(&resp, 500), None)
            },
            Err(e) => ("error".to_string(), String::new(), Some(e.to_string())),
        };
        
        let full_command = if args.is_empty() {
            command.clone()
        } else {
            format!("{} {}", command, args.join(" "))
        };
        
        let entry = CommandLogEntry {
            id: self.logger.next_id.fetch_add(1, Ordering::Relaxed),
            timestamp: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
            conn_name: self.conn_name.clone(),
            db_index: self.db_index,
            command,
            args,
            full_command,
            response,
            duration_ms,
            status,
            error,
        };
        
        self.logger.log(entry);
    }
    
    /// 是否跳过某些命令（可选配置）
    fn should_skip(command: &str) -> bool {
        // 可以配置跳过高频系统命令，例如:
        // matches!(command, "PING" | "CLIENT" | "SELECT")
        false  // 默认全部记录
    }
    
    /// 截断字符串
    fn truncate(s: &str, max_len: usize) -> String {
        if s.len() > max_len {
            format!("{}...", &s[..max_len])
        } else {
            s.to_string()
        }
    }
}
```

## 四、文件修改清单

### 4.1 新建文件

| 文件路径 | 说明 |
|---------|------|
| `src-tauri/src/utils/cmd_logger.rs` | CommandLogger 和 CommandLogEntry 定义 |
| `src-tauri/src/utils/logging_conn.rs` | LoggingConnection 包装器实现 |

### 4.2 修改文件

| 文件路径 | 修改内容 | 预计行数 |
|---------|---------|---------|
| `src-tauri/src/utils/mod.rs` | 导出新模块 `pub mod cmd_logger; pub mod logging_conn;` | +2 |
| `src-tauri/src/client/state.rs` | AppState 添加 `command_logger: Arc<CommandLogger>` 字段 | +10 |
| `src-tauri/src/client/impl_single.rs` | 1. MeSingle.conn 类型改为 `LoggingConnection`<br>2. init() 方法包装连接 | ~20 |
| `src-tauri/src/client/impl_cluster.rs` | 集群模式各方法添加日志（约10处 route_command 调用点） | ~50 |
| `src-tauri/src/api.rs` | 暴露 API: get_command_logs, clear_command_logs, toggle_command_logger | ~40 |
| `src-tauri/src/client/client_trait.rs` | Pipeline 调用点添加汇总日志（约10处，可选） | ~30 |

## 五、特殊场景处理

### 5.1 Pipeline 批量命令

**问题**: Pipeline::query() 内部批量执行命令，但 `req_packed_command` 只会被调用一次（整个 Pipeline 作为一个单元）。

**解决方案**: 在调用 Pipeline::query() 的业务方法中添加汇总日志

```rust
// 示例: memory_usage 方法
let start = Instant::now();
let mut pipe = Pipeline::with_capacity(keys.len());
for key in keys.iter() {
    pipe.cmd("memory").arg("usage").arg(key);
}
let sizes: Vec<Option<u64>> = pipe.query(&mut conn)?;
let duration_ms = start.elapsed().as_millis() as u64;

// 记录 Pipeline 汇总日志
logger.log(CommandLogEntry {
    command: "PIPELINE".to_string(),
    args: vec![format!("{}x MEMORY USAGE", keys.len())],
    full_command: format!("PIPELINE ({}x MEMORY USAGE)", keys.len()),
    response: format!("{} results", sizes.len()),
    duration_ms,
    status: "ok".to_string(),
    error: None,
    // ...
});
```

**需要添加 Pipeline 日志的位置** (约 10 处):
- `impl_single.rs`: memory_usage (2处), batch_del, batch_ttl
- `impl_cluster.rs`: memory_usage (2处), batch_del, batch_ttl
- `client_trait.rs`: mock_data (5种类型)

### 5.2 SUBSCRIBE / MONITOR 流式命令

这些命令使用 `send_packed_command()` + 循环 `recv_response()`，不适合作为普通命令记录。

**处理方式**: 保持现有的事件推送机制 (`EVENT_SUBSCRIBE`, `EVENT_MONITOR`)，不记录到命令日志。

### 5.3 集群模式

集群的 `ClusterConnection` **没有实现 `ConnectionLike`**，所有命令通过 `route_command()` / `req_command()` 执行。

**方案**: 在 `impl_cluster.rs` 中为每个 `route_command` / `req_command` 调用点手动添加日志

需要修改的方法（约 10 处）:
- `info()` / `info_list()`
- `scan()`
- `field_scan()`
- `execute_command()`
- `config_get()` / `config_set()`
- `slow_log()`
- `memory_usage()`
- `client_list()`

### 5.4 敏感命令过滤

某些命令的参数可能包含敏感信息（如密码），需要过滤:

```rust
fn sanitize_args(command: &str, args: &[String]) -> Vec<String> {
    match command {
        "AUTH" => vec!["***".to_string()],  // 隐藏密码
        "CONFIG" if args.get(0).map(|s| s.to_lowercase()) == Some("set".into()) => {
            // CONFIG SET 可能需要隐藏某些配置值
            args.to_vec()
        },
        _ => args.to_vec(),
    }
}
```

## 六、Tauri API 设计

### 6.1 后端 API

```rust
/// 获取命令日志列表
#[tauri::command]
pub async fn get_command_logs(
    state: State<'_, AppState>,
    limit: Option<usize>,       // 默认 1000
    offset: Option<usize>,      // 默认 0
    filter_command: Option<String>,  // 按命令名过滤
    filter_status: Option<String>,   // 按状态过滤
) -> Result<Vec<CommandLogEntry>, String> {
    let logger = state.get_logger();
    let mut entries = logger.get_entries();
    
    // 过滤
    if let Some(cmd) = filter_command {
        entries.retain(|e| e.command.to_uppercase().contains(&cmd.to_uppercase()));
    }
    if let Some(status) = filter_status {
        entries.retain(|e| e.status == status);
    }
    
    let limit = limit.unwrap_or(1000);
    let offset = offset.unwrap_or(0);
    
    Ok(entries.into_iter()
        .rev()  // 最新的在前
        .skip(offset)
        .take(limit)
        .collect())
}

/// 清空命令日志
#[tauri::command]
pub async fn clear_command_logs(
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.get_logger().clear();
    Ok(())
}

/// 切换日志开关
#[tauri::command]
pub async fn toggle_command_logger(
    state: State<'_, AppState>,
    enabled: bool,
) -> Result<bool, String> {
    let logger = state.get_logger();
    logger.set_enabled(enabled);
    Ok(logger.is_enabled())
}

/// 获取日志统计信息
#[tauri::command]
pub async fn get_command_log_stats(
    state: State<'_, AppState>,
) -> Result<CommandLogStats, String> {
    let logger = state.get_logger();
    let entries = logger.get_entries();
    
    let total = entries.len();
    let error_count = entries.iter().filter(|e| e.status == "error").count();
    let slow_count = entries.iter().filter(|e| e.status == "slow").count();
    let avg_duration = if total > 0 {
        entries.iter().map(|e| e.duration_ms).sum::<u64>() / total as u64
    } else {
        0
    };
    
    // 命令频率统计
    let mut cmd_counts: HashMap<String, usize> = HashMap::new();
    for entry in &entries {
        *cmd_counts.entry(entry.command.clone()).or_insert(0) += 1;
    }
    
    Ok(CommandLogStats {
        total,
        error_count,
        slow_count,
        avg_duration_ms: avg_duration,
        top_commands: cmd_counts.into_iter()
            .collect::<Vec<_>>()
            .sort_by(|a, b| b.1.cmp(&a.1))
            .into_iter()
            .take(10)
            .collect(),
    })
}
```

### 6.2 数据结构

```rust
#[derive(Serialize)]
pub struct CommandLogStats {
    pub total: usize,
    pub error_count: usize,
    pub slow_count: usize,
    pub avg_duration_ms: u64,
    pub top_commands: Vec<(String, usize)>,
}
```

## 七、前端设计（概要）

### 7.1 组件结构

```
src/views/
└── CommandLog.vue              # 命令日志主面板
    ├── CommandLogFilter.vue    # 过滤栏组件
    ├── CommandLogTable.vue     # 日志表格组件
    └── CommandLogDetail.vue    # 详情抽屉/弹窗
```

### 7.2 核心功能

| 功能 | 说明 |
|------|------|
| 实时滚动 | 新日志自动滚动到底部 |
| 暂停/继续 | 暂停自动滚动，方便查看 |
| 命令过滤 | 按命令名、状态、连接名、时间范围过滤 |
| 关键字搜索 | 高亮匹配的命令参数 |
| 复制命令 | 一键复制完整命令 |
| 慢命令高亮 | 红色标记超过阈值的命令 |
| 统计面板 | 显示命令频率、平均耗时等 |
| 导出 | 导出为 JSON/CSV 文件 |
| 清空 | 清空当前日志 |

### 7.3 实时推送方案

```javascript
// 方案1: 轮询（简单，适合日志量不大）
const timer = setInterval(async () => {
  const logs = await invoke('get_command_logs', { 
    limit: 100, 
    offset: currentOffset 
  })
  addLogs(logs)
}, 1000)

// 方案2: Tauri Event（实时，但高频 emit 可能有性能影响）
listen('command-log', (event) => {
  addLog(event.payload)
})

// 推荐: 方案1 + 手动刷新按钮
```

## 八、性能考虑

### 8.1 开销评估

| 操作 | 耗时 | 说明 |
|------|------|------|
| parse_cmd() | < 0.01ms | 简单的参数提取 |
| value_to_string() | < 0.1ms | 序列化响应（截断到10个元素） |
| log() | < 0.01ms | RwLock 写入 |
| **总计** | **< 0.2ms** | 对命令执行影响极小 |

### 8.2 优化措施

1. **环形缓冲区**: 限制最大条目数，避免内存无限增长
2. **响应截断**: 响应内容截断到 500 字符，数组最多取 10 个元素
3. **可选开关**: 提供全局开关，生产环境可关闭
4. **异步 emit**: 前端推送使用异步事件，不阻塞命令执行
5. **跳过滤镜**: 可配置跳过高频系统命令（PING 等）

### 8.3 内存占用估算

```
单条日志大小: ~500 字节 (命令 + 参数 + 响应)
最大条目数: 10,000
总内存: ~5 MB
```

## 九、实施步骤

### Phase 1: 核心功能（优先级最高）
- [ ] 新建 `cmd_logger.rs` - CommandLogger 实现
- [ ] 新建 `logging_conn.rs` - LoggingConnection 包装器
- [ ] 修改 `impl_single.rs` - 单机模式接入
- [ ] 修改 `state.rs` - 全局状态管理
- [ ] 修改 `api.rs` - 暴露基础 API

### Phase 2: 完善覆盖率
- [ ] 修改 `impl_cluster.rs` - 集群模式添加 日志
- [ ] 修改 `client_trait.rs` - Pipeline 汇总日志
- [ ] 添加命令过滤/敏感信息处理

### Phase 3: 前端界面
- [ ] 新建 `CommandLog.vue` 组件
- [ ] 实现实时轮询/推送
- [ ] 实现过滤/搜索功能
- [ ] 实现统计面板

### Phase 4: 高级功能（可选）
- [ ] 导出 JSON/CSV
- [ ] 慢命令告警
- [ ] 命令频率图表
- [ ] 持久化到文件

## 十、替代方案比较

| 方案 | 拦截位置 | 覆盖率 | 实现复杂度 | 维护成本 | 推荐度 |
|------|---------|--------|-----------|---------|--------|
| **Connection 包装器** | ConnectionLike trait | 95%+ | 中 | 低 | ⭐⭐⭐⭐⭐ |
| 业务方法手动记录 | 每个函数 | 100% | 高 | 高 | ⭐⭐ |
| redis-rs Fork 修改 | redis-rs 源码 | 100% | 极高 | 极高 | ⭐ |
| Pipeline 包装器 | Pipeline 层 | 80% | 中 | 中 | ⭐⭐⭐ |

## 十一、注意事项

1. **集群模式特殊**: ClusterConnection 没有实现 ConnectionLike，需单独处理
2. **Pipeline 限制**: Pipeline::query() 只记录一次，子命令需业务层添加汇总日志
3. **SUBSCRIBE/MONITOR**: 流式命令不适合记录到命令日志，保持现有事件机制
4. **敏感信息**: AUTH 等命令的参数需要过滤/脱敏
5. **线程安全**: CommandLogger 使用 RwLock + Atomic 保证并发安全
6. **性能监控**: 建议后续添加日志写入耗时监控，确保不影响正常操作

## 十二、测试计划

### 12.1 单元测试

- [ ] CommandLogger 基本功能（写入/读取/清空/环形覆盖）
- [ ] LoggingConnection::parse_cmd() 命令解析
- [ ] value_to_string() 各种 Value 类型序列化
- [ ] 并发安全测试（多线程同时写入）

### 12.2 集成测试

- [ ] 单机模式: 执行命令后检查日志
- [ ] 集群模式: 执行命令后检查日志
- [ ] Pipeline: 批量操作后检查汇总日志
- [ ] 开关测试: 关闭后不产生日志

### 12.3 性能测试

- [ ] 执行 1000 次命令，评估日志记录开销
- [ ] 内存占用监控（长时间运行）
- [ ] 大响应值处理（如 SCAN 返回大量键）
