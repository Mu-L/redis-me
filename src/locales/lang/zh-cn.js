export default {
  name: 'zh-cn',

  // 通用
  copy: '复制',
  add: '新增',
  edit: '编辑',
  save: '保存',
  delete: '删除',
  action: '操作',
  cancel: '取消',
  refresh: '刷新',

  ok: '确定',
  warn: '提示',
  info: '提示',
  error: '错误',

  copyOk: '复制成功',
  addOk: '新增成功',
  editOk: '保存成功',
  saveOk: '保存成功',
  deleteOk: '删除成功',
  actionOk: '操作成功',

  timeUnit: {
    width: '80',
    second: '秒',
    minute: '分',
    hour: '小时',
    day: '天',
  },

  appMain: {
    readonly: '只读',
    writable: '可写',
    readonlyTip: '切换为只读模式',
    writableTip: '切换为可写模式'
  },

  setting: {
    labelWidth: '60',
    title: '设置',
    appearance: '外观',
    theme: '主题',

    system: '系统',
    light: '浅色',
    dark: '深色',
    language: '语言',
    systemLanguage: '跟随系统',

    uiFont: '界面',
    codeFont: '代码',
    uiFontHint: '可选界面字体（UI）',
    codeFontHint: '可选代码字体（CodeMirror, Terminal）',

    update: '更新',
    updateAuto: '自动检查更新',
    nowVersion: '版本',
    updateNow: '检查更新',
    updateProxy: '更新代理',
    updateAppStore: '应用商店控制更新'
  },

  conn: {
    // 列表展示
    add: '新增连接',
    export: '导出连接',
    import: '导入连接',
    keyword: '模糊筛选（名称、主机）',
    color: '颜色',
    name: '名称',
    hostPort: '主机端口',
    otherProp: '其他属性',
    cluster: '集群',

    exportOk: '导出成功',
    exportErr: '导出失败',
    importOk: '导入成功',
    importErr: '导入失败',
    importJsonErr: '文件JSON解析错误',
    importConnErr: '文件不包含有效连接',
    importFormatErr: '文件连接格式错误',

    // 新增编辑
    addConn: '新增连接',
    editConn: '编辑连接',
    host: '主机',
    port: '端口',
    username: '用户',
    password: '密码',
    ssl: 'SSL设置',
    cert: '公钥',
    key: '私钥',
    ca: '授权',
    sentinel: '哨兵',
    sentinelConfig: '哨兵配置',
    sentinelLabelWidth: '100',
    masterName: '主节点组名',
    masterUsername: '主节点用户',
    masterPassword: '主节点密码',
    autoDiscover: '自动查询组名',
    autoDiscoverOk: '查询到{count}个主节点',

    nameHint: '【可选】默认自动根据主机和端口生成',
    certHint: 'PEM格式公钥文件 (Cert)',
    keyHint: 'PEM格式私钥文件 (Key)',
    caHint: 'PEM格式授权文件 (CA)',
    testConn: '测试连接',
    readonly: '只读',
    readonlyShort: '只读',
    nameRequired: '请输入主机',
    portRequired: '请输入端口',
    testOk: '测试连接成功',

    downloading: '下载中...',
  },

  util: {
    days: '天',
    deleteKey: '确定删除键【{key}】吗？',
    checking: '检查更新中，请稍后...',
    updateHint: '有新版本 v{version}，是否升级？',
    changelog: '更新日志',
    changelogUrl: 'https://www.hepengju.com/zh/changelog/latest.html',
    downloadDown: '下载完成，是否立刻安装？',
    updateDone: '更新完成，是否立刻重启？',
    updateErr: '下载安装包失败',
    latestVersion: '当前为最新版本',
    checkUpdateErr: '检查更新失败'
  },

  tabMain: {
    info: '信息',
    value: '键值',
    terminal: '终端',
    memory: '内存',
    slow: '慢日志',
    monitor: '监控',
    pubsub: '发布订阅',
    chart: '图表',
    tauri: 'Tauri'
  },

  keyHeader: {
    mockHint: '请输入每种数据类型条数（N×5）',
    mockOk: '模拟数据插入完成',
    connHint: '请选择连接',

    refreshConn: '刷新连接',
    closeConn: '关闭连接',
    mockData: '模拟数据',
    setting: '设置',
    about: '关于',
  },

  about: {
    sourceCode: '源码地址',
    officialWebsite: '官方网站'
  },

  fieldAdd: {
    append: '尾部追加',
    prepend: '插入头部',
    keyRequired: '请输入键名',
    typeRequired: '请选择类型',
    ttlRequired: '请输入TTL',
    ttlValidator: '只允许-1(永久) 或 正整数',
    valueRequired: '值不允许为空',
    hashValidator: '哈希键和值不允许为空',
    hashHint: '(哈希键: 值)',
    zsetHint: '(值: 分数)',
    newKey: '新增键',
    newField: '新增字段',
    key: '键',
    field: '字段',
    type: '类型',
    ttl: 'TTL超时时长 (-1代表永久)',
    negativeOneHint: '-1代表永久',
    permanent: '永久',
    second: '秒',
    value: '值',
    element: '元素',
    hashKey: '哈希键'
  },

  fieldSet: {
    fieldValueRequired: '值不能为空',
    fieldScoreRequired: '请输入分数',
    editField: '编辑字段',
    hashKey: '哈希键',
    index: '索引',
    score: '分数',
    value: '值',
  },

  nodeList: {
    placeholder: '指定节点【可选】',
    master: '主',
    slave: '从'
  },

  keyBatchDel: {
    matchRequired: '键名表达式不能为空',
    title: '批量删除键',
    match: '键名表达式',
    deleteDirect: '直接匹配删除',
    impactKeys: '受影响的键名({size})',
    confirmDelete: '确认删除',
    showImpactKeys: '查看受影响的键名',
    confirmDeleteSize: '确认删除{size}个键'
  },

  keyMemory: {
    title: '目录内存分析',
    match: '键名表达式',
    info: '总数：{total}，大小：{size}',
    limit: '（数据量达到扫描限制：${limit}）'
  },

  keyList: {
    refreshKey: '重新载入',
    copyKey: '复制键名',
    deleteKey: '删除键',
  },

  keyTree: {
    noData: '没有数据',
    refreshKey: '重新载入',
    copyKey: '复制键名',
    deleteKey: '删除键',
    addKey: '添加新键',
    copyFolder: '复制路径',
    loadFolder: '只加载该目录',
    memoryUsage: '目录内存分析',
    deleteFolder: '批量删除键'
  },

  redisClient: {
    clientType: '客户端类型',
    keyword: '模糊筛选（客户端、名称）',
    addr: '客户端',
    name: '客户端名称',
    age: '持续时间',
    idle: '空闲时间',
    cmd: '最后命令',
    killClientHint: '关闭客户端',
    killClientConfirm: '确定关闭客户端【{client}】吗？',
    killClientOk: '关闭成功'
  },

  redisConfig: {
    total: '配置数',
    noConfig: '暂无配置文件',
    reference: '参考',
    keyword: '模糊筛选（配置项/值、说明）',
    param: '配置项',
    value: '配置值',
    tip: '说明',
    defaultConfig: '默认配置',
    all: '全部',
    diff: '差异',
  },

  redisInfo: {
    rdbDisabled: '未开启RDB',
    total: '合计',
    uptimeInDays: '运行时间',
    days: '天',
    keyTotal: '键总数',
    connectedClients: '连接数',
    maxClients: '限制',
    persistence: '持久化',
    memory: '内存',
    peak: '峰值',
    rss: 'RSS',
    os: '系统',
    system: '系统',
    executable: '执行程序',
    config: '配置',
    infoDetail: '参数详情',
    jumpWebsite: '跳转官网参数详解',
    redisWebsite: 'https://redis.ac.cn/docs/latest/commands/info/',
    rawInfo: '原始信息',
    tag: '分类',
    keyword: '模糊筛选（键值、说明）',
    key: '键',
    value: '值',
    tip: '说明',
    client: '客户端',
    runConfig: '运行配置',
    cacheRatio: '缓存命中率'
  },

  redisMemory: {
    hint: `
    <b>原理：scan / memory usage / pipeline / type</b> <br/>
说明：使用scan方法扫描所有master节点，寻找匹配 {matchParam} 的键。每次扫描{scanCount}个键，然后pipeline批量发送memory usage命令获取占用内存大小，将>={sizeLimitKb}Kb的键记录下来。
如果扫描键的总数已经到达{scanTotal}个（小于等于0表示扫描所有 或 结果数量已经满足{countLimit}个则返回，否则睡眠{sleepMillis}ms 再使用游标继续扫描。<br/>
备注：memory usage 命令报告键及其值存储在内存中所需的字节数。报告的用量是一个键及其值所需的数据和管理开销的总内存分配量。
    `,
    total: '合计',
    longTimeHint: '确定开始内存分析吗？耗时可能较长，请耐心等待！',
    batchDeleteHint: '确定批量删除【{size}】个键吗？',
    scanConfig: '扫描配置',

    fuzzy: '模糊',
    matchParam: '匹配参数',
    scanEach: '每次扫描',
    sleepMillis: '每次睡眠',
    scanTotal: '扫描总数',
    sizeLimit: '大小限制',
    countLimit: '数量限制',
    unit: '个',
    batchDelete: '批量删除',
    keyword: '键模糊筛选',
    startScan: '开启分析',
    type: '类型',
    key: '键',
    size: '大小',
    chooseKey: '详情'
  },

  redisMonitor: {
    monitorHint: '监控命令可能造成服务端阻塞，生产环境谨慎使用！',
    monitorStarted: '监控已开始',
    monitorStopped: '监控已停止',
    clearMessage: '清空消息',
    keyword: '模糊筛选',
    monitorStart: '开启监控',
    monitorStop: '停止监控',
    time: '时间',
    command: '命令'
  },

  redisPubSub: {
    subscribeStarted: '订阅已开始',
    subscribeStopped: '订阅已停止',
    publishOk: '发布消息成功',
    subscribeChannel: '订阅频道',
    clearMessage: '清空消息',
    keyword: '模糊筛选（频道、消息）',
    subscribeStart: '开启订阅',
    subscribeStop: '停止订阅',
    datetime: '时间',
    channel: '频道',
    message: '消息',
    messageContent: '消息内容',
    send: '发送'
  },

  redisSlow: {
    slowParam: '慢参数',
    slowerThanHint: '命令执行时间超过的阈值 [ slowlog-log-slower-than ]，单位微秒，默认 10000',
    slowerThan: '阈值',
    slowerMaxLenHint: '慢日志中条目的最大数量 [ slowlog-max-len ]，默认 128',
    slowerMaxLen: '数量',
    slowerGetCount: '限制',
    unit: '个',
    keyword: '模糊筛选（命令、客户端、名称）',
    command: '命令',
    cost: '耗时',
    clientName: '客户端名称',
    time: '执行时间',
    node: '节点',
    client: '客户端'
  },

  redisTerminal: {
    hint: `
① 自动广播开启且没有选择节点时 CONFIG SET 和 SLOWLOG RESET 等命令会在所有节点执行<br>
② 正常情况下无需指定节点，仅在查看特定节点配置等特殊场景可手动指定节点
    `,
    welcome: '欢迎使用 {RedisME} Terminal',
    autoBroadcast: '自动广播',
    readonlyHint: '只读模式下暂不支持执行命令',
    autoCopyHint: '自动复制命令结果'
  },

  redisValue: {
    ttlValidator: 'TTL超时时长只允许-1(永久)或正整数(秒)',
    ttlOk: '设置TTL成功',
    optional: '可选输入',
    hashKey: '哈希键',
    ttlHint: '点击修改键的过期时间（单位为秒，-1代表永久）',
    deleteKey: '删除键',
    prettyHint: '默认开启美化，开启后针对hash/list/set/json等进行格式化，关闭后显示原始值toString',
    tableKeyword: '模糊筛选',
    insertRow: '插入行',
    key: '键',
    value: '值',
    score: '分数',
    deleteConfirm: '确定删除吗？',
    jsonView: 'JSON展示',
    tableView: '表格展示',
    noKeySelected: '未选择任何键',
    loadMore: '加载更多',
    loadAll: '加载剩余所有键',
    renameKey: '重命名键',
  },

  redisChart: {
    command: '命令执行数/秒',
    memory: '内存使用',
    networkIn: '网络输入（Kb/s）',
    networkOut: '网络输出（Kb/s）',
    keyTotal: '键数量',
    client: '客户端数量',

    labelWidth: '70',
    autoRefresh: '自动刷新',
    refreshInterval: '刷新间隔',
    refreshUnit: '秒',
    keepMinutes: '保留时长',
    keepUnit: '分',
    maxPointCount: '最大点数',
    pointUnit: '个',
  },

  keyMain: {
    keyword: 'Enter 键进行搜索',
    exactSearch: '精确匹配',
    refreshKey: '刷新键',
    addKey: '新增键',
    listView: '键平铺展示',
    treeView: '键树形展示',
    loadMore: '加载更多',
    loadAll: '加载剩余所有键',
  }
}