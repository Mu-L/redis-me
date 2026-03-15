# 图表

[RedisME](https://www.hepengju.com) 图表基于Redis的`info`命令返回数据，使用[chart.js](https://www.chartjs.org)绘制实现，在性能压测与服务器监控排查中有重要作用

## 功能简述
- **丰富数据图表**: 默认展示前3个，点击更多可显示另外5个扩展图表
  - 默认: 命令执行数/秒、已使用内存、网络输入输出
  - 扩展: 键数量、客户端连接数、缓存命中率、服务器接受的总连接数/总命令数
- **丰富定制功能**: 是否自动刷新，刷新间隔、保留时长和最大点数（时间均分算法）
- **集群指定节点**: 集群模式下支持监控某个主节点或从节点的数据

![main.png](/images/chart/main.png)
![more.png](/images/chart/more.png)
![chartjs.png](/images/chart/chartjs.png)

## 指标详情
```rust
// 图表的计算指标说明
struct RedisChart {  
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
```