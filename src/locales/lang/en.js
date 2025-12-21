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
  refresh: 'Refresh',

  ok: 'OK',
  warn: 'Warning',
  error: 'Error',

  copyOk: 'Copied to Clipboard',
  addOk: 'Success',
  editOk: 'Saved',
  saveOk: 'Saved',
  deleteOk: 'Deleted',

  setting: {
    title: 'Settings',
    appearance: 'Appearance',
    labelWidth: '86px',

    theme: 'Theme',
    system: 'Auto',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    systemLanguage: 'System',

    uiFont: 'UI Font',
    codeFont: 'Code Font',
    uiFontHint: 'Optional Choose UI Font',
    codeFontHint: 'Optional Choose Code Font（CodeMirror, Terminal）',

    app: 'Application',
    update: 'Update',
    updateAuto: 'Auto Check',
    nowVersion: 'Version',
    updateNow: 'Check Now',
    updateSource: 'Source',
  },

  conn: {
    // 列表展示
    add: 'Add Conn',
    export: 'Export Conn',
    import: 'Import Conn',
    keyword: 'Filter (Name, Host)',
    color: 'Color',
    name: 'Name',
    hostPort: 'Host:Port',
    otherProp: 'Other Prop',
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

    nameHint: '[Optional] Automatically generated based on Host and Port',
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
    days: 'day | days',
    deleteKey: 'Delete [{key}]?',
    checking: 'Checking for update, wait a moment...',
    updateHint: 'New version v{version}, update?',
    downloadDown: 'Download done, install now?',
    updateDone: 'Update done, restart now?',
    updateErr: 'Download Package Fail',
    latestVersion: "You're up-to-date",
    checkUpdateErr: 'Check Update Fail'
  },

  tabMain: {
    info: 'INFO',
    value: 'Value',
    console: 'Console',
    memory: 'Memory',
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
    ttlValidator: 'TTL timeout duration only allows -1(Permanent) or positive integer (Seconds)',
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
    second: 'Second | Seconds',
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
    title: 'Batch Delete Keys',
    match: 'Key match expression',
    deleteDirect: 'Delete Direct',
    impactKeys: 'Impact Key ({count}) | Impact Keys ({count})',
    confirmDelete: 'Confirm Delete',
    showImpactKeys: 'Show Impact Keys',
    confirmDeleteSize: 'Delete 1 Key | Delete {count} Keys'
  },

  keyMemory: {
    title: 'Folder Memory Usage',
    match: 'Key match expression',
    info: 'Total: {total}，Size: {size}',
    limit: '(Data has reached limit：${limit})'
  },

  keyList: {
    refreshKey: 'Reload',
    copyKey: 'Copy',
    deleteKey: 'Delete',
  },

  keyTree: {
    noData: 'No Data',
    refreshKey: 'Reload',
    copyKey: 'Copy',
    deleteKey: 'Delete',
    addKey: 'Add Key',
    copyFolder: 'Copy Folder',
    loadFolder: 'Load Folder',
    memoryUsage: 'Memory Usage',
    deleteFolder: 'Batch Delete Keys'
  },

  redisClient: {
    clientType: 'Client Type',
    keyword: 'Filter (Addr、Name) ',
    addr: 'Addr',
    name: 'Name',
    age: 'Age',
    idle: 'Idle',
    cmd: 'Last Cmd'
  },

  redisConfig: {
    total: 'Total',
    noConfig: 'No Config File',
    reference: 'Reference',
    keyword: 'Filter (Param / Value)',
    param: 'Param',
    value: 'Value',
    tip: 'Tip',
    defaultConfig: 'default config'
  },

  redisInfo: {
    rdbDisabled: 'RDB Disabled',
    total: 'Total',
    uptimeInDays: 'Uptime',
    days: 'day | days',
    keyTotal: 'Keys',
    connectedClients: 'Clients',
    maxClients: 'Max',
    persistence: 'Persistence',
    memory: 'Memory',
    peak: 'Peak',
    rss: 'RSS',
    os: 'OS',
    system: 'System',
    executable: 'Executable',
    config: 'Config',
    infoDetail: 'Info Detail',
    jumpWebsite: 'Jump To Redis Official Website',
    redisWebsite: 'https://redis.io/docs/latest/commands/info/',
    rawInfo: 'Raw Info',
    tag: 'Tag',
    keyword: 'Filter (Key/Value)',
    key: 'Key',
    value: 'Value',
    tip: 'Tip',
    client: 'Client',
    runConfig: 'Run Config'
  },

  redisMemory: {
    hint: `
    <b>Remark：scan / memory usage / pipeline / type</b> <br/>
    Description: Use the scan method to scan all master nodes, searching for keys that match {matchParam}. Each scan processes {scanCount} keys, then uses the pipeline to batch send the memory usage command to obtain the memory size occupied, and records keys that are >= {sizeLimitKb}Kb. If the total number of scanned keys reaches {scanTotal} (a value less than or equal to 0 means scanning all) or the result count meets {countLimit}, the process returns. Otherwise, it sleeps for {sleepMillis}ms and continues scanning using the cursor.<br/> 
    Note: The memory usage command reports the number of bytes required for a key and its value to be stored in memory. The reported usage is the total memory allocation for a key and its value, including data and administrative overhead.
    `,
    total: 'Total',
    longTimeHint: 'Are you sure to start memory analysis? It may take a long time, please be patient!',
    batchDeleteHint: 'Batch Delete 1 Key? | Batch Delete {count} Keys?',
    scanConfig: 'Scan Config',

    fuzzy: 'fuzzy',
    matchParam: 'Match Param',
    scanEach: 'Scan Each',
    sleepMillis: 'Sleep Millis',
    scanTotal: 'Scan Total',
    sizeLimit: 'Size Limit',
    countLimit: 'Count Limit',
    unit: '-',
    batchDelete: 'Batch Delete',
    keyword: 'Key Filter',
    startScan: 'Start Scan',
    type: 'Type',
    key: 'Key',
    size: 'Size',
    chooseKey: 'Detail'
  },

  redisMonitor: {
    monitorHint: 'Monitor command may cause server blocking, use with caution in production environment !',
    monitorStarted: 'Monitor Started',
    monitorStopped: 'Monitor Stoped',
    clearMessage: 'Clear Message',
    keyword: 'Filter Command',
    monitorStart: 'Start Monitor',
    monitorStop: 'Stop Monitor',
    time: 'DateTime',
    command: 'Command'
  },

  redisPubSub: {
    subscribeStarted: 'Subscribe Started',
    subscribeStopped: 'Subscribe Stopped',
    publishOk: 'Publish Success',
    subscribeChannel: 'Subscribe Channel',
    clearMessage: 'Clear Message',
    keyword: 'Filter (Channel/Message) ',
    subscribeStart: 'Subscribe Start',
    subscribeStop: 'Subscribe Stop',
    datetime: 'DateTime',
    channel: 'Channel',
    message: 'Message',
    messageContent: 'Message Content',
    send: 'Send'
  },

  redisSlow: {
    slowParam: 'Slow Param',
    slowerThanHint: 'slowlog-log-slower-than, default 10000 μs',
    slowerThan: 'Than',
    slowerMaxLenHint: 'slowlog-max-len, default 128',
    slowerMaxLen: 'Count',
    slowerGetCount: 'Limit',
    unit: '-',
    keyword: 'Filter (Command、Client、ClientName）',
    command: 'Command',
    cost: 'Cost',
    clientName: 'ClientName',
    time: 'DateTime',
    node: 'Node',
    client: 'Client'
  },

  redisTerminal: {
    hint: `
① When automatic broadcasting is enabled, commands such as CONFIG SET and SLOWLOG RESET will be executed on all nodes<br>
② Under normal circumstances, there is no need to specify a node. Manual node specification is only required in special scenarios such as viewing the configuration of a specific node
    `,
    welcome: 'Welcome to \x1B[1;3;32mRedisME\x1B[0m Terminal',
    autoBroadcast: 'Auto Broadcast'
  },

  redisValue: {
    ttlValidator: 'TTL timeout duration only allows -1(Permanent) or positive integer (Seconds)',
    ttlOk: 'Set TTL Success',
    optional: 'Optional',
    hashKey: 'HashKey',
    ttlHint: 'Click to modify the expiration time of the key (unit is seconds, -1 means permanent)',
    deleteKey: 'Delete Key',
    prettyHint: 'Pretty is enabled by default. When enabled, it formats hash/list/set/json, etc. When disabled, it displays the raw value toString.',
    tableKeyword: 'Fuzzy Filter',
    insertRow: 'Insert Row',
    key: 'Key',
    value: 'Value',
    score: 'Score',
    deleteConfirm: 'Confirm Delete ?',
    jsonView: 'JSON View',
    tableView: 'Table View',
    noKeySelected: 'No Key Selected'
  },

  keyMain: {
    keyword: 'Enter to Search',
    exactSearch: 'Exact Search',
    refreshKey: 'Refresh Key',
    addKey: 'Add Key',
    listView: 'List View',
    treeView: 'Tree View',
    loadMore: 'Load More',
    loadAll: 'Load All',
  }

}