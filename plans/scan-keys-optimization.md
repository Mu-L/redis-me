# 扫描键功能优化改造方案

> 参考项目：AnotherRedisDesktopManager、RedisInsight、tiny-rdm
> 目标：速度快、不卡死、边扫边显示

---

## 一、三款 RDM 扫描键策略分析

### 1. AnotherRedisDesktopManager (ARDM)

**技术栈**：Node.js + Vue + Electron

**核心机制**：Node.js Stream API (`scanBufferStream`)

```javascript
// 每个节点创建一个 stream
const stream = node.scanBufferStream({ match, count })
this.scanStreams.push(stream)

// 实时数据回调
stream.on('data', keys => {
  this.keyList = this.keyList.concat(keys)
  this.onePageKeysCount += keys.length

  // 达到一页大小时暂停
  if (this.onePageKeysCount >= keysPageSize && !loadAll) {
    stream.pause()
  }
})

// 加载更多时恢复
stream.resume()
```

**特点**：

- **流式实时显示**：`data` 事件实时返回匹配的 key，用户立即看到结果
- **分页控制**：`stream.pause()` / `stream.resume()` 控制扫描节奏
- **状态反馈**：搜索框显示 loading / cancel 图标，可取消扫描
- **集群支持**：每个 master 节点创建独立 stream

**优点**：

- 用户体验好，边扫边显示，无等待感
- 内存友好，流式处理，不需要一次性加载所有结果
- 支持取消扫描，防止误操作后长时间等待

**缺点**：

- 依赖 Node.js Stream API，Tauri 环境无法直接使用
- 需要额外处理 stream 错误和结束事件

---

### 2. RedisInsight

**技术栈**：React + Node.js (后端 API)

**核心机制**：HTTP API 请求 + cursor 分页

```typescript
// 前端通过 HTTP 请求后端 SCAN
const { data } = await apiService.post(`/databases/${id}/keys`, {
  cursor,
  count,
  type,
  match,
  scanThreshold, // 扫描阈值配置
})

// 加载更多
dispatch(loadMoreKeysSuccess({ keys: oldKeys.concat(newKeys), cursor: nextCursor }))
```

**特点**：

- **前后端分离**：前端纯 UI，后端执行 SCAN
- **请求取消**：使用 `CancelToken` 支持取消扫描
- **配置阈值**：`scanThreshold` 控制单次扫描量
- **分页加载**：每次请求带 cursor，分批返回

**优点**：

- 架构清晰，前后端职责分离
- 支持取消，用户体验好
- 可配置扫描阈值，适应不同规模的数据库

**缺点**：

- HTTP 往返开销较大
- 实时性不如 Stream 模式

---

### 3. tiny-rdm

**技术栈**：Go (Wails) + Vue

**核心机制**：后端 Go 执行 SCAN，前端轮询

```go
// 后端 scanKeys 函数
func (b *browserService) scanKeys(ctx context.Context, client redis.UniversalClient,
  match, keyType string, cursor uint64, count int64) ([]any, uint64, error) {

  scanSize := int64(Preferences().GetScanSize()) // 默认 3000
  scanCount := int64(0)

  for {
    if filterType {
      loadedKey, cursor, err = cli.ScanType(ctx, cursor, match, scanSize, keyType).Result()
    } else {
      loadedKey, cursor, err = cli.Scan(ctx, cursor, match, scanSize).Result()
    }
    // ...
    scanCount += int64(len(ks))
    if (count > 0 && scanCount > count) || cursor == 0 {
      break
    }
  }
}
```

**三种加载模式**：

- `LoadNextKeys`：加载下一批（带 cursor，分页）
- `LoadNextAllKeys`：加载剩余所有（cursor=0, count=0 无限制）
- `LoadAllKeys`：从头加载所有

**特点**：

- **后端控制**：扫描逻辑完全在后端
- **配置扫描大小**：`scanSize` 可配置
- **集群支持**：`ForEachMaster` 遍历所有 master

**优点**：

- 前端简单，纯展示
- 后端可灵活控制扫描策略

**缺点**：

- `LoadNextAllKeys` / `LoadAllKeys` 后端可能长时间阻塞
- 无取消功能
- 前端无法实时看到中间结果

---

## 二、三款 RDM 综合对比

| 维度           | ARDM                | RedisInsight      | tiny-rdm       | redis-me(当前)      |
| -------------- | ------------------- | ----------------- | -------------- | ------------------- |
| **扫描方式**   | Stream API          | HTTP API + cursor | Go 后端 SCAN   | Tauri 命令 + cursor |
| **实时显示**   | ✅ 流式实时         | ❌ 分批返回       | ❌ 分批返回    | ✅ 分批返回         |
| **分页控制**   | stream.pause/resume | cursor 参数       | cursor + count | SCAN_MAX_ITERATIONS |
| **加载全部**   | 大 COUNT            | scanThreshold     | count=0        | 前端循环轮询        |
| **取消扫描**   | ✅ stream.destroy   | ✅ CancelToken    | ❌             | ❌                  |
| **前端复杂度** | 高                  | 低                | 低             | 中                  |
| **后端复杂度** | 低                  | 中                | 高             | 中                  |

---

## 三、改造方案设计

### 目标

1. **速度快**：减少单次请求时间，利用分批加载避免长时间等待
2. **不卡死**：后端限制单次 SCAN 迭代次数，前端异步轮询
3. **边扫边显示**：用户能实时看到扫描结果，无需等待全部完成

### 核心策略

结合三款 RDM 的优点，采用 **"后端限流 + 前端轮询 + 实时显示"** 策略：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户操作   │────▶│   前端轮询   │────▶│  后端 SCAN   │
│  搜索/加载  │     │ setTimeout  │     │ 30次迭代限制 │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │              10ms间隔               每次30次
       │                   │                   │
       ▼                   ▼                   ▼
  ┌─────────────────────────────────────────────────┐
  │            实时显示扫描结果                      │
  │   - 搜索时：有结果立即停止，用户立即看到          │
  │   - 加载全部：循环轮询直到扫完                    │
  │   - loading 状态保持不闪烁                       │
  └─────────────────────────────────────────────────┘
```

### 具体改造点

#### 1. 后端限流（已实现 ✅）

```rust
// client_trait.rs
pub const SCAN_MAX_ITERATIONS: u32 = 30;
```

- 单次请求最多执行 **30 次 SCAN 命令**
- 防止大数据量时单次请求耗时过长
- 保证响应速度 < 1s

#### 2. 前端轮询（已实现 ✅）

```typescript
// loadAll 模式：循环加载直到扫描完成
if (loadAll && cursor.value && !cursor.value.finished) {
  keepLoading = true
  setTimeout(() => scanKey(true, true), 10) // 10ms 间隔
}
```

- **10ms 轮询间隔**：让出主线程给 UI 渲染，又不过度等待
- **`keepLoading` 标志**：循环加载期间保持 loading 状态，避免闪烁

#### 3. 搜索自动加载（已实现 ✅）

```typescript
// 自动加载停止条件：返回新结果 或 扫描完成
if (autoContinue && cursor.value && !cursor.value.finished && data.keyList.length === 0) {
  setTimeout(() => scanKey(true, false, true), 10)
}
```

- **返回新结果即停止**：用户看到结果后立即停止自动加载
- **无结果继续扫**：如果当前批次没有匹配到，自动继续扫描

#### 4. 取消扫描功能（待实现 ⏳）

参考 ARDM 和 RedisInsight，添加取消扫描功能：

```typescript
// 添加取消标志
let scanAbortController = new AbortController()

async function scanKey(..., signal?: AbortSignal) {
  // 每次请求前检查是否已取消
  if (signal?.aborted) return

  const data = await meCommands.scan(share.conn!.id, params)
  // ...
}

// 取消扫描
function cancelScanning() {
  scanAbortController.abort()
  scanAbortController = new AbortController()
}
```

**实现方式**：

- 前端添加 `AbortController`，在搜索框旁显示 cancel 图标
- 用户点击取消时，中断当前扫描，重置状态
- 需要后端配合支持取消（Tauri 命令可能需要额外处理）

#### 5. 搜索框状态显示（待实现 ⏳）

参考 ARDM，在搜索框显示扫描状态：

```vue
<el-input v-model="match" placeholder="Search keys...">
  <template #suffix>
    <el-icon v-if="scanning" class="is-loading"><Loading /></el-icon>
    <el-icon v-else-if="canCancel" @click="cancelScanning"><Close /></el-icon>
    <el-icon v-else><Search /></el-icon>
  </template>
</el-input>
```

**状态流转**：

- 空闲：🔍 搜索图标
- 扫描中：⏳ loading 旋转图标
- 可取消：❌ 取消图标（扫描一段时间后显示）

#### 6. SCAN 迭代次数动态调整（可选优化）

根据网络延迟和数据库规模，动态调整 `SCAN_MAX_ITERATIONS`：

```rust
// 本地 Redis：可以适当增大（50~100）
// 远程 Redis：保持 30 或更小
// 根据前几次请求的响应时间动态调整
```

### 改造优先级

| 优先级 | 改造点                       | 状态        | 说明               |
| ------ | ---------------------------- | ----------- | ------------------ |
| P0     | 后端限流 SCAN_MAX_ITERATIONS | ✅ 已完成   | 防止单次请求卡死   |
| P0     | 前端轮询 + keepLoading       | ✅ 已完成   | 避免 loading 闪烁  |
| P0     | 搜索自动加载                 | ✅ 已完成   | 有结果立即停止     |
| P1     | 取消扫描功能                 | ⏳ 待实现   | 提升用户体验       |
| P1     | 搜索框状态显示               | ⏳ 待实现   | 参考 ARDM          |
| P2     | SCAN 迭代次数动态调整        | 💡 可选优化 | 根据网络环境自适应 |

---

## 四、实现效果

### 搜索场景

```
用户输入搜索关键词
       │
       ▼
  ┌──────────┐
  │ 发起搜索  │
  └────┬─────┘
       │
       ▼
  ┌──────────┐     ┌──────────┐
  │ 后端扫描  │────▶│ 30次迭代 │
  └────┬─────┘     └────┬─────┘
       │                │
       │           无匹配结果
       │                │
       │                ▼
       │           ┌──────────┐
       │           │ 前端自动  │
       │           │ 继续扫描  │
       │           └────┬─────┘
       │                │
       │                ▼
       │           找到匹配结果
       │                │
       ▼                ▼
  ┌─────────────────────────┐
  │      显示结果，停止扫描   │
  └─────────────────────────┘
```

### 加载全部场景

```
用户点击"加载全部"
       │
       ▼
  ┌──────────┐
  │ 循环扫描  │
  └────┬─────┘
       │
       ▼
  ┌─────────────────────────────────┐
  │  批次1  │  批次2  │  批次3  │ ... │
  │  30次   │  30次   │  30次   │     │
  └─────────────────────────────────┘
       │
       │ 每批次间隔 10ms
       │ 结果实时追加到列表
       │
       ▼
  cursor == 0（扫描完成）
       │
       ▼
  ┌─────────────────┐
  │  释放 loading   │
  └─────────────────┘
```

---

## 五、总结

本次改造参考了三款主流 RDM 的扫描键策略，综合各自优点：

- **ARDM**：流式实时显示、状态反馈、取消扫描
- **RedisInsight**：前后端分离、请求取消、配置化
- **tiny-rdm**：后端控制扫描逻辑、配置扫描大小

**当前已实现**：

- ✅ 后端限流（SCAN_MAX_ITERATIONS = 30）
- ✅ 前端轮询（10ms 间隔）
- ✅ 搜索自动加载（有结果即停止）
- ✅ loading 不闪烁（keepLoading 标志）

**待实现**：

- ⏳ 取消扫描功能
- ⏳ 搜索框状态显示
- 💡 SCAN 迭代次数动态调整（可选）

---

## 六、最终改造方案（v2.0）

### 核心思路

**近乎实时**：后端每次固定扫描 10 次，快速返回一批结果，前端立即显示。
**可取消**：用户点击取消后，当前轮次完成即停止，不再发送后续请求。

### 后端改造

#### SCAN_MAX_ITERATIONS 改为 10

```rust
// client_trait.rs
pub const SCAN_MAX_ITERATIONS: u32 = 10;
```

- 从 30 次降为 **10 次**，单次请求更快返回（~300ms 以内）
- 用户几乎能实时看到结果刷新
- 10 次 × COUNT(1000~10000) = 每次扫 1万~10万个 bucket

### 前端改造

#### 新增取消扫描状态

```typescript
const scanCancelled = ref(false) // 扫描是否被取消
```

#### 搜索时重置取消标志

```typescript
if (!useCursor) {
  cursor.value = null
  scanCancelled.value = false // 新搜索时重置取消标志
  autoLoading.value = false
}
```

#### 循环前检查是否已取消

```typescript
// 搜索自动加载
if (autoContinue && cursor.value && !cursor.value.finished && data.keyList.length === 0) {
  if (!scanCancelled.value) {
    setTimeout(() => scanKey(true, false, true), 10)
  }
}

// loadAll 模式
if (loadAll && cursor.value && !cursor.value.finished) {
  if (!scanCancelled.value) {
    keepLoading = true
    setTimeout(() => scanKey(true, true), 10)
  }
}
```

#### 取消扫描方法

```typescript
function cancelScanning() {
  scanCancelled.value = true
}
```

### UI 交互设计

#### 按钮状态流转

```
初始状态：
┌─────────────────────────────────┐
│  [搜索框]  [加载更多] [加载全部] │
└─────────────────────────────────┘

加载全部后：
┌─────────────────────────────────┐
│  [搜索框 ⏳] [加载更多] [取消]   │
└─────────────────────────────────┘

点击取消后：
┌─────────────────────────────────┐
│  [搜索框]  [加载更多] [加载全部] │
│         已加载 150/10000 条      │
└─────────────────────────────────┘
```

#### 实现细节

- **点击"加载全部"**：按钮变为"取消"，显示取消图标
- **点击"取消"**：设置 `scanCancelled = true`，当前轮次完成后停止
- **搜索框状态**：扫描时显示 loading 图标，可取消时显示取消图标
- **结果保留**：取消后保留已加载的结果，不清空列表

### 边界情况处理

| 场景     | 处理逻辑                                   |
| -------- | ------------------------------------------ |
| 正常完成 | `cursor.finished = true`，自动释放 loading |
| 用户取消 | `scanCancelled = true`，当前轮次结束停止   |
| 新搜索   | 自动重置 `scanCancelled = false`           |
| 快速取消 | 如果请求已发出，等待当前请求完成后停止     |

### 改造优先级（更新后）

| 优先级 | 改造点                        | 状态      | 说明                  |
| ------ | ----------------------------- | --------- | --------------------- |
| P0     | 后端 SCAN_MAX_ITERATIONS = 10 | ⏳ 待实现 | 固定10次，快速返回    |
| P0     | 取消扫描功能                  | ⏳ 待实现 | 提升用户体验          |
| P0     | 搜索框状态显示                | ⏳ 待实现 | loading / cancel 图标 |
| P1     | loading 不闪烁（keepLoading） | ✅ 已完成 | 避免 true→false→true  |
| P1     | 搜索自动加载                  | ✅ 已完成 | 有结果即停止          |

---

_方案文档更新于 2026-06-18_
