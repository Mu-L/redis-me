export default {
  name: 'en',

  // 通用
  copy: 'Copy',
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  action: 'Action',
  cancel: 'Cancel',

  ok: 'OK',
  warn: 'Warning',
  error: 'Error',

  copyOk: 'Copy OK',
  addOk: 'Add OK',
  editOk: 'Edit OK',
  deleteOk: 'Delete OK',

  setting: {
    title: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    system: 'Auto',
    light: 'Light',
    dark: 'Dark',
    language: 'Language'
  },

  conn: {
    // 列表展示
    add: 'Add Conn',
    export: 'Export Conn',
    import: 'Import Conn',
    keyword: 'Filter (Name, Host)',
    color: 'Color',
    name: 'Name',
    hostPort: 'Host/Port',
    otherProp: 'Ext',
    cluster: 'Cluster',

    exportOk: 'Export Success',
    exportErr: 'Export Error',
    importOk: 'Import Success',
    importErr: 'Import Error',
    importJsonErr: 'Invalid Json',
    importConnErr: 'Invalid Conn',
    importFormatErr: 'Invalid Format',

    // 新增编辑
    addConn: 'Add Conn',
    editConn: 'Edit Conn',
    host: 'Host',
    port: 'Port',
    username: 'User',
    password: 'Password',
    ssl: 'SSL Options',
    cert: 'Cert',
    key: 'Key',
    ca: 'CA',

    nameHint: '【Optional】Automatically generated based on host and port',
    certHint: 'Public Key File format',
    keyHint: 'Private Key File in PEM format',
    caHint: 'Certificate Authority File in PEM format',
    testConn: 'Test Conn',
    readonly: 'Read Only',
    nameRequired: 'Please Input host',
    portRequired: 'Please Input port',
    testOk: 'Conn Success'
  },

  util: {
    day: 'D',
    deleteKey: 'Delete【{key}】?',
    updateHint: 'new version v{version}，update？',
    updateDone: 'update done, restart now?',
    updateErr: 'update error: {message}'
  },

  tabMain: {
    info: 'INFO',
    value: 'Value',
    console: 'Console',
    slow: 'SlowLog',
    monitor: 'Monitor',
    pubsub: 'Pub/Sub',
    chart: 'Chart',
  }

}