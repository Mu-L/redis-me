export default {
  name: 'en',

  // 通用
  copy: 'Copy',
  add: 'Add',
  edit: 'Edit',
  save: 'Save',
  delete: 'Delete',
  action: 'Action',
  cancel: 'Cancel',

  ok: 'OK',
  warn: 'Warning',
  error: 'Error',

  copyOk: 'Copy OK',
  addOk: 'Add OK',
  editOk: 'Save OK',
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

    nameHint: '【Optional】Automatically generated based on Host and Port',
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
  },

  keyHeader: {
    mockHint: 'Please enter the number of entries for each data type（N×5）',
    mockOk: 'Mock Data Insert Done',
    connHint: 'Select Connection',

    refreshConn: 'Refresh Conn',
    closeConn: 'Close Conn',
    mockData: 'Mock Data',
    setting: 'Setting',
    about: 'About',
  },

  about: {
    sourceCode: 'Source Code',
    officialWebsite: 'Official Website'
  },

  fieldAdd: {
    append: 'Append',
    prepend: 'Prepend',
    keyRequired: 'Please input key',
    typeRequired: 'Please select type',
    ttlRequired: 'Please input TTL',
    ttlValidator: 'TTL timeout duration only allows -1 or positive integers',
    valueRequired: 'Please input value',
    hashValidator: 'HashKey and hashValue required',
    hashHint: '(HashKey: HashValue)',
    zsetHint: '(Value: Score)',
    newKey: 'New Key',
    newField: 'New Field',
    key: 'Key',
    field: 'Field',
    type: 'Type',
    ttl: 'TTL',
    negativeOneHint: '-1 means Permanent',
    permanent: 'Permanent',
    second: 'Second',
    value: 'Value',
    element: 'Element',
    hashKey: 'HashKey'
  },

  fieldSet: {
    fieldValueRequired: 'Value Required',
    fieldScoreRequired: 'Score Required',
    editField: 'Edit Field',
    hashKey: 'HashKey',
    index: 'Index',
    score: 'Score',
    value: 'Value',
  },

  nodeList: {
    placeholder: 'Node [Optional]',
    master: 'M',
    slave: 'S'
  },

  keyBatchDel: {
    matchRequired: 'Key match expression required',
    title: 'Batch Delete Key',
    match: 'Key match expression',
    deleteDirect: 'Delete Direct',
    impactKeys: 'Impact Keys({size})',
    confirmDelete: 'Confirm Delete',
    showImpactKeys: 'Show Impact Keys',
    confirmDeleteSize: 'Delete {size} Keys'
  },

  keyMemory: {

  }
}