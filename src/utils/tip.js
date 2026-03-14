// https://redis.ac.cn/docs/latest/commands/info/

import { isZh } from '@/utils/util.js'

const zhInfoTip = {
  monotonic_clock:
    '单调时钟，保证时间值始终单调递增，不会因为系统时间调整（例如 NTP 同步、手动修改系统时间）而出现回退或跳跃',

  server: 'Redis 服务器的一般信息',
  clients: '客户端连接部分',
  memory:
    '内存消耗相关信息（理想情况下，used_memory_rss 的值应该只比 used_memory 略高。当 rss >> used 时，较大的差异可能意味着存在（外部）内存碎片，这可以通过检查 allocator_frag_ratio、allocator_frag_bytes 来评估。当 used >> rss 时，意味着部分 Redis 内存已被操作系统交换到磁盘：预期会出现显著的延迟。）',
  persistence: 'RDB 和 AOF 相关信息',
  threads: 'I/O 线程信息',
  stats: '一般统计数据',
  replication: '主从复制信息',
  cpu: 'CPU 消耗统计',
  commandstats: 'Redis 命令统计',
  latencystats: 'Redis 命令延迟百分位分布统计',
  sentinel: 'Redis Sentinel 部分（仅适用于 Sentinel 实例）',
  cluster: 'Redis Cluster 部分',
  modules: '模块部分',
  keyspace: '数据库相关统计',
  errorstats: 'Redis 错误统计',
  redis_version: 'Redis 服务器版本',
  redis_git_sha1: 'Git SHA1',
  redis_git_dirty: 'Git dirty 标志',
  redis_build_id: '构建 ID',
  redis_mode: '服务器模式（"standalone"、"sentinel" 或 "cluster"）',
  os: '托管 Redis 服务器的操作系统',
  arch_bits: '架构（32 位或 64 位）',
  multiplexing_api: 'Redis 使用的事件循环机制',
  atomicvar_api: 'Redis 使用的 Atomicvar API',
  gcc_version: '用于编译 Redis 服务器的 GCC 编译器版本',
  process_id: '服务器进程的 PID',
  process_supervised: '受监控的系统（"upstart"、"systemd"、"unknown" 或 "no"）',
  run_id: '识别 Redis 服务器的随机值（供 Sentinel 和 Cluster 使用）',
  tcp_port: 'TCP/IP 监听端口',
  server_time_usec: '基于 Epoch 的系统时间，精确到微秒',
  uptime_in_seconds: '自 Redis 服务器启动以来的秒数',
  uptime_in_days: '相同值以天表示',
  hz: '服务器当前频率设置',
  configured_hz: '服务器配置的频率设置',
  lru_clock: '每分钟递增的时钟，用于 LRU 管理',
  executable: '服务器可执行文件的路径',
  config_file: '配置文件的路径',
  io_threads_active: '标志，表示 I/O 线程是否活跃',
  shutdown_in_milliseconds:
    '副本在完成关闭序列前追赶复制数据的剩余最长时间。此字段仅在关闭期间存在。',
  connected_clients: '客户端连接数（不包括副本连接）',
  cluster_connections: 'Cluster 总线使用的套接字数量的近似值',
  maxclients:
    'maxclients 配置指令的值。这是 connected_clients、connected_slaves 和 cluster_connections 之和的上限。',
  client_recent_max_input_buffer: '当前客户端连接中最大的输入缓冲区',
  client_recent_max_output_buffer: '当前客户端连接中最大的输出缓冲区',
  blocked_clients:
    '在阻塞调用 (BLPOP, BRPOP, BRPOPLPUSH, BLMOVE, BZPOPMIN, BZPOPMAX) 上等待的客户端数量',
  tracking_clients: '正在被跟踪的客户端数量 (CLIENT TRACKING)',
  pubsub_clients:
    '处于发布/订阅模式的客户端数量 (SUBSCRIBE, PSUBSCRIBE, SSUBSCRIBE)。在 Redis 7.4 中添加',
  watching_clients: '处于 WATCH 模式的客户端数量 (WATCH)。在 Redis 7.4 中添加',
  clients_in_timeout_table: '客户端超时表中的客户端数量',
  total_watched_keys: '被监视键的数量。在 Redis 7.4 中添加。',
  total_blocking_keys: '阻塞键的数量。在 Redis 7.2 中添加。',
  total_blocking_keys_on_nokey:
    '一个或多个客户端希望在键删除时解除阻塞的阻塞键数量。在 Redis 7.2 中添加。',
  used_memory: 'Redis 使用其分配器（标准 libc、jemalloc 或 tcmalloc 等替代分配器）分配的总字节数',
  used_memory_human: '上一个值的易读表示',
  used_memory_rss:
    '操作系统看到的 Redis 分配的字节数（又称常驻集大小）。这是 top(1) 和 ps(1) 等工具报告的数字。',
  used_memory_rss_human: '上一个值的易读表示',
  used_memory_peak: 'Redis 消耗的峰值内存量（字节）',
  used_memory_peak_human: '上一个值的易读表示',
  used_memory_peak_perc: 'used_memory 占 used_memory_peak 的百分比',
  used_memory_overhead: '服务器为管理其内部数据结构分配的所有开销的总字节数',
  used_memory_startup: 'Redis 启动时消耗的初始内存量（字节）',
  used_memory_dataset: '数据集大小（字节）（used_memory 减去 used_memory_overhead）',
  used_memory_dataset_perc:
    'used_memory_dataset 占净内存使用量（used_memory 减去 used_memory_startup）的百分比',
  total_system_memory: 'Redis 主机拥有的总内存量',
  total_system_memory_human: '上一个值的易读表示',
  used_memory_lua:
    'Lua 引擎用于 EVAL 脚本的字节数。在 Redis 7.0 中已弃用，重命名为 used_memory_vm_eval',
  used_memory_vm_eval:
    '脚本 VM 引擎用于 EVAL 框架的字节数（不属于 used_memory）。在 Redis 7.0 中添加',
  used_memory_lua_human: '上一个值的易读表示。在 Redis 7.0 中已弃用',
  used_memory_scripts_eval: 'EVAL 脚本的字节开销（属于 used_memory）。在 Redis 7.0 中添加',
  number_of_cached_scripts: '服务器缓存的 EVAL 脚本数量。在 Redis 7.0 中添加',
  number_of_functions: '函数数量。在 Redis 7.0 中添加',
  number_of_libraries: '库数量。在 Redis 7.0 中添加',
  used_memory_vm_functions:
    '脚本 VM 引擎用于 Functions 框架的字节数（不属于 used_memory）。在 Redis 7.0 中添加',
  used_memory_vm_total:
    'used_memory_vm_eval + used_memory_vm_functions（不属于 used_memory）。在 Redis 7.0 中添加',
  used_memory_vm_total_human: '上一个值的易读表示。',
  used_memory_functions: 'Function 脚本的字节开销（属于 used_memory）。在 Redis 7.0 中添加',
  used_memory_scripts:
    'used_memory_scripts_eval + used_memory_functions（属于 used_memory）。在 Redis 7.0 中添加',
  used_memory_scripts_human: '上一个值的易读表示',
  maxmemory: 'maxmemory 配置指令的值',
  maxmemory_human: '上一个值的易读表示',
  maxmemory_policy: 'maxmemory-policy 配置指令的值',
  mem_fragmentation_ratio:
    'used_memory_rss 和 used_memory 之间的比率。注意，这不仅包括碎片，还包括其他进程开销（参见 allocator_* 指标）以及代码、共享库、堆栈等开销。',
  mem_fragmentation_bytes:
    'used_memory_rss 和 used_memory 之间的差值。注意，当总碎片字节数很低（几兆字节）时，高比率（例如 1.5 或更高）并不表示问题。',
  'allocator_frag_ratio:':
    'allocator_active 和 allocator_allocated 之间的比率。这是真实的（外部）碎片指标（不是 mem_fragmentation_ratio）。',
  allocator_frag_bytes:
    'allocator_active 和 allocator_allocated 之间的差值。参见关于 mem_fragmentation_bytes 的说明。',
  allocator_rss_ratio:
    'allocator_resident 和 allocator_active 之间的比率。这通常表示分配器可以且可能很快会释放回操作系统的页面。',
  allocator_rss_bytes: 'allocator_resident 和 allocator_active 之间的差值',
  rss_overhead_ratio:
    'used_memory_rss（进程 RSS）和 allocator_resident 之间的比率。这包括不属于分配器或堆的 RSS 开销。',
  rss_overhead_bytes: 'used_memory_rss（进程 RSS）和 allocator_resident 之间的差值',
  allocator_allocated: '从分配器分配的总字节数，包括内部碎片。通常与 used_memory 相同。',
  allocator_active: '分配器活跃页中的总字节数，包括外部碎片。',
  allocator_resident:
    '分配器中常驻（RSS）的总字节数，包括可以释放回操作系统的页面（通过 MEMORY PURGE 或仅等待）。',
  allocator_muzzy:
    '分配器中“模糊”(muzzy) 内存（RSS）的总字节数。模糊内存是指已释放但尚未完全返回给操作系统的内存。在需要时可以立即重用，或者在系统压力增加时由操作系统回收。',
  mem_not_counted_for_evict: '不计入键逐出的已用内存。这基本上是临时的副本和 AOF 缓冲区。',
  mem_clients_slaves:
    '副本客户端使用的内存 - 从 Redis 7.0 开始，副本缓冲区与复制积压共享内存，因此当副本未触发内存使用量增加时，此字段可能显示 0。',
  mem_clients_normal: '普通客户端使用的内存',
  mem_cluster_links: '启用集群模式时，集群总线上连接到对等节点的链接使用的内存。',
  mem_aof_buffer: '用于 AOF 和 AOF 重写缓冲区的临时内存',
  mem_replication_backlog: '复制积压使用的内存',
  mem_total_replication_buffers: '复制缓冲区消耗的总内存量 - 在 Redis 7.0 中添加。',
  mem_allocator: '内存分配器，在编译时选择。',
  mem_overhead_db_hashtable_rehashing:
    '当前正在重新哈希的数据库字典的临时内存开销 - 在 7.4 中添加。',
  active_defrag_running:
    '当启用 activedefrag 时，这表示碎片整理当前是否活跃，以及它打算利用的 CPU 百分比。',
  lazyfree_pending_objects:
    '等待释放的对象数量（调用 UNLINK 或使用 ASYNC 选项调用 FLUSHDB 和 FLUSHALL 的结果）',
  lazyfreed_objects: '已延迟释放的对象数量。',
  loading: '标志，表示转储文件加载是否正在进行',
  async_loading:
    '当前正在异步加载复制数据集，同时提供旧数据。这意味着 repl-diskless-load 已启用并设置为 swapdb。在 Redis 7.0 中添加。',
  current_cow_peak: '子进程 fork 运行时写时复制内存的峰值大小（字节）',
  current_cow_size: '子进程 fork 运行时写时复制内存的大小（字节）',
  current_cow_size_age: 'current_cow_size 值的年龄（秒）。',
  current_fork_perc:
    '当前 fork 进程的进度百分比。对于 AOF 和 RDB fork，它是 current_save_keys_processed 占 current_save_keys_total 的百分比。',
  current_save_keys_processed: '当前保存操作处理的键数量',
  current_save_keys_total: '当前保存操作开始时的键数量',
  rdb_changes_since_last_save: '自上次转储以来的更改次数',
  rdb_bgsave_in_progress: '标志，表示 RDB 保存正在进行',
  rdb_last_save_time: '上次成功 RDB 保存的基于 Epoch 的时间戳',
  rdb_last_bgsave_status: '上次 RDB 保存操作的状态',
  rdb_last_bgsave_time_sec: '上次 RDB 保存操作的持续时间（秒）',
  rdb_current_bgsave_time_sec: '如果正在进行 RDB 保存操作，则为此操作的持续时间（秒）',
  rdb_last_cow_size: '上次 RDB 保存操作期间写时复制内存的大小（字节）',
  rdb_last_load_keys_expired: '上次 RDB 加载期间删除的易失性键数量。在 Redis 7.0 中添加。',
  rdb_last_load_keys_loaded: '上次 RDB 加载期间加载的键数量。在 Redis 7.0 中添加。',
  aof_enabled: '标志，表示 AOF 日志记录已激活',
  aof_rewrite_in_progress: '标志，表示 AOF 重写操作正在进行',
  aof_rewrite_scheduled: '标志，表示一旦当前 RDB 保存完成，将安排一个 AOF 重写操作。',
  aof_last_rewrite_time_sec: '上次 AOF 重写操作的持续时间（秒）',
  aof_current_rewrite_time_sec: '如果正在进行 AOF 重写操作，则为此操作的持续时间（秒）',
  aof_last_bgrewrite_status: '上次 AOF 重写操作的状态',
  aof_last_write_status: '上次写入 AOF 操作的状态',
  aof_last_cow_size: '上次 AOF 重写操作期间写时复制内存的大小（字节）',
  module_fork_in_progress: '标志，表示模块 fork 操作正在进行',
  module_fork_last_cow_size: '上次模块 fork 操作期间写时复制内存的大小（字节）',
  aof_rewrites: '自启动以来执行的 AOF 重写次数',
  rdb_saves: '自启动以来执行的 RDB 快照次数',
  aof_current_size: 'AOF 当前文件大小',
  aof_base_size: '上次启动或重写时 AOF 文件大小',
  aof_pending_rewrite: '标志，表示一旦当前 RDB 保存完成，将安排一个 AOF 重写操作。',
  aof_buffer_length: 'AOF 缓冲区大小',
  aof_rewrite_buffer_length: 'AOF 重写缓冲区大小。注意：此字段在 Redis 7.0 中已移除',
  aof_pending_bio_fsync: '后台 I/O 队列中待处理的 fsync 任务数量',
  aof_delayed_fsync: '延迟 fsync 计数器',
  loading_start_time: '加载操作开始时间的基于 Epoch 的时间戳',
  loading_total_bytes: '总文件大小',
  loading_rdb_used_mem: '生成 RDB 文件时服务器的内存使用量',
  loading_loaded_bytes: '已加载的字节数量',
  loading_loaded_perc: '相同值表示为百分比',
  loading_eta_seconds: '加载完成的预计剩余时间（秒）',
  total_connections_received: '服务器接受的总连接数',
  total_commands_processed: '服务器处理的总命令数',
  instantaneous_ops_per_sec: '每秒处理的命令数',
  total_net_input_bytes: '从网络读取的总字节数',
  total_net_output_bytes: '写入网络的总字节数',
  total_net_repl_input_bytes: '为复制目的从网络读取的总字节数',
  total_net_repl_output_bytes: '为复制目的写入网络的总字节数',
  instantaneous_input_kbps: '每秒的网络读取速率，单位 KB/秒',
  instantaneous_output_kbps: '每秒的网络写入速率，单位 KB/秒',
  instantaneous_input_repl_kbps: '为复制目的，每秒的网络读取速率，单位 KB/秒',
  instantaneous_output_repl_kbps: '为复制目的，每秒的网络写入速率，单位 KB/秒',
  rejected_connections: '因 maxclients 限制而被拒绝的连接数',
  sync_full: '与副本进行完全同步的次数',
  sync_partial_ok: '接受的部分同步请求次数',
  sync_partial_err: '拒绝的部分同步请求次数',
  expired_subkeys: '哈希字段过期事件的数量',
  expired_keys: '键过期事件总数',
  expired_stale_perc: '可能过期的键的百分比',
  expired_time_cap_reached_count: '主动过期周期提前停止的次数',
  expire_cycle_cpu_milliseconds: '主动过期周期累积花费的时间（毫秒）',
  evicted_keys: '因 maxmemory 限制而被逐出的键数量',
  evicted_clients: '因 maxmemory-clients 限制而被逐出的客户端数量。在 Redis 7.0 中添加。',
  evicted_scripts:
    '因 LRU 策略而被逐出的 EVAL 脚本数量，参见 EVAL 以了解更多详情。在 Redis 7.4 中添加。',
  total_eviction_exceeded_time: '自服务器启动以来，used_memory 超过 maxmemory 的总时间（毫秒）',
  current_eviction_exceeded_time: '自 used_memory 上次超过 maxmemory 以来经过的时间（毫秒）',
  keyspace_hits: '在主字典中成功查找键的数量',
  keyspace_misses: '在主字典中查找键失败的数量',
  pubsub_channels: '具有客户端订阅的发布/订阅通道总数',
  pubsub_patterns: '具有客户端订阅的发布/订阅模式总数',
  pubsubshard_channels: '全局 pub/sub 分片通道数，包含客户端订阅。在 Redis 7.0.3 中添加。',
  latest_fork_usec: '最近一次 fork 操作的持续时间，单位为微秒。',
  total_forks: '服务器启动以来总共执行的 fork 操作次数。',
  migrate_cached_sockets: '为 MIGRATE 操作而打开的套接字数量。',
  slave_expires_tracked_keys: '为过期目的而跟踪的键的数量（仅适用于可写副本）。',
  active_defrag_hits: '活动碎片整理过程执行的值重新分配次数。',
  active_defrag_misses: '活动碎片整理过程启动但中止的值重新分配次数。',
  active_defrag_key_hits: '已被活动碎片整理的键的数量。',
  active_defrag_key_misses: '被活动碎片整理过程跳过的键的数量。',
  total_active_defrag_time: '内存碎片超出限制的总时间，单位为毫秒。',
  current_active_defrag_time: '自上次内存碎片超出限制以来经过的时间，单位为毫秒。',
  tracking_total_keys: '服务器正在跟踪的键的数量。',
  tracking_total_items: '正在跟踪的项的数量，即每个键的客户端数量之和。',
  tracking_total_prefixes: '服务器前缀表中跟踪的前缀数量（仅适用于广播模式）。',
  unexpected_error_replies: '意外错误回复的数量，这些错误类型来自 AOF 加载或复制。',
  total_error_replies:
    '发出的错误回复总数，即被拒绝的命令数（命令执行前的错误）和失败的命令数（命令执行中的错误）之和。',
  dump_payload_sanitizations: '转储载荷深度完整性验证的总次数（参见 sanitize-dump-payload 配置）。',
  total_reads_processed: '处理的读取事件总数。',
  total_writes_processed: '处理的写入事件总数。',
  io_threaded_reads_processed: '由 I/O 线程处理的读取事件数量。',
  io_threaded_writes_processed: '由 I/O 线程处理的写入事件数量。',
  client_query_buffer_limit_disconnections: '由于客户端达到查询缓冲区限制而断开的总连接数。',
  client_output_buffer_limit_disconnections: '由于客户端达到输出缓冲区限制而断开的总连接数。',
  reply_buffer_shrinks: '输出缓冲区缩小的总次数。',
  reply_buffer_expands: '输出缓冲区扩展的总次数。',
  eventloop_cycles: '事件循环的总周期数。',
  eventloop_duration_sum: '在事件循环中花费的总时间，单位为微秒（包括 I/O 和命令处理）。',
  eventloop_duration_cmd_sum: '执行命令花费的总时间，单位为微秒。',
  instantaneous_eventloop_cycles_per_sec: '每秒事件循环周期数。',
  instantaneous_eventloop_duration_usec: '单个事件循环周期平均花费的时间，单位为微秒。',
  acl_access_denied_auth: '认证失败次数。',
  acl_access_denied_cmd: '由于拒绝访问命令而被拒绝的命令数量。',
  acl_access_denied_key: '由于拒绝访问键而被拒绝的命令数量。',
  acl_access_denied_channel: '由于拒绝访问通道而被拒绝的命令数量。',
  role: '如果实例不是任何其他实例的副本，则值为 "master"；如果实例是某个主实例的副本，则值为 "slave"。请注意，副本可以是另一个副本的主实例（链式复制）。',
  master_failover_state: '正在进行中的故障转移的状态（如果有）。',
  master_replid: 'Redis 服务器的复制 ID。',
  master_replid2: '第二复制 ID，用于故障转移后的 PSYNC。',
  master_repl_offset: '服务器当前的复制偏移量。',
  second_repl_offset: '接受复制 ID 的最大偏移量。',
  repl_backlog_active: '指示复制积压缓冲区是否活动的标志。',
  repl_backlog_size: '复制积压缓冲区总大小，单位为字节。',
  repl_backlog_first_byte_offset: '复制积压缓冲区的起始主偏移量。',
  repl_backlog_histlen: '复制积压缓冲区中数据的字节大小。',
  master_host: '主实例的主机名或 IP 地址。',
  master_port: '主实例监听的 TCP 端口。',
  master_link_status: '链接状态 (up/down)。',
  master_last_io_seconds_ago: '自上次与主实例交互以来经过的秒数。',
  master_sync_in_progress: '指示主实例正在同步到副本。',
  slave_read_repl_offset: '副本实例的读取复制偏移量。',
  slave_repl_offset: '副本实例的复制偏移量。',
  slave_priority: '作为故障转移候选实例的优先级。',
  slave_read_only: '指示副本是否为只读的标志。',
  replica_announced: '指示副本是否由 Sentinel 宣布的标志。',
  master_sync_total_bytes:
    '需要传输的总字节数。当大小未知时（例如，使用 repl-diskless-sync 配置指令时），此值可能为 0。',
  master_sync_read_bytes: '已传输的字节数。',
  master_sync_left_bytes: '同步完成前剩余的字节数（当 master_sync_total_bytes 为 0 时可能为负）。',
  master_sync_perc:
    'master_sync_read_bytes 占 master_sync_total_bytes 的百分比，当 master_sync_total_bytes 为 0 时，使用 loading_rdb_used_mem 进行近似计算。',
  master_sync_last_io_seconds_ago: '在 SYNC 操作期间，自上次传输 I/O 以来经过的秒数。',
  master_link_down_since_seconds: '链接断开以来经过的秒数。',
  connected_slaves: '连接的副本数量。',
  min_slaves_good_slaves: '当前被认为“良好”的副本数量。',
  slaveXXX: 'id, IP 地址, 端口, 状态, 偏移量, 延迟',
  used_cpu_sys:
    'Redis 服务器消耗的系统 CPU，是服务器进程所有线程（主线程和后台线程）消耗的系统 CPU 之和。',
  used_cpu_user:
    'Redis 服务器消耗的用户 CPU，是服务器进程所有线程（主线程和后台线程）消耗的用户 CPU 之和。',
  used_cpu_sys_children: '后台进程消耗的系统 CPU。',
  used_cpu_user_children: '后台进程消耗的用户 CPU。',
  used_cpu_sys_main_thread: 'Redis 服务器主线程消耗的系统 CPU。',
  used_cpu_user_main_thread: 'Redis 服务器主线程消耗的用户 CPU。',
  sentinel_masters: '此 Sentinel 实例监控的 Redis 主实例数量。',
  sentinel_tilt: '值为 1 表示此 Sentinel 处于 TILT 模式。',
  sentinel_tilt_since_seconds:
    '当前 TILT 的持续时间，单位为秒；如果未处于 TILT 模式，则为 -1。在 Redis 7.0.0 中添加。',
  sentinel_running_scripts: '此 Sentinel 当前正在执行的脚本数量。',
  sentinel_scripts_queue_length: '等待执行的用户脚本队列长度。',
  sentinel_simulate_failure_flags: 'SENTINEL SIMULATE-FAILURE 命令的标志。',
  cluster_enabled: '指示 Redis 集群是否已启用。',
  dbXXX: 'keys=XXX,expires=XXX,avg_ttl=XXX,subexpiry=XXX',
  eventloop_duration_aof_sum: '在事件循环中刷新 AOF 花费的总时间，单位为微秒。',
  eventloop_duration_cron_sum:
    'cron 函数（包括 serverCron 和 beforeSleep，但不包括 IO 和 AOF 刷新）消耗的总时间，单位为微秒。',
  eventloop_duration_max: '单个事件循环周期花费的最大时间，单位为微秒。',
  eventloop_cmd_per_cycle_max: '单个事件循环周期处理的最大命令数。',
  allocator_allocated_lua: '分配器专门为 Lua 分配的总字节数，包括内部碎片。',
  allocator_active_lua: '分配器专门为 Lua 活动页面分配的总字节数，包括外部碎片。',
  allocator_resident_lua:
    '分配器专门为 Lua 驻留 (RSS) 的总字节数。这包括可以释放给 OS 的页面（通过 MEMORY PURGE 或仅等待释放的页面）。',
  allocator_frag_bytes_lua: 'allocator_active_lua 和 allocator_allocated_lua 之间的差值。',
}
const zhConfigTip = {
  include:
    '引入一个或多个其他配置文件，支持通配符，包含的文件按字母顺序加载，未匹配到文件时无错误提示',
  loadmodule: '启动时加载模块，可指定多个，模块加载失败会导致服务中止，支持为模块传递参数',
  bind: '指定 Redis 监听的网络接口 IP 地址，前缀 “-” 表示该地址不可用时不影响服务启动，默认监听回环地址 127.0.0.1 和::1',
  'bind-source-addr': '配置出站连接绑定的本地地址，影响连接路由方式',
  'protected-mode':
    '安全保护模式，开启且默认用户无密码时，仅允许本地连接（127.0.0.1、::1 或 Unix 域套接字），默认启用',
  'enable-protected-configs':
    '控制敏感配置指令的可修改权限，可选值 no（默认，禁止所有连接修改）、yes（允许所有连接修改）、local（仅允许本地连接修改）',
  'enable-debug-command': '控制调试命令的启用权限，可选值同 enable-protected-configs，默认 no',
  'enable-module-command': '控制模块命令的启用权限，可选值同 enable-protected-configs，默认 no',
  port: '监听的 TCP 端口，默认 6379，设为 0 则不监听 TCP 套接字',
  'tcp-backlog': 'TCP 监听队列长度，实际值受系统 /proc/sys/net/core/somaxconn 限制，默认 511',
  unixsocket: 'Unix 域套接字路径，未指定则不监听 Unix 域套接字',
  unixsocketperm: 'Unix 域套接字的权限，默认 700',
  timeout: '客户端空闲超时时间（秒），0 表示禁用超时关闭连接，默认 0',
  'tcp-keepalive':
    'TCP 保活时间（秒），非 0 值启用 SO_KEEPALIVE 选项，用于检测死连接和维持网络连接，默认 300',
  'socket-mark-id':
    '为监听套接字标记 ID，支持高级路由和过滤，Linux 对应连接标记、FreeBSD 对应套接字 cookie ID、OpenBSD 对应路由表 ID，默认 0',
  'tls-port': 'TLS 监听端口，启用 TLS 需配置此参数，默认禁用 TLS',
  'tls-cert-file': '服务器端 X.509 证书文件路径（PEM 格式），用于向客户端、主节点或集群节点认证',
  'tls-key-file': '服务器端私钥文件路径（PEM 格式）',
  'tls-key-file-pass': '加密私钥文件的密码',
  'tls-client-cert-file': '客户端（用于复制、集群连接等）X.509 证书文件路径（PEM 格式）',
  'tls-client-key-file': '客户端私钥文件路径（PEM 格式）',
  'tls-client-key-file-pass': '客户端加密私钥文件的密码',
  'tls-dh-params-file':
    'DH 参数文件路径，用于支持旧版 OpenSSL（<3.0）的 Diffie-Hellman 密钥交换，新版不推荐配置',
  'tls-ca-cert-file': 'CA 证书文件路径，用于认证 TLS 客户端和节点，Redis 不默认使用系统 CA 配置',
  'tls-ca-cert-dir': 'CA 证书目录路径，功能同 tls-ca-cert-file',
  'tls-auth-clients':
    '控制 TLS 客户端证书认证要求，可选值 no（不要求也不接受客户端证书）、optional（可选，提供则需有效），默认要求客户端证书',
  'tls-replication': '是否为复制链路启用 TLS，默认 no',
  'tls-cluster': '是否为集群总线启用 TLS，默认 no',
  'tls-protocols':
    '支持的 TLS 版本，可选 TLSv1、TLSv1.1、TLSv1.2、TLSv1.3（OpenSSL≥1.1.1），默认启用 TLSv1.2 和 TLSv1.3',
  'tls-ciphers': 'TLSv1.2 及以下支持的加密套件，语法参考 ciphers (1ssl) 手册，默认 DEFAULT:!MEDIUM',
  'tls-ciphersuites': 'TLSv1.3 支持的加密套件，语法参考 ciphers (1ssl) 手册',
  'tls-prefer-server-ciphers': '是否优先使用服务器端加密套件偏好，默认 no（遵循客户端偏好）',
  'tls-session-caching': '是否启用 TLS 会话缓存，默认 yes，用于加速客户端重连',
  'tls-session-cache-size': 'TLS 会话缓存最大数量，0 表示无限制，默认 20480',
  'tls-session-cache-timeout': 'TLS 会话缓存超时时间（秒），默认 300',
  daemonize: '是否以守护进程模式运行，默认 no，守护进程模式下会生成 pid 文件',
  supervised: '指定监控系统交互方式，可选 no（默认，无交互）、upstart、systemd、auto（自动检测）',
  pidfile:
    'pid 文件路径，非守护进程模式下未指定则不生成，守护进程模式默认 /var/run/redis.pid，推荐现代 Linux 系统使用 /run/redis.pid',
  loglevel: '日志详细程度，可选 debug、verbose、notice（默认，生产环境推荐）、warning、nothing',
  logfile: '日志文件路径，空字符串表示输出到标准输出，守护进程模式下标准输出日志会被导向 /dev/null',
  'syslog-enabled': '是否启用系统日志，默认 no',
  'syslog-ident': '系统日志标识，默认 redis',
  'syslog-facility': '系统日志设备，必须是 USER 或 LOCAL0-LOCAL7，默认 local0',
  'crash-log-enabled': '是否启用崩溃日志，默认启用，禁用可生成更干净的核心转储',
  'crash-memcheck-enabled': '是否启用崩溃日志的快速内存检查，默认启用，禁用可让 Redis 更快终止',
  databases: '数据库数量，默认 16 个（编号 0-15），可通过 SELECT 命令切换',
  'always-show-logo': '是否始终在启动日志中显示 ASCII 艺术 logo，默认 no，仅交互式会话默认显示',
  'hide-user-data-from-log': '是否禁止日志记录个人身份信息（PII），默认禁用',
  'set-proc-title': '是否修改进程标题以显示运行时信息，默认 yes',
  'proc-title-template':
    '进程标题模板，支持 {title}、{listen-addr}、{server-mode}、{port}、{tls-port}、{unixsocket}、{config-file} 变量，默认{title} {listen-addr} {server-mode}',
  'locale-collate': '字符串比较操作使用的本地环境，空字符串表示从环境变量获取，影响 Lua 脚本性能',
  save: "RDB 持久化触发条件，格式为 “< 秒数 > < 修改次数 >”，可配置多个条件，默认 3600 秒 1 次修改、300 秒 100 次修改、60 秒 10000 次修改，设为'' 禁用 RDB 持久化",
  'stop-writes-on-bgsave-error':
    'RDB 快照启用时，若后台保存失败是否停止接受写入，默认 yes，确保数据持久化正常',
  rdbcompression:
    '是否使用 LZF 压缩 RDB 文件中的字符串对象，默认 yes，禁用可节省 CPU 但增大文件体积',
  rdbchecksum:
    '是否在 RDB 文件末尾添加 CRC64 校验和，默认 yes，禁用可提升读写性能但降低文件完整性校验能力',
  'sanitize-dump-payload':
    '加载 RDB 或 RESTORE 数据时是否执行完整校验，可选 no（默认）、yes、clients，用于减少后续命令执行时的断言或崩溃风险',
  dbfilename: 'RDB 文件名称，默认 dump.rdb',
  'rdb-del-sync-files':
    '无持久化启用时，是否删除复制过程中生成的 RDB 文件，默认 no，仅在 AOF 和 RDB 均禁用时生效',
  dir: '工作目录，RDB 文件、AOF 文件均存储在此目录，默认./',
  replicaof: '配置当前实例为从节点，指定主节点的 IP 和端口',
  masterauth: '主节点的密码，主节点启用密码时需配置',
  masteruser:
    '复制使用的主节点用户名，Redis 6 及以上支持 ACL 时使用，用于执行 PSYNC 等复制所需命令',
  'replica-serve-stale-data':
    '从节点与主节点断开或复制中时是否返回过期数据，默认 yes，设为 no 则除部分命令外拒绝数据访问命令',
  'replica-read-only': '从节点是否只读，默认 yes，Redis 2.6 起默认只读',
  'repl-diskless-sync':
    '复制全量同步时使用的策略，yes 表示无盘同步（直接通过套接字传输 RDB），no 表示基于磁盘同步，默认 yes',
  'repl-diskless-sync-delay':
    '无盘同步时，等待更多从节点连接的延迟时间（秒），默认 5，设为 0 立即开始传输',
  'repl-diskless-sync-max-replicas':
    '无盘同步延迟期间，达到指定数量的从节点连接后提前开始同步，默认 0 表示不限制',
  'repl-diskless-load':
    '从节点加载主节点 RDB 数据的方式，可选 disabled（默认，先存储到磁盘再加载）、swapdb（内存中并行加载，需足够内存）、on-empty-db（仅空数据库时无盘加载）',
  'repl-ping-replica-period': '主节点向从节点发送 PING 的间隔时间（秒），默认 10',
  'repl-timeout':
    '复制超时时间（秒），涵盖 SYNC 批量传输、主从节点通信等场景，默认 60，需大于 repl-ping-replica-period',
  'repl-disable-tcp-nodelay':
    '全量同步后是否禁用从节点套接字的 TCP_NODELAY 选项，默认 no（低延迟优先），yes 可减少带宽占用但增加数据延迟',
  'repl-backlog-size':
    '复制积压缓冲区大小，用于从节点重连后的部分同步，默认 1mb，仅当有从节点连接时分配',
  'repl-backlog-ttl':
    '最后一个从节点断开后，复制积压缓冲区的释放时间（秒），默认 3600，0 表示永不释放',
  'replica-full-sync-buffer-limit':
    '全量同步时从节点可累积的复制数据流大小，0 表示继承主节点 client-output-buffer-limit replica 的硬限制，默认 0',
  'replica-priority':
    '从节点优先级，用于 Redis Sentinel 故障转移时选择主节点，值越小优先级越高，0 表示不可晋升为主节点，默认 100',
  'propagation-error-behavior':
    '处理复制流或 AOF 文件中命令执行错误的行为，可选 ignore（默认）、panic、panic-on-replicas',
  'replica-ignore-disk-write-errors':
    '从节点写入磁盘失败时是否忽略错误，默认 no（崩溃），yes 仅日志警告并执行命令',
  'replica-announced':
    '从节点是否被 Redis Sentinel 纳入报告，默认 yes，设为 no 则不被 sentinel replicas 命令显示，但仍可晋升为主节点（需配合 replica-priority 0 禁用晋升）',
  'min-replicas-to-write':
    '主节点接受写入所需的最小在线从节点数量，默认 0（禁用），需与 min-replicas-max-lag 配合使用',
  'min-replicas-max-lag': '主节点接受写入时，从节点的最大延迟时间（秒），默认 10',
  'replica-announce-ip': '从节点向主节点报告的 IP 地址，用于 NAT 或端口转发场景',
  'replica-announce-port': '从节点向主节点报告的端口，用于 NAT 或端口转发场景',
  'tracking-table-max-keys':
    '客户端缓存键跟踪的无效表最大键数量，默认 1000000，0 表示无限制，广播模式下此配置无效',
  'acllog-max-len': 'ACL 日志的最大条目数，用于记录 ACL 相关的失败命令和认证事件，默认 128',
  aclfile: '外部 ACL 用户配置文件路径，不可与当前配置文件中的用户配置同时使用',
  requirepass:
    '默认用户的密码，Redis 6 及以上为 ACL 系统的兼容层，与 aclfile 和 ACL LOAD 命令不兼容',
  'acl-pubsub-default':
    '新用户的默认 Pub/Sub 频道权限，可选 allchannels（允许所有频道）、resetchannels（禁止所有频道），Redis 7.0 默认 resetchannels',
  'rename-command':
    '重命名或禁用命令（已废弃），建议使用 ACL 控制命令权限，格式为 “rename-command 原命令 新命令”，新命令设为空字符串则禁用该命令',
  maxclients:
    '最大同时连接客户端数，默认 10000，实际受系统文件描述符限制，Redis Cluster 模式下需预留集群总线连接资源',
  maxmemory: 'Redis 使用的最大内存限制，达到限制后按 maxmemory-policy 执行键淘汰，默认无限制',
  'maxmemory-policy':
    '内存达到 maxmemory 后的键淘汰策略，可选 volatile-lru、allkeys-lru、volatile-lfu、allkeys-lfu、volatile-random、allkeys-random、volatile-ttl、noeviction（默认）',
  'maxmemory-samples':
    'LRU/LFU/TTL 淘汰算法的采样数量，默认 5，值越大越接近真实结果但 CPU 消耗越高，最大 64',
  'maxmemory-eviction-tenacity':
    '键淘汰处理的激进程度，0 为最低延迟、10 为默认、100 为优先处理淘汰忽略延迟，默认 10',
  'replica-ignore-maxmemory':
    '从节点是否忽略自身 maxmemory 配置，默认 yes（由主节点处理淘汰），仅当从节点可写或需独立内存限制时修改',
  'active-expire-effort':
    '主动过期键清理的力度，默认 1，取值 1-10，值越大清理越彻底但 CPU 消耗越高',
  'lazyfree-lazy-eviction': '内存淘汰时是否使用惰性删除（非阻塞），默认 no',
  'lazyfree-lazy-expire': '键过期时是否使用惰性删除，默认 no',
  'lazyfree-lazy-server-del': '服务器内部删除键（如 RENAME 覆盖）时是否使用惰性删除，默认 no',
  'replica-lazy-flush': '从节点全量同步时是否惰性清空数据库，默认 no',
  'lazyfree-lazy-user-del': '用户执行 DEL 命令时是否使用惰性删除，默认 no',
  'lazyfree-lazy-user-flush':
    '用户执行 FLUSHDB/FLUSHALL/SCRIPT FLUSH/FUNCTION FLUSH 时未指定同步 / 异步标志，是否默认异步删除，默认 no',
  'io-threads':
    'I/O 线程数，用于处理客户端套接字的读写和协议解析，默认禁用（1 表示仅主线程），建议 4 核及以上服务器启用，预留 1 个空闲核心',
  'oom-score-adj':
    '是否控制内核 OOM killer 的进程优先级，可选 no（默认）、yes（等同于 relative）、absolute、relative，用于优先淘汰后台子进程和从节点',
  'oom-score-adj-values':
    'OOM 优先级调整值，依次为主节点、从节点、后台子进程，取值 - 2000 至 2000，默认 0 200 800',
  'disable-thp':
    '是否禁用 Redis 进程的透明大页（THP），默认 yes，避免 fork 和写时复制（CoW）导致的延迟问题',
  appendonly: '是否启用 AOF 持久化，默认 no，AOF 与 RDB 可同时启用，启动时优先加载 AOF',
  appendfilename:
    'AOF 文件的基础名称，Redis 7 及以上使用多文件格式（基础文件、增量文件、清单文件），默认"appendonly.aof"',
  appenddirname: 'AOF 文件存储目录，默认"appendonlydir"',
  appendfsync:
    'AOF 文件的 fsync 策略，可选 always（每次写入同步，最安全）、everysec（每秒同步，默认）、no（由系统控制，最快）',
  'no-appendfsync-on-rewrite':
    'BGSAVE 或 BGREWRITEAOF 执行时，是否暂停 AOF 的 fsync，默认 no（优先数据安全），yes 可缓解 I/O 阻塞但降低耐久性',
  'auto-aof-rewrite-percentage':
    'AOF 自动重写的触发百分比，基于上次重写后的文件大小，默认 100（增长 100%），0 禁用自动重写',
  'auto-aof-rewrite-min-size': 'AOF 自动重写的最小文件大小，默认 64mb',
  'aof-load-truncated':
    '启动时加载被截断的 AOF 文件是否继续，默认 yes（加载可用部分并日志提示），no 则直接报错',
  'aof-load-corrupt-tail-max-size':
    '启动时允许自动修复的 AOF 文件尾部损坏字节数，默认 0（禁用自动修复），超出则需手动处理',
  'aof-use-rdb-preamble': 'AOF 基础文件是否使用 RDB 格式，默认 yes，RDB 格式更快更高效',
  'aof-timestamp-enabled':
    '是否在 AOF 中记录时间戳注释，支持按时间点恢复，默认 no，启用后可能与部分 AOF 解析器不兼容',
  'shutdown-timeout':
    '关闭时等待从节点同步的最大时间（秒），仅对有从节点的实例生效，默认 0（禁用）',
  'shutdown-on-sigint':
    '接收 SIGINT 信号时的关闭行为，可选 default（默认）、save、nosave、now、force，可组合（save 和 nosave 不可同时使用）',
  'shutdown-on-sigterm': '接收 SIGTERM 信号时的关闭行为，可选值同 shutdown-on-sigint，默认 default',
  'lua-time-limit':
    'EVAL 脚本、函数及部分模块命令的最大执行时间（毫秒），默认 5000，0 或负值表示无限制，超时后 Redis 仅允许部分命令执行',
  'busy-reply-threshold': '与 lua-time-limit 功能相同，为兼容旧配置的别名，默认 5000',
  'cluster-enabled': '是否启用 Redis Cluster 模式，默认 no，启用后实例才可加入集群',
  'cluster-config-file':
    '集群配置文件路径，由 Redis 自动创建和更新，不可手动编辑，默认 nodes-6379.conf',
  'cluster-node-timeout': '集群节点超时时间（毫秒），节点不可达超过此时间则标记为故障，默认 15000',
  'cluster-port':
    '集群总线监听端口，默认 0（命令端口 + 10000），手动配置后需在 cluster meet 命令中指定',
  'cluster-replica-validity-factor':
    '从节点故障转移的有效性因子，用于判断从节点数据是否过旧，默认 10，0 表示忽略数据年龄',
  'cluster-migration-barrier':
    '从节点迁移到无从节点主节点的迁移屏障，默认 1（原主节点至少保留 1 个从节点时才迁移），0 仅用于调试，大值禁用迁移',
  'cluster-allow-replica-migration':
    '是否允许从节点自动迁移，默认 yes，禁用则 cluster-migration-barrier 失效',
  'cluster-require-full-coverage':
    '集群是否需要所有哈希槽均被覆盖才接受查询，默认 yes，no 则部分槽可用时仍可查询对应键空间',
  'cluster-replica-no-failover': '从节点是否禁止自动故障转移，默认 no，yes 仅允许手动故障转移',
  'cluster-allow-reads-when-down':
    '集群故障时，节点是否仍为自身负责的槽提供读服务，默认 no，yes 适用于无需强一致性的场景（如缓存）',
  'cluster-allow-pubsubshard-when-down':
    '集群故障时，节点是否仍为自身负责的槽提供 Pub/Sub 服务，默认 yes',
  'cluster-link-sendbuf-limit':
    '集群总线连接的发送缓冲区内存限制（字节），默认 0（禁用），建议最小 1gb，用于防止缓冲区无限增长',
  'cluster-announce-hostname': '集群节点对外宣布的主机名，用于 SNI 或 DNS 路由，默认空字符串',
  'cluster-announce-human-nodename': '集群节点的人性化名称，用于调试和管理，默认空字符串',
  'cluster-preferred-endpoint-type':
    '集群对外提供的首选连接端点类型，可选 ip（默认）、hostname、unknown-endpoint',
  'cluster-compatibility-sample-ratio':
    '集群模式下命令兼容性检查的采样比例（0-100），默认 0（不采样），100 表示全量检查，高比例可能影响性能',
  'cluster-slot-stats-enabled':
    '是否启用哈希槽资源统计，默认 no，启用后可通过 CLUSTER SLOT-STATS 获取详细统计信息（如内存使用）',
  'cluster-slot-migration-write-pause-timeout':
    '槽迁移过程中，源节点暂停写入的超时时间（毫秒），默认 10000，防止写入长期阻塞',
  'cluster-slot-migration-handoff-max-lag-bytes':
    '槽迁移触发切换阶段的最大复制延迟（字节），默认 1mb，剩余延迟低于此值时源节点暂停写入',
  'cluster-announce-ip': '集群节点对外宣布的 IP 地址，用于 NAT 或容器环境',
  'cluster-announce-tls-port': '集群节点对外宣布的 TLS 端口，tls-cluster 启用时生效',
  'cluster-announce-bus-port': '集群节点对外宣布的总线端口',
  'slowlog-log-slower-than':
    '慢查询日志的阈值（微秒），超过此时间的命令会被记录，1000000 微秒 = 1 秒，负值禁用，0 记录所有命令，默认 10000',
  'slowlog-max-len': '慢查询日志的最大条目数，超出则删除最旧条目，默认 128',
  'latency-monitor-threshold':
    '延迟监控的阈值（毫秒），超过此时间的操作会被采样，0 禁用监控，默认 0',
  'latency-tracking': '是否启用扩展延迟监控（跟踪每个命令的延迟分布），默认 yes',
  'latency-tracking-info-percentiles':
    '扩展延迟监控通过 INFO latencystats 输出的百分位数，默认 50、99、99.9',
  'notify-keyspace-events':
    '键空间事件通知配置，由字符组合表示启用的事件类型（如 K、E、g、$ 等），空字符串禁用通知，默认""',
  'hash-max-listpack-entries': '哈希对象使用紧凑编码的最大条目数，超出则转为哈希表，默认 512',
  'hash-max-listpack-value': '哈希对象使用紧凑编码的最大值大小（字节），超出则转为哈希表，默认 64',
  'list-max-listpack-size':
    '列表对象使用紧凑编码的节点大小限制，负值表示按字节（-1=4Kb、-2=8Kb 等），正值表示按元素数，默认 - 2',
  'list-compress-depth': '列表对象的压缩深度，0 禁用压缩，正值表示首尾不压缩的节点数，默认 0',
  'set-max-intset-entries': '集合对象使用整数集合编码的最大条目数，超出则转为哈希表，默认 512',
  'set-max-listpack-entries': '非整数集合使用紧凑编码的最大条目数，超出则转为哈希表，默认 128',
  'set-max-listpack-value': '非整数集合使用紧凑编码的最大值大小（字节），超出则转为哈希表，默认 64',
  'zset-max-listpack-entries': '有序集合使用紧凑编码的最大条目数，超出则转为跳表，默认 128',
  'zset-max-listpack-value': '有序集合使用紧凑编码的最大值大小（字节），超出则转为跳表，默认 64',
  'hll-sparse-max-bytes':
    'HyperLogLog 稀疏表示的最大字节数（含 16 字节头部），超出则转为密集表示，默认 3000，最大 16000',
  'stream-node-max-bytes': '流对象节点的最大字节数，0 表示无限制，默认 4096',
  'stream-node-max-entries': '流对象节点的最大条目数，0 表示无限制，默认 100',
  activerehashing: '是否启用主动重哈希，默认 yes，用于释放哈希表空闲内存，对延迟敏感场景可禁用',
  'client-output-buffer-limit normal':
    '普通客户端（含 MONITOR）的输出缓冲区限制，格式为 “硬限制 软限制 软限制持续时间”，默认 0 0 0（无限制）',
  'client-output-buffer-limit replica': '从节点客户端的输出缓冲区限制，默认 256mb 64mb 60',
  'client-output-buffer-limit pubsub': 'Pub/Sub 客户端的输出缓冲区限制，默认 32mb 8mb 60',
  'client-query-buffer-limit':
    '客户端查询缓冲区的最大大小，默认 1gb，用于限制协议不同步导致的内存占用',
  lookahead: '每个客户端流水线中预解码和预获取的命令数，默认 16',
  'maxmemory-clients':
    '所有客户端连接占用的最大内存限制，0 禁用客户端淘汰，支持绝对值（如 1g）或百分比（如 5%），默认 0',
  'proto-max-bulk-len': '协议中批量请求的最大大小，默认 512mb，最小 1mb',
  hz: 'Redis 后台任务的执行频率（赫兹），取值 1-500，默认 10，值越高响应性越好但 CPU 消耗越高，超过 100 不推荐',
  'dynamic-hz': '是否启用动态 Hz 调整，默认 yes，客户端连接多时自动提高 Hz，空闲时降低',
  'aof-rewrite-incremental-fsync':
    'AOF 重写时是否每生成 4MB 数据执行一次 fsync，默认 yes，用于减少延迟峰值',
  'rdb-save-incremental-fsync':
    'RDB 保存时是否每生成 4MB 数据执行一次 fsync，默认 yes，用于减少延迟峰值',
  'lfu-log-factor': 'LFU 淘汰算法的计数器对数因子，默认 10，影响计数器增长速度',
  'lfu-decay-time': 'LFU 计数器的衰减时间（分钟），默认 1，0 表示永不衰减',
  'max-new-connections-per-cycle': '每个事件循环周期可接受的最大新连接数（非 TLS），默认 10',
  'max-new-tls-connections-per-cycle': '每个事件循环周期可接受的最大新 TLS 连接数，默认 1',
  activedefrag: '是否启用主动内存碎片整理，默认 no，仅支持 Redis 内置的 Jemalloc 分配器',
  'active-defrag-ignore-bytes': '主动碎片整理的最小碎片浪费字节数，默认 100mb',
  'active-defrag-threshold-lower': '主动碎片整理的最低碎片率阈值（百分比），默认 10',
  'active-defrag-threshold-upper': '主动碎片整理的最高碎片率阈值（百分比），默认 100',
  'active-defrag-cycle-min': '碎片率达到下阈值时的 CPU 占用比例（百分比），默认 1',
  'active-defrag-cycle-max': '碎片率达到上阈值时的 CPU 占用比例（百分比），默认 25',
  'active-defrag-max-scan-fields':
    '每次主字典扫描处理的集合 / 哈希 / 有序集合 / 列表字段数，默认 1000',
  'jemalloc-bg-thread': '是否启用 Jemalloc 的后台清理线程，默认 yes',
  'server-cpulist': 'Redis 服务器 / IO 线程的 CPU 亲和性，格式同 taskset 命令',
  'bio-cpulist': '后台 I/O 线程的 CPU 亲和性，格式同 taskset 命令',
  'aof-rewrite-cpulist': 'AOF 重写子进程的 CPU 亲和性，格式同 taskset 命令',
  'bgsave-cpulist': 'BGSAVE 子进程的 CPU 亲和性，格式同 taskset 命令',
  'ignore-warnings': '需要抑制的 Redis 启动警告列表，空格分隔，如 ARM64-COW-BUG',
}
const zhClientTip = {
  id: '唯一的 64 位客户端 ID',
  addr: '客户端的地址/端口',
  laddr: '客户端连接到的本地地址/端口（绑定地址）',
  fd: '对应于套接字的文件描述符',
  name: '客户端使用 CLIENT SETNAME 设置的名称',
  age: '连接的总持续时间（秒）',
  idle: '连接的空闲时间（秒）',
  flags: '客户端标志（见下文）',
  db: '当前数据库 ID',
  sub: '频道订阅数',
  psub: '模式匹配订阅数',
  ssub: '分片频道订阅数。在 Redis 7.0.3 中添加',
  multi: 'MULTI/EXEC 上下文中的命令数',
  watch: '此客户端当前正在监视的键数。在 Redis 7.4 中添加',
  qbuf: '查询缓冲区长度（0 表示没有待处理的查询）',
  qbufFree: '查询缓冲区的可用空间（0 表示缓冲区已满）',
  argvMem: '下一个命令的不完整参数（已从查询缓冲区中提取）',
  multiMem: '缓冲的多命令使用的内存。在 Redis 7.0 中添加',
  obl: '输出缓冲区长度',
  oll: '输出列表长度（当缓冲区满时，回复在此列表中排队）',
  omem: '输出缓冲区内存使用情况',
  totMem: '此客户端在其各种缓冲区中消耗的总内存',
  events: '文件描述符事件（见下文）',
  cmd: '执行的最后一条命令',
  user: '客户端的已认证用户名',
  redir: '当前客户端跟踪重定向的客户端 id',
  resp: '客户端 RESP 协议版本。在 Redis 7.0 中添加',
  rbp: '客户端连接以来其读取缓冲区的峰值大小。在 Redis 7.0 中添加',
  rbs: '客户端读取缓冲区当前大小（字节）。在 Redis 7.0 中添加',
  libName: '正在使用的客户端库的名称',
  libVer: '客户端库的版本',
  ioThread: '分配给客户端的 I/O 线程 ID。在 Redis 8.0 中添加',
  totNetIn: '从该客户端读取的总网络输入字节数',
  totNetOut: '发送给该客户端的总网络输出字节数',
  totCmds: '该客户端执行的命令总数',
}

// https://redis.io/docs/latest/commands/info/
const enInfoTip = {
  monotonic_clock: 'Timer that only goes forward, never backward or jumps',

  server: 'General information about the Redis server',
  clients: 'Client connections section',
  memory: 'Memory consumption related information',
  persistence: 'RDB and AOF related information',
  threads: 'I/O threads information',
  stats: 'General statistics',
  replication: 'Master/replica replication information',
  cpu: 'CPU consumption statistics',
  commandstats: 'Redis command statistics',
  latencystats: 'Redis command latency percentile distribution statistics',
  sentinel: 'Redis Sentinel section (only applicable to Sentinel instances)',
  cluster: 'Redis Cluster section',
  modules: 'Modules section',
  keyspace: 'Database related statistics',
  errorstats: 'Redis error statistics',
  redis_version: 'Version of the Redis server',
  redis_git_sha1: 'Git SHA1',
  redis_git_dirty: 'Git dirty flag',
  redis_build_id: 'The build id',
  redis_mode: `The server's mode ("standalone", "sentinel" or "cluster")`,
  os: 'Operating system hosting the Redis server',
  arch_bits: 'Architecture (32 or 64 bits)',
  multiplexing_api: 'Event loop mechanism used by Redis',
  atomicvar_api: 'Atomicvar API used by Redis',
  gcc_version: 'Version of the GCC compiler used to compile the Redis server',
  process_id: 'PID of the server process',
  process_supervised: 'Supervised system ("upstart", "systemd", "unknown" or "no")',
  run_id: 'Random value identifying the Redis server (to be used by Sentinel and Cluster)',
  tcp_port: 'TCP/IP listen port',
  server_time_usec: 'Epoch-based system time with microsecond precision',
  uptime_in_seconds: 'Number of seconds since Redis server start',
  uptime_in_days: 'Same value expressed in days',
  hz: "The server's current frequency setting",
  configured_hz: "The server's configured frequency setting",
  lru_clock: 'Clock incrementing every minute, for LRU management',
  executable: "The path to the server's executable",
  config_file: 'The path to the config file',
  io_threads_active: 'Flag indicating if I/O threads are active',
  shutdown_in_milliseconds:
    'The maximum time remaining for replicas to catch up the replication before completing the shutdown sequence. This field is only present during shutdown',
  connected_clients: 'Number of client connections (excluding connections from replicas)',
  cluster_connections: "An approximation of the number of sockets used by the cluster's bus",
  maxclients:
    'The value of the maxclients configuration directive. This is the upper limit for the sum of connected_clients, connected_slaves and cluster_connections.',
  client_recent_max_input_buffer: 'Biggest input buffer among current client connections',
  client_recent_max_output_buffer: 'Biggest output buffer among current client connections',
  blocked_clients:
    'Number of clients pending on a blocking call (BLPOP, BRPOP, BRPOPLPUSH, BLMOVE, BZPOPMIN, BZPOPMAX)',
  tracking_clients: 'Number of clients being tracked (CLIENT TRACKING)',
  pubsub_clients:
    'Number of clients in pubsub mode (SUBSCRIBE, PSUBSCRIBE, SSUBSCRIBE). Added in Redis 7.4',
  watching_clients: 'Number of clients in watching mode (WATCH). Added in Redis 7.4',
  clients_in_timeout_table: 'Number of clients in the clients timeout table',
  total_watched_keys: 'Number of watched keys. Added in Redis 7.4.',
  total_blocking_keys: 'Number of blocking keys. Added in Redis 7.2.',
  total_blocking_keys_on_nokey:
    'Number of blocking keys that one or more clients that would like to be unblocked when the key is deleted. Added in Redis 7.2',
  used_memory:
    'Total number of bytes allocated by Redis using its allocator (either standard libc, jemalloc, or an alternative allocator such as tcmalloc)',
  used_memory_human: 'Human readable representation of previous value',
  used_memory_rss:
    'Number of bytes that Redis allocated as seen by the operating system (a.k.a resident set size). This is the number reported by tools such as top(1) and ps(1)',
  used_memory_rss_human: 'Human readable representation of previous value',
  used_memory_peak: 'Peak memory consumed by Redis (in bytes)',
  used_memory_peak_human: 'Human readable representation of previous value',
  used_memory_peak_time: 'Time when peak memory was recorded',
  used_memory_peak_perc: 'The percentage of used_memory out of used_memory_peak',
  used_memory_overhead:
    'The sum in bytes of all overheads that the server allocated for managing its internal data structures',
  used_memory_startup: 'Initial amount of memory consumed by Redis at startup in bytes',
  used_memory_dataset:
    'The size in bytes of the dataset (used_memory_overhead subtracted from used_memory)',
  used_memory_dataset_perc:
    'The percentage of used_memory_dataset out of the net memory usage (used_memory minus used_memory_startup)',
  total_system_memory: 'The total amount of memory that the Redis host has',
  total_system_memory_human: 'Human readable representation of previous value',
  used_memory_lua:
    'Number of bytes used by the Lua engine for EVAL scripts. Deprecated in Redis 7.0, renamed to used_memory_vm_eval',
  used_memory_vm_eval:
    'Number of bytes used by the script VM engines for EVAL framework (not part of used_memory). Added in Redis 7.0',
  used_memory_lua_human: 'Human readable representation of previous value. Deprecated in Redis 7.0',
  used_memory_scripts_eval:
    'Number of bytes overhead by the EVAL scripts (part of used_memory). Added in Redis 7.0',
  number_of_cached_scripts: 'The number of EVAL scripts cached by the server. Added in Redis 7.0',
  number_of_functions: 'The number of functions. Added in Redis 7.0',
  number_of_libraries: 'The number of libraries. Added in Redis 7.0',
  used_memory_vm_functions:
    'Number of bytes used by the script VM engines for Functions framework (not part of used_memory). Added in Redis 7.0',
  used_memory_vm_total:
    'used_memory_vm_eval + used_memory_vm_functions (not part of used_memory). Added in Redis 7.0',
  used_memory_vm_total_human: 'Human readable representation of previous value.',
  used_memory_functions:
    'Number of bytes overhead by Function scripts (part of used_memory). Added in Redis 7.0',
  used_memory_scripts:
    'used_memory_scripts_eval + used_memory_functions (part of used_memory). Added in Redis 7.0',
  used_memory_scripts_human: 'Human readable representation of previous value',
  maxmemory: 'The value of the maxmemory configuration directive',
  maxmemory_human: 'Human readable representation of previous value',
  maxmemory_policy: 'The value of the maxmemory-policy configuration directive',
  mem_fragmentation_ratio:
    "Ratio between used_memory_rss and used_memory. Note that this doesn't only includes fragmentation, but also other process overheads (see the allocator_* metrics), and also overheads like code, shared libraries, stack, etc.",
  mem_fragmentation_bytes:
    'Delta between used_memory_rss and used_memory. Note that when the total fragmentation bytes is low (few megabytes), a high ratio (e.g. 1.5 and above) is not an indication of an issue.',
  allocator_frag_ratio:
    ': Ratio between allocator_active and allocator_allocated. This is the true (external) fragmentation metric (not mem_fragmentation_ratio).',
  allocator_rss_ratio:
    'Ratio between allocator_resident and allocator_active. This usually indicates pages that the allocator can and probably will soon release back to the OS.',
  allocator_rss_bytes: 'Delta between allocator_resident and allocator_active',
  rss_overhead_ratio:
    'Ratio between used_memory_rss (the process RSS) and allocator_resident. This includes RSS overheads that are not allocator or heap related.',
  rss_overhead_bytes: 'Delta between used_memory_rss (the process RSS) and allocator_resident',
  allocator_allocated:
    'Total bytes allocated form the allocator, including internal-fragmentation. Normally the same as used_memory.',
  allocator_active:
    'Total bytes in the allocator active pages, this includes external-fragmentation.',
  allocator_resident:
    'Total bytes resident (RSS) in the allocator, this includes pages that can be released to the OS (by MEMORY PURGE, or just waiting).',
  allocator_muzzy:
    "Total bytes of 'muzzy' memory (RSS) in the allocator. Muzzy memory is memory that has been freed, but not yet fully returned to the operating system. It can be reused immediately when needed or reclaimed by the OS when system pressure increases.",
  mem_not_counted_for_evict:
    "Used memory that's not counted for key eviction. This is basically transient replica and AOF buffers.",
  mem_clients_slaves:
    "Memory used by replica clients - Starting Redis 7.0, replica buffers share memory with the replication backlog, so this field can show 0 when replicas don't trigger an increase of memory usage.",
  mem_clients_normal: 'Memory used by normal clients',
  mem_cluster_links:
    'Memory used by links to peers on the cluster bus when cluster mode is enabled.',
  mem_cluster_slot_migration_output_buffer:
    "Memory usage of the migration client's output buffer. Redis writes incoming changes to this buffer during the migration process.",
  mem_cluster_slot_migration_input_buffer:
    'Memory usage of the accumulated replication stream buffer on the importing node.',
  mem_cluster_slot_migration_input_buffer_peak:
    'Peak accumulated repl buffer size on the importing side.',
  mem_aof_buffer: 'Transient memory used for AOF and AOF rewrite buffers',
  mem_replication_backlog: 'Memory used by replication backlog',
  mem_total_replication_buffers:
    'Total memory consumed for replication buffers - Added in Redis 7.0.',
  mem_allocator: 'Memory allocator, chosen at compile time.',
  mem_overhead_db_hashtable_rehashing:
    'Temporary memory overhead of database dictionaries currently being rehashed - Added in 7.4.',
  active_defrag_running:
    'When activedefrag is enabled, this indicates whether defragmentation is currently active, and the CPU percentage it intends to utilize.',
  lazyfree_pending_objects:
    'The number of objects waiting to be freed (as a result of calling UNLINK, or FLUSHDB and FLUSHALL with the ASYNC option)',
  lazyfreed_objects: 'The number of objects that have been lazy freed',
  loading: 'Flag indicating if the load of a dump file is on-going',
  async_loading:
    'Currently loading replication data-set asynchronously while serving old data. This means repl-diskless-load is enabled and set to swapdb. Added in Redis 7.0.',
  current_cow_peak: 'The peak size in bytes of copy-on-write memory while a child fork is running',
  current_cow_size: 'The size in bytes of copy-on-write memory while a child fork is running',
  current_cow_size_age: 'The age, in seconds, of the current_cow_size value.',
  current_fork_perc:
    'The percentage of progress of the current fork process. For AOF and RDB forks it is the percentage of current_save_keys_processed out of current_save_keys_total.',
  current_save_keys_processed: 'Number of keys processed by the current save operation',
  current_save_keys_total: 'Number of keys at the beginning of the current save operation',
  rdb_changes_since_last_save: 'Number of changes since the last dump',
  rdb_bgsave_in_progress: 'Flag indicating a RDB save is on-going',
  rdb_last_save_time: 'Epoch-based timestamp of last successful RDB save',
  rdb_last_bgsave_status: 'Status of the last RDB save operation',
  rdb_last_bgsave_time_sec: 'Duration of the last RDB save operation in seconds',
  rdb_current_bgsave_time_sec: 'Duration of the on-going RDB save operation if any',
  rdb_last_cow_size: 'The size in bytes of copy-on-write memory during the last RDB save operation',
  rdb_last_load_keys_expired:
    'Number of volatile keys deleted during the last RDB loading. Added in Redis 7.0.',
  rdb_last_load_keys_loaded:
    'Number of keys loaded during the last RDB loading. Added in Redis 7.0.',
  aof_enabled: 'Flag indicating AOF logging is activated',
  aof_rewrite_in_progress: 'Flag indicating a AOF rewrite operation is on-going',
  aof_rewrite_scheduled:
    'Flag indicating an AOF rewrite operation will be scheduled once the on-going RDB save is complete.',
  aof_last_rewrite_time_sec: 'Duration of the last AOF rewrite operation in seconds',
  aof_current_rewrite_time_sec: 'Duration of the on-going AOF rewrite operation if any',
  aof_last_bgrewrite_status: 'Status of the last AOF rewrite operation',
  aof_last_write_status: 'Status of the last write operation to the AOF',
  aof_last_cow_size:
    'The size in bytes of copy-on-write memory during the last AOF rewrite operation',
  module_fork_in_progress: 'Flag indicating a module fork is on-going',
  module_fork_last_cow_size:
    'The size in bytes of copy-on-write memory during the last module fork operation',
  aof_rewrites: 'Number of AOF rewrites performed since startup',
  rdb_saves: 'Number of RDB snapshots performed since startup',
  aof_current_size: 'AOF current file size',
  aof_base_size: 'AOF file size on latest startup or rewrite',
  aof_pending_rewrite:
    'Flag indicating an AOF rewrite operation will be scheduled once the on-going RDB save is complete.',
  aof_buffer_length: 'Size of the AOF buffer',
  aof_rewrite_buffer_length:
    'Size of the AOF rewrite buffer. Note this field was removed in Redis 7.0',
  aof_pending_bio_fsync: 'Number of fsync pending jobs in background I/O queue',
  aof_delayed_fsync: 'Delayed fsync counter',
  loading_start_time: 'Epoch-based timestamp of the start of the load operation',
  loading_total_bytes: 'Total file size',
  loading_rdb_used_mem:
    "The memory usage of the server that had generated the RDB file at the time of the file's creation",
  loading_loaded_bytes: 'Number of bytes already loaded',
  loading_loaded_perc: 'Same value expressed as a percentage',
  loading_eta_seconds: 'ETA in seconds for the load to be complete',
  io_thread_XXX: 'clients=XXX,reads=XXX,writes=XXX',
  total_connections_received: 'Total number of connections accepted by the server',
  total_commands_processed: 'Total number of commands processed by the server',
  instantaneous_ops_per_sec: 'Number of commands processed per second',
  total_net_input_bytes: 'The total number of bytes read from the network',
  total_net_output_bytes: 'The total number of bytes written to the network',
  total_net_repl_input_bytes:
    'The total number of bytes read from the network for replication purposes',
  total_net_repl_output_bytes:
    'The total number of bytes written to the network for replication purposes',
  instantaneous_input_kbps: "The network's read rate per second in KB/sec",
  instantaneous_output_kbps: "The network's write rate per second in KB/sec",
  instantaneous_input_repl_kbps:
    "The network's read rate per second in KB/sec for replication purposes",
  instantaneous_output_repl_kbps:
    "The network's write rate per second in KB/sec for replication purposes",
  rejected_connections: 'Number of connections rejected because of maxclients limit',
  sync_full: 'The number of full resyncs with replicas',
  sync_partial_ok: 'The number of accepted partial resync requests',
  sync_partial_err: 'The number of denied partial resync requests',
  expired_subkeys: 'The number of hash field expiration events',
  expired_keys: 'Total number of key expiration events',
  expired_stale_perc: 'The percentage of keys probably expired',
  expired_time_cap_reached_count: 'The count of times that active expiry cycles have stopped early',
  expire_cycle_cpu_milliseconds: 'The cumulative amount of time spent on active expiry cycles',
  evicted_keys: 'Number of evicted keys due to maxmemory limit',
  evicted_clients: 'Number of evicted clients due to maxmemory-clients limit. Added in Redis 7.0.',
  evicted_scripts:
    'Number of evicted EVAL scripts due to LRU policy, see EVAL for more details. Added in Redis 7.4.',
  total_eviction_exceeded_time:
    'Total time used_memory was greater than maxmemory since server startup, in milliseconds',
  current_eviction_exceeded_time:
    'The time passed since used_memory last rose above maxmemory, in milliseconds',
  keyspace_hits: 'Number of successful lookup of keys in the main dictionary',
  keyspace_misses: 'Number of failed lookup of keys in the main dictionary',
  pubsub_channels: 'Global number of pub/sub channels with client subscriptions',
  pubsub_patterns: 'Global number of pub/sub pattern with client subscriptions',
  pubsubshard_channels:
    'Global number of pub/sub shard channels with client subscriptions. Added in Redis 7.0.3',
  latest_fork_usec: 'Duration of the latest fork operation in microseconds',
  total_forks: 'Total number of fork operations since the server start',
  migrate_cached_sockets: 'The number of sockets open for MIGRATE purposes',
  slave_expires_tracked_keys:
    'The number of keys tracked for expiry purposes (applicable only to writable replicas)',
  active_defrag_hits:
    'Number of value reallocations performed by active the defragmentation process',
  active_defrag_misses:
    'Number of aborted value reallocations started by the active defragmentation process',
  active_defrag_key_hits: 'Number of keys that were actively defragmented',
  active_defrag_key_misses:
    'Number of keys that were skipped by the active defragmentation process',
  total_active_defrag_time: 'Total time memory fragmentation was over the limit, in milliseconds',
  current_active_defrag_time:
    'The time passed since memory fragmentation last was over the limit, in milliseconds',
  tracking_total_keys: 'Number of keys being tracked by the server',
  tracking_total_items:
    'Number of items, that is the sum of clients number for each key, that are being tracked',
  tracking_total_prefixes:
    "Number of tracked prefixes in server's prefix table (only applicable for broadcast mode)",
  unexpected_error_replies:
    'Number of unexpected error replies, that are types of errors from an AOF load or replication',
  total_error_replies:
    'Total number of issued error replies, that is the sum of rejected commands (errors prior command execution) and failed commands (errors within the command execution)',
  dump_payload_sanitizations:
    'Total number of dump payload deep integrity validations (see sanitize-dump-payload config).',
  total_reads_processed: 'Total number of read events processed',
  total_writes_processed: 'Total number of write events processed',
  io_threaded_reads_processed: 'Number of read events processed by I/O threads',
  io_threaded_writes_processed: 'Number of write events processed by I/O threads',
  client_query_buffer_limit_disconnections:
    'Total number of disconnections due to client reaching query buffer limit',
  client_output_buffer_limit_disconnections:
    'Total number of disconnections due to client reaching output buffer limit',
  reply_buffer_shrinks: 'Total number of output buffer shrinks',
  reply_buffer_expands: 'Total number of output buffer expands',
  eventloop_cycles: 'Total number of eventloop cycles',
  eventloop_duration_sum:
    'Total time spent in the eventloop in microseconds (including I/O and command processing)',
  eventloop_duration_cmd_sum: 'Total time spent on executing commands in microseconds',
  instantaneous_eventloop_cycles_per_sec: 'Number of eventloop cycles per second',
  instantaneous_eventloop_duration_usec:
    'Average time spent in a single eventloop cycle in microseconds',
  acl_access_denied_auth: 'Number of authentication failures',
  acl_access_denied_cmd: 'Number of commands rejected because of access denied to the command',
  acl_access_denied_key: 'Number of commands rejected because of access denied to a key',
  acl_access_denied_channel: 'Number of commands rejected because of access denied to a channel',
  role: 'Value is "master" if the instance is replica of no one, or "slave" if the instance is a replica of some master instance. Note that a replica can be master of another replica (chained replication).',
  master_failover_state: 'The state of an ongoing failover, if any.',
  master_replid: 'The replication ID of the Redis server.',
  master_replid2: 'The secondary replication ID, used for PSYNC after a failover.',
  master_repl_offset: "The server's current replication offset",
  second_repl_offset: 'The offset up to which replication IDs are accepted',
  repl_backlog_active: 'Flag indicating replication backlog is active',
  repl_backlog_size: 'Total size in bytes of the replication backlog buffer',
  repl_backlog_first_byte_offset: 'The master offset of the replication backlog buffer',
  repl_backlog_histlen: 'Size in bytes of the data in the replication backlog buffer',
  master_host: 'Host or IP address of the master',
  master_port: 'Master listening TCP port',
  master_link_status: 'Status of the link (up/down)',
  master_last_io_seconds_ago: 'Number of seconds since the last interaction with master',
  master_sync_in_progress: 'Indicate the master is syncing to the replica',
  slave_read_repl_offset: 'The read replication offset of the replica instance.',
  slave_repl_offset: 'The replication offset of the replica instance',
  slave_priority: 'The priority of the instance as a candidate for failover',
  slave_read_only: 'Flag indicating if the replica is read-only',
  replica_announced: 'Flag indicating if the replica is announced by Sentinel',
  master_sync_total_bytes:
    'Total number of bytes that need to be transferred. this may be 0 when the size is unknown (for example, when the repl-diskless-sync configuration directive is used)',
  master_sync_read_bytes: 'Number of bytes already transferred',
  master_sync_left_bytes:
    'Number of bytes left before syncing is complete (may be negative when master_sync_total_bytes is 0)',
  master_sync_perc:
    'The percentage master_sync_read_bytes from master_sync_total_bytes, or an approximation that uses loading_rdb_used_mem when master_sync_total_bytes is 0',
  master_sync_last_io_seconds_ago:
    'Number of seconds since last transfer I/O during a SYNC operation',
  master_link_down_since_seconds: 'Number of seconds since the link is down',
  connected_slaves: 'Number of connected replicas',
  min_slaves_good_slaves: 'Number of replicas currently considered good',
  slaveXXX: 'id, IP address, port, state, offset, lag',
  used_cpu_sys:
    'System CPU consumed by the Redis server, which is the sum of system CPU consumed by all threads of the server process (main thread and background threads)',
  used_cpu_user:
    'User CPU consumed by the Redis server, which is the sum of user CPU consumed by all threads of the server process (main thread and background threads)',
  used_cpu_sys_children: 'System CPU consumed by the background processes',
  used_cpu_user_children: 'User CPU consumed by the background processes',
  used_cpu_sys_main_thread: 'System CPU consumed by the Redis server main thread',
  used_cpu_user_main_thread: 'User CPU consumed by the Redis server main thread',
  cmdstat_XXX: 'calls=XXX,usec=XXX,usec_per_call=XXX,rejected_calls=XXX,failed_calls=XXX',
  latency_percentiles_usec_XXX:
    'p<percentile 1>=<percentile 1 value>,p<percentile 2>=<percentile 2 value>,...',
  errorstat_XXX: 'count=XXX',
  sentinel_masters: 'Number of Redis masters monitored by this Sentinel instance',
  sentinel_tilt: 'A value of 1 means this sentinel is in TILT mode',
  sentinel_tilt_since_seconds:
    'Duration in seconds of current TILT, or -1 if not TILTed. Added in Redis 7.0.0',
  sentinel_total_tilt: 'The number of times this sentinel has been in TILT mode since running.',
  sentinel_running_scripts: 'The number of scripts this Sentinel is currently executing',
  sentinel_scripts_queue_length:
    'The length of the queue of user scripts that are pending execution',
  sentinel_simulate_failure_flags: 'Flags for the SENTINEL SIMULATE-FAILURE command',
  cluster_enabled: 'Indicates whether Redis cluster is enabled.',
  search_gc_bytes_collected:
    "The total amount of memory freed by the garbage collectors from indexes in the shard's memory in bytes. 3",
  search_bytes_collected:
    'The total amount of memory freed by the garbage collectors from indexes in the shard memory in bytes',
  search_gc_marked_deleted_vectors:
    'The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. 3',
  search_marked_deleted_vectors:
    'The number of vectors marked as deleted in the vector indexes that have not yet been cleaned',
  search_gc_total_cycles: 'The total number of garbage collection cycles executed. 3',
  search_total_cycles: 'The total number of garbage collection cycles executed',
  search_gc_total_docs_not_collected_by_gc:
    'The number of documents marked as deleted, whose memory has not yet been freed by the garbage collector. 3',
  search_total_docs_not_collected_by_gc:
    'The number of documents marked as deleted whose memory has not yet been freed by the garbage collector',
  search_gc_total_ms_run:
    'The total duration of all garbage collection cycles in the shard, measured in milliseconds. 3',
  search_total_ms_run:
    'The total duration of all garbage collection cycles in the shard, measured in milliseconds',
  search_cursors_internal_idle:
    'The total number of coordinator cursors that are currently holding pending results in the shard. 3',
  search_cursors_user_idle:
    'The total number of cursors that were explicitly requested by users, that are currently holding pending results in the shard. 3',
  search_global_idle:
    'The total number of user and internal cursors currently holding pending results in the shard. Deprecated in 8.0 (split into search_cursors_internal_idle and search_cursors_user_idle) but still available in older versions',
  search_cursors_internal_active:
    'The total number of coordinator cursors in the shard, either holding pending results or actively executing FT.CURSOR READ. 3',
  search_cursors_user_active:
    'The total number of user cursors in the shard, either holding pending results or actively executing FT.CURSOR READ. 3',
  search_global_total:
    'The total number of user and internal cursors in the shard, either holding pending results or actively executing FT.CURSOR READ. Deprecated in 8.0 (split into search_cursors_internal_active and search_cursors_user_active), but still available in older versions',
  search_number_of_indexes: 'The total number of indexes in the shard',
  search_number_of_active_indexes:
    'The total number of indexes running a background indexing and/or background query processing operation. Background indexing refers to vector ingestion process, or in-progress background indexer',
  search_number_of_active_indexes_running_queries:
    'The total count of indexes currently running a background query process',
  search_number_of_active_indexes_indexing:
    'The total count of indexes currently undergoing a background indexing process. Background indexing refers to a vector ingestion process, or an in-progress background indexer. This metric is limited by the number of WORKER threads allocated for writing operations plus the number of indexes',
  search_total_active_write_threads:
    'The total count of background write (indexing) processes currently running in the shard. Background indexing refers to a vector ingestion process, or an in-progress background indexer. This metric is limited by the number of threads allocated for writing operations',
  search_fields_text_Text: 'The total number of TEXT fields across all indexes in the shard',
  search_fields_text_Sortable:
    'The total number of SORTABLE TEXT fields across all indexes in the shard. This field appears only if its value is larger than 0',
  search_fields_text_NoIndex:
    'The total number of NOINDEX TEXT fields across all indexes in the shard, which are used for sorting only but not indexed. This field appears only if its value is larger than 0',
  search_fields_numeric_Numeric:
    'The total number of NUMERIC fields across all indexes in the shard',
  search_fields_numeric_Sortable:
    'The total number of SORTABLE NUMERIC fields across all indexes in the shard. This field appears only if its value is larger than 0',
  search_fields_numeric_NoIndex:
    'The total number of NOINDEX NUMERIC fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0',
  search_fields_tag_Tag: 'The total number of TAG fields across all indexes in the shard',
  search_fields_tag_Sortable:
    'The total number of SORTABLE TAG fields across all indexes in the shard. This field appears only if its value is larger than 0',
  search_fields_tag_NoIndex:
    'The total number of NOINDEX TAG fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0',
  search_fields_tag_CaseSensitive:
    'The total number of CASESENSITIVE TAG fields across all indexes in the shard. This field appears only if its value is larger than 0',
  search_fields_geo_Geo: 'The total number of GEO fields across all indexes in the shard',
  search_fields_geo_Sortable:
    'The total number of SORTABLE GEO fields across all indexes in the shard. This field appears only if its value is larger than 0',
  search_fields_geo_NoIndex:
    'The total number of NOINDEX GEO fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0',
  search_fields_vector_Vector: 'The total number of VECTOR fields across all indexes in the shard',
  search_fields_vector_Flat:
    'The total number of FLAT VECTOR fields across all indexes in the shard',
  search_fields_vector_HNSW:
    'The total number of HNSW VECTOR fields across all indexes in the shard',
  search_fields_geoshape_Geoshape:
    'The total number of GEOSHAPE fields across all indexes in the shard. 2',
  search_fields_geoshape_Sortable:
    'The total number of SORTABLE GEOSHAPE fields across all indexes in the shard. This field appears only if its value is larger than 0. 2',
  search_fields_geoshape_NoIndex:
    'The total number of NOINDEX GEOSHAPE fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. 2',
  'search_fields_<field>_IndexErrors':
    'The total number of indexing failures caused by attempts to index a document containing field',
  search_used_memory_vector_index: 'The total memory usage of all vector indexes in the shard',
  search_used_memory_indexes:
    'The estimated total memory allocated by all indexes in the shard in bytes (including vector indexes memory accounted in search_used_memory_vector_index)',
  search_used_memory_indexes_human:
    'The estimated total memory allocated by all indexes in the shard in MB',
  search_smallest_memory_index:
    'The estimated memory usage of the index with the smallest memory usage in the shard in bytes',
  search_smallest_memory_index_human:
    'The estimated memory usage of the index with the smallest memory usage in the shard in MB',
  search_largest_memory_index:
    'The estimated memory usage of the index with the largest memory usage in the shard in bytes',
  search_largest_memory_index_human:
    'The estimated memory usage of the index with the largest memory usage in the shard in MB',
  search_total_indexing_time:
    'The total time spent on indexing operations, excluding the background indexing of vectors in the HNSW graph',
  search_total_queries_processed:
    'The total number of successful query executions (When using cursors, not counting reading from existing cursors) in the shard',
  search_total_query_commands:
    'The total number of successful query command executions (including FT.SEARCH, FT.AGGREGATE, and FT.CURSOR READ)',
  search_total_query_execution_time_ms:
    'The cumulative execution time of all query commands, including FT.SEARCH, FT.AGGREGATE, and FT.CURSOR READ, measured in ms',
  search_total_active_queries:
    'The total number of background queries currently being executed in the shard, excluding FT.CURSOR READ',
  search_errors_indexing_failures:
    'The total number of indexing failures recorded across all indexes in the shard',
  search_errors_for_index_with_max_failures:
    'The number of indexing failures in the index with the highest count of failures',
  search_OOM_indexing_failures_indexes_count:
    'The number of indexes whose background indexing process failed due to out-of-memory (OOM) conditions',
  dbXXX: 'keys=XXX,expires=XXX,avg_ttl=XXX,subexpiry=XXX',
  eventloop_duration_aof_sum: 'Total time spent on flushing AOF in eventloop in microseconds.',
  eventloop_duration_cron_sum:
    'Total time consumption of cron in microseconds (including serverCron and beforeSleep, but excluding IO and AOF flushing).',
  eventloop_duration_max: 'The maximal time spent in a single eventloop cycle in microseconds.',
  eventloop_cmd_per_cycle_max:
    'The maximal number of commands processed in a single eventloop cycle.',
  allocator_allocated_lua:
    'Total bytes allocated from the allocator specifically for Lua, including internal-fragmentation.',
  allocator_active_lua:
    'Total bytes in the allocator active pages specifically for Lua, including external-fragmentation.',
  allocator_resident_lua:
    'Total bytes resident (RSS) in the allocator specifically for Lua. This includes pages that can be released to the OS (by MEMORY PURGE, or just waiting).',
  allocator_frag_bytes_lua: 'Delta between allocator_active_lua and allocator_allocated_lua',
}
const enConfigTip = {
  include:
    'Include one or more other configuration files, support wildcards, included files are loaded in alphabetical order, no error is reported when no files match the wildcard',
  loadmodule:
    'Load modules at startup, multiple modules can be specified, the server will abort if module loading fails, and parameters can be passed to modules',
  bind: "Specify the network interface IP addresses that Redis listens to, the prefix '-' indicates that the server will not fail to start if the address is unavailable, and the default listens to the loopback addresses 127.0.0.1 and ::1",
  'bind-source-addr':
    'Configure the local address bound to outgoing connections, affecting the connection routing method',
  'protected-mode':
    'Security protection mode. When enabled and the default user has no password, only local connections (127.0.0.1, ::1 or Unix domain sockets) are allowed, enabled by default',
  'enable-protected-configs':
    'Control the modifiable permissions of sensitive configuration directives, optional values: no (default, disable modification for all connections), yes (allow modification for all connections), local (allow modification only for local connections)',
  'enable-debug-command':
    'Control the enablement permissions of debug commands, optional values same as enable-protected-configs, default no',
  'enable-module-command':
    'Control the enablement permissions of module commands, optional values same as enable-protected-configs, default no',
  port: 'The TCP port to listen on, default 6379, setting to 0 means not listening on a TCP socket',
  'tcp-backlog':
    'The length of the TCP listen queue, the actual value is limited by the system /proc/sys/net/core/somaxconn, default 511',
  unixsocket:
    'The path of the Unix domain socket, if not specified, Redis will not listen on a Unix domain socket',
  unixsocketperm: 'The permissions of the Unix domain socket, default 700',
  timeout:
    'Client idle timeout (seconds), 0 means disabling timeout to close connections, default 0',
  'tcp-keepalive':
    'TCP keepalive time (seconds), a non-zero value enables the SO_KEEPALIVE option, used to detect dead connections and maintain network connections, default 300',
  'socket-mark-id':
    'Mark the listening socket with an ID to support advanced routing and filtering. On Linux, it corresponds to a connection mark; on FreeBSD, it corresponds to a socket cookie ID; on OpenBSD, it corresponds to a route table ID, default 0',
  'tls-port':
    'TLS listening port, TLS needs to be configured with this parameter to enable, TLS is disabled by default',
  'tls-cert-file':
    'Path to the server-side X.509 certificate file (PEM format), used to authenticate to clients, master nodes or cluster nodes',
  'tls-key-file': 'Path to the server-side private key file (PEM format)',
  'tls-key-file-pass': 'Password for the encrypted private key file',
  'tls-client-cert-file':
    'Path to the client-side (used for replication, cluster connections, etc.) X.509 certificate file (PEM format)',
  'tls-client-key-file': 'Path to the client-side private key file (PEM format)',
  'tls-client-key-file-pass': 'Password for the client-side encrypted private key file',
  'tls-dh-params-file':
    'Path to the DH parameters file, used to support Diffie-Hellman key exchange for older versions of OpenSSL (<3.0), not recommended for new versions',
  'tls-ca-cert-file':
    'Path to the CA certificate file, used to authenticate TLS clients and nodes, Redis does not use the system CA configuration by default',
  'tls-ca-cert-dir': 'Path to the CA certificate directory, same function as tls-ca-cert-file',
  'tls-auth-clients':
    'Control the requirement for TLS client certificate authentication, optional values: no (do not require or accept client certificates), optional (optional, valid if provided), client certificates are required by default',
  'tls-replication': 'Whether to enable TLS for replication links, default no',
  'tls-cluster': 'Whether to enable TLS for the cluster bus, default no',
  'tls-protocols':
    'Supported TLS versions, optional TLSv1, TLSv1.1, TLSv1.2, TLSv1.3 (OpenSSL ≥ 1.1.1), TLSv1.2 and TLSv1.3 are enabled by default',
  'tls-ciphers':
    'Cipher suites supported for TLSv1.2 and below, syntax refers to the ciphers(1ssl) manual, default DEFAULT:!MEDIUM',
  'tls-ciphersuites':
    'Cipher suites supported for TLSv1.3, syntax refers to the ciphers(1ssl) manual',
  'tls-prefer-server-ciphers':
    'Whether to prefer the server-side cipher suite preference, default no (follow client preference)',
  'tls-session-caching':
    'Whether to enable TLS session caching, default yes, used to speed up client reconnections',
  'tls-session-cache-size':
    'Maximum number of TLS sessions cached, 0 means unlimited, default 20480',
  'tls-session-cache-timeout': 'Timeout of cached TLS sessions (seconds), default 300',
  daemonize:
    'Whether to run in daemon mode, default no, a pid file will be generated in daemon mode',
  supervised:
    'Specify the supervision system interaction method, optional no (default, no interaction), upstart, systemd, auto (automatic detection)',
  pidfile:
    'Path to the pid file, no pid file is generated if not specified in non-daemon mode, default /var/run/redis.pid in daemon mode, /run/redis.pid is recommended for modern Linux systems',
  loglevel:
    'Log verbosity level, optional debug, verbose, notice (default, recommended for production environments), warning, nothing',
  logfile:
    'Path to the log file, an empty string means output to standard output, log output to standard output will be directed to /dev/null in daemon mode',
  'syslog-enabled': 'Whether to enable system logging, default no',
  'syslog-ident': 'System log identity, default redis',
  'syslog-facility': 'System log facility, must be USER or LOCAL0-LOCAL7, default local0',
  'crash-log-enabled':
    'Whether to enable crash logging, enabled by default, disabling can generate cleaner core dumps',
  'crash-memcheck-enabled':
    'Whether to enable the fast memory check of crash logs, enabled by default, disabling can make Redis terminate faster',
  databases:
    'Number of databases, 16 by default (numbered 0-15), can be switched using the SELECT command',
  'always-show-logo':
    'Whether to always display the ASCII art logo in startup logs, default no, only displayed by default in interactive sessions',
  'hide-user-data-from-log':
    'Whether to prohibit logging personally identifiable information (PII), disabled by default',
  'set-proc-title':
    'Whether to modify the process title to display runtime information, default yes',
  'proc-title-template':
    'Process title template, supporting variables {title}, {listen-addr}, {server-mode}, {port}, {tls-port}, {unixsocket}, {config-file}, default "{title} {listen-addr} {server-mode}"',
  'locale-collate':
    'Local environment used for string comparison operations, an empty string means obtained from environment variables, affecting Lua script performance',
  save: 'RDB persistence trigger conditions, format "<seconds> <changes>", multiple conditions can be configured, default 3600 seconds with 1 change, 300 seconds with 100 changes, 60 seconds with 10000 changes, set to "" to disable RDB persistence',
  'stop-writes-on-bgsave-error':
    'Whether to stop accepting writes if background saving fails when RDB snapshots are enabled, default yes, ensuring normal data persistence',
  rdbcompression:
    'Whether to compress string objects in RDB files using LZF, default yes, disabling can save CPU but increase file size',
  rdbchecksum:
    'Whether to add a CRC64 checksum at the end of the RDB file, default yes, disabling can improve read and write performance but reduce file integrity check capability',
  'sanitize-dump-payload':
    'Whether to perform full verification when loading RDB or RESTORE data, optional no (default), yes, clients, used to reduce the risk of assertions or crashes during subsequent command execution',
  dbfilename: 'Name of the RDB file, default dump.rdb',
  'rdb-del-sync-files':
    'Whether to delete RDB files generated during replication when no persistence is enabled, default no, only effective when both AOF and RDB are disabled',
  dir: 'Working directory, RDB files and AOF files are stored in this directory, default ./',
  replicaof:
    'Configure the current instance as a replica node, specifying the IP and port of the master node',
  masterauth: 'Password of the master node, required when the master node has a password enabled',
  masteruser:
    'Username of the master node used for replication, used when Redis 6 and above support ACL, for executing commands required for replication such as PSYNC',
  'replica-serve-stale-data':
    'Whether to return stale data when the replica node is disconnected from the master node or during replication, default yes, setting to no will reject data access commands except for some commands',
  'replica-read-only':
    'Whether the replica node is read-only, default yes, read-only by default since Redis 2.6',
  'repl-diskless-sync':
    'Synchronization strategy used for full replication, yes means diskless synchronization (transfer RDB directly through the socket), no means disk-based synchronization, default yes',
  'repl-diskless-sync-delay':
    'Delay time (seconds) for waiting for more replica nodes to connect during diskless synchronization, default 5, setting to 0 starts transmission immediately',
  'repl-diskless-sync-max-replicas':
    'Start synchronization in advance when the specified number of replica nodes connect during the diskless synchronization delay period, default 0 means no limit',
  'repl-diskless-load':
    'The way the replica node loads RDB data from the master node, optional disabled (default, store to disk first then load), swapdb (load in parallel in memory, requiring sufficient memory), on-empty-db (diskless load only when the database is empty)',
  'repl-ping-replica-period':
    'Interval time (seconds) for the master node to send PING to the replica node, default 10',
  'repl-timeout':
    'Replication timeout time (seconds), covering scenarios such as SYNC bulk transfer, master-replica node communication, default 60, which needs to be greater than repl-ping-replica-period',
  'repl-disable-tcp-nodelay':
    'Whether to disable the TCP_NODELAY option of the replica node socket after full synchronization, default no (prioritizing low latency), yes can reduce bandwidth usage but increase data latency',
  'repl-backlog-size':
    'Size of the replication backlog buffer, used for partial synchronization after the replica node reconnects, default 1mb, only allocated when there are replica nodes connected',
  'repl-backlog-ttl':
    'Release time (seconds) of the replication backlog buffer after the last replica node disconnects, default 3600, 0 means never release',
  'replica-full-sync-buffer-limit':
    "Maximum size of replication data stream that the replica node can accumulate during full synchronization, 0 means inheriting the hard limit of the master node's client-output-buffer-limit replica, default 0",
  'replica-priority':
    'Replica node priority, used by Redis Sentinel to select a master node during failover, the smaller the value, the higher the priority, 0 means cannot be promoted to master node, default 100',
  'propagation-error-behavior':
    'Behavior for handling command execution errors in the replication stream or AOF file, optional ignore (default), panic, panic-on-replicas',
  'replica-ignore-disk-write-errors':
    'Whether the replica node ignores errors when writing to disk fails, default no (crash), yes only logs a warning and executes the command',
  'replica-announced':
    "Whether the replica node is included in Redis Sentinel's reports, default yes, setting to no will not be displayed by the sentinel replicas command, but can still be promoted to master node (need to set replica-priority 0 to disable promotion)",
  'min-replicas-to-write':
    'Minimum number of online replica nodes required for the master node to accept writes, default 0 (disabled), need to be used with min-replicas-max-lag',
  'min-replicas-max-lag':
    'Maximum latency time (seconds) of replica nodes when the master node accepts writes, default 10',
  'replica-announce-ip':
    'IP address reported by the replica node to the master node, used in NAT or port forwarding scenarios',
  'replica-announce-port':
    'Port reported by the replica node to the master node, used in NAT or port forwarding scenarios',
  'tracking-table-max-keys':
    'Maximum number of keys in the invalidation table for client-side cache key tracking, default 1000000, 0 means no limit, this configuration is invalid in broadcast mode',
  'acllog-max-len':
    'Maximum number of entries in the ACL log, used to record failed commands and authentication events related to ACL, default 128',
  aclfile:
    'Path to the external ACL user configuration file, cannot be used simultaneously with user configuration in the current configuration file',
  requirepass:
    'Password of the default user, a compatibility layer of the ACL system in Redis 6 and above, incompatible with the aclfile and ACL LOAD commands',
  'acl-pubsub-default':
    'Default Pub/Sub channel permissions for new users, optional allchannels (allow all channels), resetchannels (forbid all channels), resetchannels is default in Redis 7.0',
  'rename-command':
    'Rename or disable commands (deprecated), it is recommended to use ACL to control command permissions, format "rename-command original-command new-command", setting the new command to an empty string disables the command',
  maxclients:
    'Maximum number of simultaneous connected clients, default 10000, actually limited by the system file descriptor limit, cluster bus connection resources need to be reserved in Redis Cluster mode',
  maxmemory:
    'Maximum memory limit used by Redis, when the limit is reached, key eviction is performed according to maxmemory-policy, no limit by default',
  'maxmemory-policy':
    'Key eviction policy when memory reaches maxmemory, optional volatile-lru, allkeys-lru, volatile-lfu, allkeys-lfu, volatile-random, allkeys-random, volatile-ttl, noeviction (default)',
  'maxmemory-samples':
    'Sampling number of LRU/LFU/TTL eviction algorithms, default 5, the larger the value, the closer to the real result but the higher the CPU consumption, maximum 64',
  'maxmemory-eviction-tenacity':
    'Aggressiveness of key eviction processing, 0 for minimum latency, 10 for default, 100 for prioritizing eviction regardless of latency, default 10',
  'replica-ignore-maxmemory':
    'Whether the replica node ignores its own maxmemory configuration, default yes (eviction is handled by the master node), modify only when the replica node is writable or needs an independent memory limit',
  'active-expire-effort':
    'Intensity of active expired key cleaning, default 1, value range 1-10, the larger the value, the more thorough the cleaning but the higher the CPU consumption',
  'lazyfree-lazy-eviction':
    'Whether to use lazy deletion (non-blocking) during memory eviction, default no',
  'lazyfree-lazy-expire': 'Whether to use lazy deletion when keys expire, default no',
  'lazyfree-lazy-server-del':
    'Whether to use lazy deletion when the server internally deletes keys (such as RENAME overwriting), default no',
  'replica-lazy-flush':
    'Whether the replica node lazily clears the database during full synchronization, default no',
  'lazyfree-lazy-user-del':
    'Whether the user uses lazy deletion when executing the DEL command, default no',
  'lazyfree-lazy-user-flush':
    'Whether to delete asynchronously by default when the user executes FLUSHDB/FLUSHALL/SCRIPT FLUSH/FUNCTION FLUSH without specifying the sync/async flag, default no',
  'io-threads':
    'Number of I/O threads, used to handle reading/writing of client sockets and protocol parsing, disabled by default (1 means only the main thread), it is recommended to enable on servers with 4 or more cores, leaving 1 idle core',
  'oom-score-adj':
    'Whether to control the process priority of the kernel OOM killer, optional no (default), yes (equivalent to relative), absolute, relative, used to prioritize evicting background child processes and replica nodes',
  'oom-score-adj-values':
    'OOM priority adjustment values, in order of master node, replica node, background child process, value range -2000 to 2000, default 0 200 800',
  'disable-thp':
    'Whether to disable Transparent Huge Pages (THP) for the Redis process, default yes, avoiding latency issues caused by fork and Copy-on-Write (CoW)',
  appendonly:
    'Whether to enable AOF persistence, default no, AOF and RDB can be enabled simultaneously, AOF is loaded first at startup',
  appendfilename:
    'Base name of the AOF file, Redis 7 and above use a multi-file format (base file, incremental file, manifest file), default "appendonly.aof"',
  appenddirname: 'Storage directory of AOF files, default "appendonlydir"',
  appendfsync:
    'fsync policy of AOF files, optional always (sync after every write, safest), everysec (sync every second, default), no (controlled by the system, fastest)',
  'no-appendfsync-on-rewrite':
    "Whether to suspend AOF's fsync when BGSAVE or BGREWRITEAOF is executed, default no (prioritizing data security), yes can alleviate I/O blocking but reduce durability",
  'auto-aof-rewrite-percentage':
    'Trigger percentage of automatic AOF rewrite, based on the file size after the last rewrite, default 100 (grows by 100%), 0 disables automatic rewrite',
  'auto-aof-rewrite-min-size': 'Minimum file size for automatic AOF rewrite, default 64mb',
  'aof-load-truncated':
    'Whether to continue loading when a truncated AOF file is found at startup, default yes (load available parts and log a prompt), no will directly report an error',
  'aof-load-corrupt-tail-max-size':
    'Maximum number of corrupted bytes at the end of the AOF file that Redis can automatically recover at startup, default 0 (disable automatic recovery), manual processing is required if exceeded',
  'aof-use-rdb-preamble':
    'Whether the AOF base file uses the RDB format, default yes, RDB format is faster and more efficient',
  'aof-timestamp-enabled':
    'Whether to record timestamp annotations in AOF to support point-in-time recovery, default no, enabling may be incompatible with some AOF parsers',
  'shutdown-timeout':
    'Maximum time (seconds) to wait for replica nodes to synchronize when shutting down, only effective for instances with replica nodes, default 0 (disabled)',
  'shutdown-on-sigint':
    'Shutdown behavior when receiving the SIGINT signal, optional default, save, nosave, now, force, can be combined (save and nosave cannot be used simultaneously)',
  'shutdown-on-sigterm':
    'Shutdown behavior when receiving the SIGTERM signal, optional values same as shutdown-on-sigint, default default',
  'lua-time-limit':
    'Maximum execution time (milliseconds) of EVAL scripts, functions and some module commands, default 5000, 0 or negative value means no limit, Redis only allows some commands to be executed after timeout',
  'busy-reply-threshold':
    'Same function as lua-time-limit, an alias for compatible with old configurations, default 5000',
  'cluster-enabled':
    'Whether to enable Redis Cluster mode, default no, instances can join the cluster only after enabling',
  'cluster-config-file':
    'Path to the cluster configuration file, automatically created and updated by Redis, cannot be edited manually, default nodes-6379.conf',
  'cluster-node-timeout':
    'Cluster node timeout time (milliseconds), a node is marked as faulty if unreachable for more than this time, default 15000',
  'cluster-port':
    'Cluster bus listening port, default 0 (command port + 10000), need to specify the cluster bus port in the cluster meet command after manual configuration',
  'cluster-replica-validity-factor':
    'Validity factor for replica node failover, used to determine if the replica node data is too old, default 10, 0 means ignoring data age',
  'cluster-migration-barrier':
    'Migration barrier for replica nodes to migrate to master nodes without replica nodes, default 1 (migrate only if the original master node retains at least 1 replica node), 0 is only for debugging, large values disable migration',
  'cluster-allow-replica-migration':
    'Whether to allow automatic migration of replica nodes, default yes, disabling makes cluster-migration-barrier invalid',
  'cluster-require-full-coverage':
    'Whether the cluster needs all hash slots to be covered to accept queries, default yes, no allows queries for the corresponding key space when some slots are available',
  'cluster-replica-no-failover':
    'Whether to prohibit replica nodes from automatic failover, default no, yes only allows manual failover',
  'cluster-allow-reads-when-down':
    'Whether nodes still provide read services for the slots they are responsible for when the cluster fails, default no, yes is suitable for scenarios that do not require strong consistency (such as caches)',
  'cluster-allow-pubsubshard-when-down':
    'Whether nodes still provide Pub/Sub services for the slots they are responsible for when the cluster fails, default yes',
  'cluster-link-sendbuf-limit':
    'Memory limit (bytes) for the send buffer of cluster bus connections, default 0 (disabled), minimum 1gb is recommended to prevent unlimited buffer growth',
  'cluster-announce-hostname':
    'Hostname announced by cluster nodes to the outside, used for SNI or DNS routing, default empty string',
  'cluster-announce-human-nodename':
    'Human-readable name of cluster nodes, used for debugging and management, default empty string',
  'cluster-preferred-endpoint-type':
    'Preferred connection endpoint type provided by the cluster to the outside, optional ip (default), hostname, unknown-endpoint',
  'cluster-compatibility-sample-ratio':
    'Sampling ratio (0-100) for command compatibility checks in cluster mode, default 0 (no sampling), 100 means full check, high ratio may affect performance',
  'cluster-slot-stats-enabled':
    'Whether to enable hash slot resource statistics, default no, enabling allows obtaining detailed statistics (such as memory usage) through CLUSTER SLOT-STATS',
  'cluster-slot-migration-write-pause-timeout':
    'Timeout time (milliseconds) for the source node to pause writes during the slot migration handoff phase, default 10000, preventing long-term write blocking',
  'cluster-slot-migration-handoff-max-lag-bytes':
    'Maximum replication lag (bytes) for triggering the slot handoff phase during slot migration, default 1mb, the source node pauses writes when the remaining lag is below this value',
  'cluster-announce-ip':
    'IP address announced by cluster nodes to the outside, used in NAT or container environments',
  'cluster-announce-tls-port':
    'TLS port announced by cluster nodes to the outside, effective when tls-cluster is enabled',
  'cluster-announce-bus-port': 'Bus port announced by cluster nodes to the outside',
  'slowlog-log-slower-than':
    'Threshold (microseconds) for slow query logs, commands exceeding this time will be recorded, 1000000 microseconds = 1 second, negative value disables, 0 records all commands, default 10000',
  'slowlog-max-len':
    'Maximum number of entries in the slow query log, the oldest entry is deleted when exceeded, default 128',
  'latency-monitor-threshold':
    'Threshold (milliseconds) for latency monitoring, operations exceeding this time will be sampled, 0 disables monitoring, default 0',
  'latency-tracking':
    'Whether to enable extended latency monitoring (tracking the latency distribution of each command), default yes',
  'latency-tracking-info-percentiles':
    'Percentiles output by extended latency monitoring through INFO latencystats, default 50, 99, 99.9',
  'notify-keyspace-events':
    'Keyspace event notification configuration, composed of characters to indicate enabled event types (such as K, E, g, $, etc.), empty string disables notifications, default ""',
  'hash-max-listpack-entries':
    'Maximum number of entries for hash objects to use compact encoding, converted to hash table when exceeded, default 512',
  'hash-max-listpack-value':
    'Maximum value size (bytes) for hash objects to use compact encoding, converted to hash table when exceeded, default 64',
  'list-max-listpack-size':
    'Node size limit for list objects to use compact encoding, negative values represent by bytes (-1=4Kb, -2=8Kb, etc.), positive values represent by the number of elements, default -2',
  'list-compress-depth':
    'Compression depth of list objects, 0 disables compression, positive values indicate the number of nodes not compressed at both ends, default 0',
  'set-max-intset-entries':
    'Maximum number of entries for set objects to use integer set encoding, converted to hash table when exceeded, default 512',
  'set-max-listpack-entries':
    'Maximum number of entries for non-integer sets to use compact encoding, converted to hash table when exceeded, default 128',
  'set-max-listpack-value':
    'Maximum value size (bytes) for non-integer sets to use compact encoding, converted to hash table when exceeded, default 64',
  'zset-max-listpack-entries':
    'Maximum number of entries for sorted sets to use compact encoding, converted to skip list when exceeded, default 128',
  'zset-max-listpack-value':
    'Maximum value size (bytes) for sorted sets to use compact encoding, converted to skip list when exceeded, default 64',
  'hll-sparse-max-bytes':
    'Maximum bytes for the sparse representation of HyperLogLog (including 16-byte header), converted to dense representation when exceeded, default 3000, maximum 16000',
  'stream-node-max-bytes': 'Maximum bytes of stream object nodes, 0 means no limit, default 4096',
  'stream-node-max-entries':
    'Maximum number of entries of stream object nodes, 0 means no limit, default 100',
  activerehashing:
    'Whether to enable active rehashing, default yes, used to release free memory of hash tables, can be disabled for latency-sensitive scenarios',
  'client-output-buffer-limit normal':
    'Output buffer limit for normal clients (including MONITOR), format "hard limit soft limit soft limit duration", default 0 0 0 (no limit)',
  'client-output-buffer-limit replica':
    'Output buffer limit for replica node clients, default 256mb 64mb 60',
  'client-output-buffer-limit pubsub':
    'Output buffer limit for Pub/Sub clients, default 32mb 8mb 60',
  'client-query-buffer-limit':
    'Maximum size of the client query buffer, default 1gb, used to limit memory usage caused by protocol desynchronization',
  lookahead: 'Number of commands to decode and prefetch in each client pipeline, default 16',
  'maxmemory-clients':
    'Maximum memory limit occupied by all client connections, 0 disables client eviction, supports absolute values (such as 1g) or percentages (such as 5%), default 0',
  'proto-max-bulk-len': 'Maximum size of bulk requests in the protocol, default 512mb, minimum 1mb',
  hz: 'Execution frequency (Hz) of Redis background tasks, value range 1-500, default 10, higher values improve responsiveness but increase CPU consumption, values over 100 are not recommended',
  'dynamic-hz':
    'Whether to enable dynamic HZ adjustment, default yes, automatically increase HZ when there are many client connections and decrease when idle',
  'aof-rewrite-incremental-fsync':
    'Whether to execute fsync every 4MB of data generated during AOF rewrite, default yes, used to reduce latency spikes',
  'rdb-save-incremental-fsync':
    'Whether to execute fsync every 4MB of data generated during RDB saving, default yes, used to reduce latency spikes',
  'lfu-log-factor':
    'Counter logarithm factor of the LFU eviction algorithm, default 10, affecting the growth speed of the counter',
  'lfu-decay-time': 'Decay time (minutes) of the LFU counter, default 1, 0 means never decay',
  'max-new-connections-per-cycle':
    'Maximum number of new connections that can be accepted per event loop cycle (non-TLS), default 10',
  'max-new-tls-connections-per-cycle':
    'Maximum number of new TLS connections that can be accepted per event loop cycle, default 1',
  activedefrag:
    'Whether to enable active memory defragmentation, default no, only supports the Jemalloc allocator built into Redis',
  'active-defrag-ignore-bytes':
    'Minimum fragmented waste bytes for active defragmentation, default 100mb',
  'active-defrag-threshold-lower':
    'Minimum fragmentation rate threshold (percentage) for active defragmentation, default 10',
  'active-defrag-threshold-upper':
    'Maximum fragmentation rate threshold (percentage) for active defragmentation, default 100',
  'active-defrag-cycle-min':
    'CPU usage percentage (percentage) when the fragmentation rate reaches the lower threshold, default 1',
  'active-defrag-cycle-max':
    'CPU usage percentage (percentage) when the fragmentation rate reaches the upper threshold, default 25',
  'active-defrag-max-scan-fields':
    'Number of set/hash/sorted set/list fields processed per main dictionary scan, default 1000',
  'jemalloc-bg-thread': "Whether to enable Jemalloc's background cleaning thread, default yes",
  'server-cpulist': 'CPU affinity of Redis server/IO threads, format same as the taskset command',
  'bio-cpulist': 'CPU affinity of background I/O threads, format same as the taskset command',
  'aof-rewrite-cpulist':
    'CPU affinity of the AOF rewrite child process, format same as the taskset command',
  'bgsave-cpulist': 'CPU affinity of the BGSAVE child process, format same as the taskset command',
  'ignore-warnings':
    'List of Redis startup warnings to suppress, separated by spaces, such as ARM64-COW-BUG',
}
const enClientTip = {
  id: 'a unique 64-bit client ID',
  addr: 'address/port of the client',
  laddr: 'address/port of local address client connected to (bind address)',
  fd: 'file descriptor corresponding to the socket',
  name: 'the name set by the client with CLIENT SETNAME',
  age: 'total duration of the connection in seconds',
  idle: 'idle time of the connection in seconds',
  flags: 'client flags (see below)',
  db: 'current database ID',
  sub: 'number of channel subscriptions',
  psub: 'number of pattern matching subscriptions',
  ssub: 'number of shard channel subscriptions. Added in Redis 7.0.3',
  multi: 'number of commands in a MULTI/EXEC context',
  watch: 'number of keys this client is currently watching. Added in Redis 7.4',
  qbuf: 'query buffer length (0 means no query pending)',
  qbufFree: 'free space of the query buffer (0 means the buffer is full)',
  argvMem: 'incomplete arguments for the next command (already extracted from query buffer)',
  multiMem: 'memory is used up by buffered multi commands. Added in Redis 7.0',
  obl: 'output buffer length',
  oll: 'output list length (replies are queued in this list when the buffer is full)',
  omem: 'output buffer memory usage',
  totMem: 'total memory consumed by this client in its various buffers',
  events: 'file descriptor events (see below)',
  cmd: 'last command played',
  user: 'the authenticated username of the client',
  redir: 'client id of current client tracking redirection',
  resp: 'client RESP protocol version. Added in Redis 7.0',
  rbp: "peak size of the client's read buffer since the client connected. Added in Redis 7.0",
  rbs: "current size of the client's read buffer in bytes. Added in Redis 7.0",
  libName: 'the name of the client library that is being used',
  libVer: 'the version of the client library',
  ioThread: 'id of I/O thread assigned to the client. Added in Redis 8.0',
  totNetIn: 'total network input bytes read from this client',
  totNetOut: 'total network output bytes sent to this client',
  totCmds: 'total count of commands this client executed',
}

// 中文语言返回中文提示，否则返回英文提示
const infoTip = computed(() => (isZh.value ? zhInfoTip : enInfoTip))
const configTip = computed(() => (isZh.value ? zhConfigTip : enConfigTip))
const clientTip = computed(() => (isZh.value ? zhClientTip : enClientTip))
export { infoTip, configTip, clientTip }
