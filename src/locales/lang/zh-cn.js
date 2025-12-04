export default {
  name: 'zh-cn',

  // 通用
  copy: '复制',
  add: '新增',
  edit: '编辑',
  delete: '删除',
  action: '操作',
  cancel: '取消',

  ok: '确定',
  warn: '提示',
  error: '错误',

  copyOk: '复制成功',
  addOk: '新增成功',
  editOk: '保存成功',
  deleteOk: '删除成功',

  setting: {
    title: '设置',
    appearance: '外观',
    theme: '主题',
    system: 'Auto',
    light: '浅色',
    dark: '深色',
    language: '语言'
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

    nameHint: '【可选】默认自动根据主机和端口生成',
    certHint: 'PEM格式公钥文件 (Cert)',
    keyHint: 'PEM格式私钥文件 (Key)',
    caHint: 'PEM格式授权文件 (CA)',
    testConn: '测试连接',
    readonly: '只读',
    nameRequired: '请输入主机',
    portRequired: '请输入端口',
    testOk: '测试连接成功'
  },

  util: {
    day: '天',
    deleteKey: '确定删除键【{key}】吗？',
    updateHint: '有新版本 v{version}，是否更新？',
    updateDone: '更新完成，是否立刻重启？',
    updateErr: '更新失败: {message}'
  },

  tabMain: {
    info: '信息',
    value: '键值',
    console: '终端',
    slow: '慢日志',
    monitor: '监控',
    pubsub: '发布订阅',
    chart: '图表',
  },

  keyHeader: {
    mockHint: '请输入每种数据类型条数（N×5）',
    mockOk: '模拟数据插入完成',
    connHint: '请选择连接',

    refreshConn: '刷新连接',
    closeConn: '关闭连接',
    mockData: '模拟数据',
    setting: '基础设置',
    about: '关于',
  },

  about: {
    sourceCode: '源码地址',
    officialWebsite: '官方网站'
  }
}