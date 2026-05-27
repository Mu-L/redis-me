export default {
  name: 'en',

  // 通用
  copy: 'Copy',
  edit: 'Edit',
  view: 'View',
  save: 'Save',
  delete: 'Delete',
  action: 'Action',
  cancel: 'Cancel',
  refresh: 'Refresh',

  ok: 'OK',
  warn: 'Warning',
  info: 'Info',
  error: 'Error',

  copyOk: 'Copied to Clipboard',
  addOk: 'Success',
  editOk: 'Saved',
  saveOk: 'Saved',
  deleteOk: 'Deleted',
  actionOk: 'Success',

  timeUnit: {
    width: '120',
    second: 'Second | Seconds',
    minute: 'Minute | Minutes',
    hour: 'Hour | Hours',
    day: 'Day | Days',
  },

  appMain: {
    readonly: 'Readonly',
    writable: 'Writable',
    readonlyTip: 'Changed To Readonly',
    writableTip: 'Changed To Writable',
  },

  keyEmpty: {
    tagline: 'Modern, Lightweight, Cross-Platform',
    sourceCode: 'Github',
    bugReport: 'Bug Report',
  },

  setting: {
    toDefault: 'Restore Default',
    confirmToDefault: 'Confirm Restore【{name}】To Default ?',

    labelWidth: '86px',
    title: 'Settings',
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
    update: 'Update',
    updateAuto: 'Auto Check',
    nowVersion: 'Version',
    updateNow: 'Check Now',
    updateAppStore: 'Update By AppStore',

    baseSetting: 'Base Setting',
    moreSetting: 'More Setting',
    extLabelWidth: '120px',
    keyScanCount: 'Key Scan',
    fieldScanCount: 'Field Scan',
    keyScanCountTip:
      'The number of keys loaded per scan. Setting it too large may affect performance',
    fieldScanCountTip: 'The number of fields loaded by each scan for types such as Hash',
    keyShow: 'Key Show',
    keyShowTree: 'Tree',
    keyShowList: 'List',
    keySort: 'Tree Sort',
    sortByCount: 'Count',
    sortByAlphabet: 'Alphabet',

    keyHeight: 'Key Height',
    fieldShow: 'Field Display',
    fieldShowTip:
      'Default view for Hash, List, etc.; auto starts with JSON and remembers your last manual choice across connections and keys; table mode prefers table view, still switchable manually',
    fieldShowAuto: 'Auto',
    fieldShowTable: 'Table',

    dir: 'Directory',
    configDir: 'ConfigDir',
    appDir: 'AppDir',
    logDir: 'LogDir',
  },

  conn: {
    // 列表展示
    add: 'Add Conn',
    emptyNewWindow: 'New Window',
    emptyAppSetting: 'App Settings',
    export: 'Export Conn',
    import: 'Import Conn',
    clearConnections: 'Clear Conn',
    clearConnectionsConfirm: 'Clear all connections? This cannot be undone!',
    clearConnectionsOk: 'All connections cleared',
    keyword: 'Filter (Name, Host)',
    color: 'Color',
    name: 'Name',
    hostPort: 'Host:Port',
    otherProp: 'Other Prop',
    cluster: 'Cluster',
    showFlat: 'Flat View',
    showGroup: 'Grouped View',
    ungrouped: 'Default Group',
    newFolder: 'New Group',
    renameFolder: 'Rename',
    deleteFolder: 'Delete Folder',
    folderNameRequired: 'Please enter a folder name',
    folderExists: 'Folder name already exists',
    renameFolderOk: 'Folder renamed',
    deleteFolderConfirm: 'Delete folder "{name}"? Connections will move to Default Group.',
    deleteFolderOk: 'Folder deleted',

    exportOk: 'Export Success',
    exportErr: 'Export Error',
    importOk: 'Import Success',
    importErr: 'Import Error',
    importJsonErr: 'Invalid Json',
    importConnErr: 'Invalid Conn',
    importFormatErr: 'Invalid Format',
    importTitle: 'Import connections',
    importSource: 'Source',
    importPickFile: 'File',
    importPlaceholderRedisme: 'Click "..." to choose a RedisME export (.mec)',
    importPlaceholderAnother: 'Click "..." to choose an AnotherRDM export (.ano)',
    importPlaceholderTiny: 'Click "..." to choose a TinyRDM export (.zip)',
    importPlaceholderInsight: 'Click "..." to choose a Redis Insight connections export (.json)',
    importWrongSourceInsight:
      'This file looks like a Redis Insight export. Choose "Redis Insight" as the source and try again.',
    importFileRequired: 'Please choose a file to import',
    importPortErr: 'Invalid port (must be an integer between 1 and 65535)',
    importAnoDecodeErr: 'Failed to decode AnotherRDM file (invalid Base64)',
    importMecDecodeErr: 'Failed to decode RedisME connection file (invalid Base64)',
    importZipReadErr: 'Failed to read the ZIP file',
    importZipErr: 'Failed to extract ZIP',
    importYamlErr: 'Invalid connections.yaml',
    importYamlMissing: 'connections.yaml not found in ZIP',
    importSkippedUnix: 'Skipped {n} Unix socket connection(s) (TCP only)',
    importAllUnixErr: 'No TCP connections to import (only Unix sockets)',

    // 新增编辑
    labelWidth: '80',
    addConn: 'Add Conn',
    editConn: 'Edit Conn',
    deleteConn: 'Delete Connection 【{name}】?',
    host: 'Host',
    port: 'Port',
    username: 'User',
    password: 'Password',
    ssl: 'SSL Options',
    sslOption: {
      cert: 'Cert',
      key: 'Key',
      ca: 'CA',
      certHint: 'Public Key File format (Cert)',
      keyHint: 'Private Key File in PEM format (Key)',
      caHint: 'Certificate Authority File in PEM format (CA)',
    },
    sentinel: 'Sentinel',
    sentinelLabelWidth: '140',
    sentinelConfig: 'Sentinel Options',
    sentinelOption: {
      masterName: 'Master Name',
      masterUsername: 'Master Username',
      masterPassword: 'Master Password',
      masterNameHint: 'Master node name monitored by sentinel',
    },
    autoDiscover: 'Auto Discover',
    autoDiscoverOk: 'Discover {count} Master | Discover {count} Masters',

    ssh: 'SSH Tunnel',
    sshModeTip: 'SSH tunnel does not support cluster/sentinel mode now',
    loginType: 'Login',
    nameHint: '[Optional] Automatically generated',
    testConn: 'Test Conn',
    sshOption: {
      host: 'Host',
      port: 'Port',
      username: 'User',
      password: 'Password',
      loginTypePwd: 'Password',
      loginTypePkfile: 'Private Key',
      pkfile: 'KeyFile',
      passphrase: 'Passphrase',
      pkfileHint: 'Select private key file',
      passphraseHint: 'Password for private key (Optional)',
      hostRequired: 'Please input SSH host',
      portRequired: 'Please input SSH port',
      usernameRequired: 'Please input SSH username',
      passwordRequired: 'Please input SSH password',
      pkfileRequired: 'Please select private key file',
    },

    readonly: 'RO',
    readonlyShort: 'RO',
    nameRequired: 'Please Input host',
    portRequired: 'Please Input port',
    testOk: 'Test Conn Success',
    downloading: 'Downloading',

    sshTip:
      'Connect to Redis server via SSH tunnel, applicable to the following scenarios<br/>• Redis server is on intranet and cannot be accessed directly<br/>• Need to access Redis through jump server/bastion host<br/>• Need encrypted transmission channel for security<br/><b>Note:</b> SSH tunnel currently only supports standalone mode',
    sslTip:
      'Used when Redis server has TLS/SSL port enabled<br/>• Need to set tls-port instead of port in Redis configuration<br/>• May need to provide client certificate and private key<br/>• Used to encrypt transmission channel and prevent data theft',
    readonlyTip:
      'After enabling read-only mode<br/>• All edit, delete, and write buttons are hidden<br/>• Only allows viewing and reading Redis data<br/>• Can dynamically switch read-only/writable mode by the lock icon',
    clusterTip:
      'Redis Cluster Mode<br/>• Only need to fill in the address of any node<br/>• Automatically identifies all nodes in the cluster',
    sentinelTip:
      'Redis Cluster Mode<br/>• Choose any one of multiple sentinels, please fill in sentinel configuration for address, port, and password<br/>• Master node username and password are for the Master node monitored by the sentinel',
  },

  customFormatter: {
    title: 'Custom Codec',
    name: 'Name',
    namePlaceholder: 'Shown in the encoding dropdown',
    command: 'Command',
    commandHelp: `Enter the <b>full command with interpreter</b>, e.g. python C:\\path\\codec.py<br/><br/>
<b>The app appends two arguments</b><br/>
• Arg 1: decode (read) or encode (write)<br/>
• Arg 2: Base64 string<br/><br/>
<b>Decode</b> (Redis → editor)<br/>
• Arg 2: Base64 of raw Redis bytes<br/>
• stdout: UTF-8 text for the editor<br/><br/>
<b>Encode</b> (editor → Redis)<br/>
• Arg 2: Base64 of editor text as UTF-8 bytes<br/>
• stdout: one line of Base64 raw Redis bytes (written on save)<br/><br/>
<b>On failure</b>: stderr is shown first; non-zero exit code shows an exec error<br/>
<b>Scope</b>: STRING keys only for now`,
    commandPlaceholder: 'python C:\\path\\codec.py',
    add: 'Add',
    edit: 'Edit',
    testDecode: 'Test Decode',
    testEncode: 'Test Encode',
    testDecodeSample: 'Decode sample',
    testDecodeSamplePh: 'wire Base64, default aGVsbG8= (hello)',
    testEncodeSample: 'Encode sample',
    testEncodeSamplePh: 'editor UTF-8 Base64, Hex default Njg2NTZjNmM2Zg== (68656c6c6f)',
    testOk: 'Success',
    testResult: 'Command: {command}<br>Input: {input}<br>Output: {output}',
    testErrorResult: 'Command: {command}<br>Input: {input}<br>Error: {detail}',
    execFailResult: 'Command: {command}\nError: {detail}',
    execCommand: 'Executed command:\n{command}',
    execError: 'Error:',
    emptyCommand: 'Command is required',
    notFound: 'Custom codec "{name}" not found',
    shellUnavailable: 'Custom codecs require the desktop app',
    execFailed: 'Custom codec "{name}" failed (exit code {code})',
    invalidOutput: 'Custom codec "{name}" returned invalid output',
    decodeEmpty: 'Custom codec "{name}" decode returned empty',
    encodeEmpty: 'Custom codec "{name}" encode returned empty',
    encodeNotBase64: 'Custom codec "{name}" encode output is not valid Base64',
    timeout: 'Custom codec "{name}" timed out ({sec}s)',
    duplicateName: 'Name already exists',
    nameRequired: 'Name is required',
  },

  meTable: {
    copyJson: 'Copy JSON',
    copyCsv: 'Copy CSV',
    exportJson: 'Export JSON',
    exportCsv: 'Export CSV',
    exportExcel: 'Export Excel',
    exportHtml: 'Export HTML',
    exportOk: 'Export Success',
    exportErr: 'Export Failed',
    exportEmpty: 'No data',
  },

  util: {
    days: 'd',
    deleteKey: 'Delete [{key}]?',
    checking: 'Checking for update, wait a moment...',
    updateHint: 'New version v{version}, Update?',
    changelog: 'ChangeLog',
    changelogUrl: 'https://www.hepengju.com/changelog/latest.html',
    downloadDown: 'Download done, install now?',
    updateDone: 'Update done, restart now?',
    updateErr: 'Download Package Fail',
    latestVersion: "You're up-to-date",
    checkUpdateErr: 'Check Update Fail',
    invalidHexString: 'Invalid hex string: odd number of characters',
    invalidHexCharacter: 'Invalid hex character',
  },

  tabMain: {
    info: 'Info',
    value: 'Value',
    terminal: 'Terminal',
    memory: 'Memory',
    slow: 'SlowLog',
    monitor: 'Monitor',
    pubsub: 'Pub/Sub',
    chart: 'Chart',
  },

  keyHeader: {
    mockHint: 'Please enter each data type number（N×5）',
    mockValidator: 'Min 1，Max 1000',
    mocking: 'Inserting',
    mockOk: 'Mock Data Insert Done',
    connHint: 'Select Connection',

    refreshConn: 'Refresh Conn',
    closeConn: 'Close Conn',

    newWindow: 'New Window',
    newWindowError: 'Open New Window Error',
    setting: 'Setting',
    social: 'Social',
    about: 'About',
  },

  about: { sourceCode: 'Source Code', officialWebsite: 'Official Website' },

  fieldAdd: {
    append: 'Append',
    prepend: 'Prepend',
    keyRequired: 'Key required',
    typeRequired: 'Type required',
    ttlRequired: 'TTL required',
    ttlValidator: '-1 (Forever) or positive integer',
    valueRequired: 'Value required',
    jsonValidator: 'Value must be in a valid JSON format',
    hashValidator: 'HashKey and hashValue required',
    streamValidator: 'Field and value required',
    hashHint: '(HashKey: HashValue)',
    hashHintTtl: '(HashKey: HashValue: TTL Seconds)',
    zsetHint: '(Value: Score)',
    streamHint: '(Field: Value)',
    newKey: 'New Key',
    newField: 'New Field',
    key: 'Key',
    field: 'Field',
    type: 'Type',
    keyEncoding: 'Key Encoding',
    valueEncoding: 'Value Encoding',
    ttl: 'TTL (-1 means Forever)',
    value: 'Value',
    element: 'Element',
    hashKey: 'HashKey',
    streamId: 'ID (* means it is generated by the server)',
    streamIdRequired: 'id required ',
    fieldTtl: 'TTL',
  },

  fieldSet: {
    fieldValueRequired: 'Value Required',
    fieldScoreRequired: 'Score Required',
    editField: 'Edit Field',
    viewField: 'View Field',
    hashKey: 'HashKey',
    fieldTtl: 'Field TTL (Second)',
    index: 'Index',
    score: 'Score',
    value: 'Value',
    prettyHint:
      'Defaults to the key view pretty setting; toggle temporarily to view the raw field value',
  },

  nodeList: {
    placeholder: 'Node [Optional]',
    slotsTooltip: 'Slots: {slots}',
    slotsReplicaTooltip: "Master's slots: {slots}",
  },

  keyBatch: {
    matchRequired: 'Key match expression required',
    match: 'Key match expression',
    impactKeys: 'Impact Key ({count}) | Impact Keys ({count})',
    showImpactKeys: 'Show Impact Keys',

    delete: 'Batch Delete Keys',
    deleteDirect: 'Delete Direct',
    confirmDelete: 'Confirm Delete',
    confirmDeleteSize: 'Delete 1 Key | Delete {count} Keys',

    export: 'Export Data',
    exportDirect: 'Export Direct',
    confirmExport: 'Confirm Export',
    confirmExportSize: 'Export 1 Key | Export {count} Keys',
    exportFile: 'Export Path',
    exportFileRequired: 'Please Select export path',
    exportFileTip: 'Select export path',
    expireTip: 'Include Expiration',
    ttl: 'Expiration',
  },

  keyImport: {
    title: 'Import Data',
    file: 'Import File',
    fileTip: 'Select file to import ({tip})',
    fileRequired: 'import file required',
    handleConflict: 'On Key Conflict',
    replace: 'Replace',
    ignore: 'Ignore',
    handleTtl: 'Expiration',
    parse: 'Parse File',
    forever: 'Forever',
    confirm: 'Confirm Import',
  },

  keyMemory: {
    title: 'Folder Memory Usage',
    match: 'Key match expression',
    info: 'Total: {total}，Size: {size}',
    limit: '(Data has reached limit：${limit})',
  },

  keyList: { renameKey: 'Rename' },

  keyRename: { title: 'Rename Key', newKeyName: 'New key name' },

  keyTree: {
    noData: 'No Data',
    refreshKey: 'Reload',
    copyKey: 'Copy',
    deleteKey: 'Delete',
    addKey: 'Add Key',
    copyFolder: 'Copy Folder',
    loadFolder: 'Load Folder',
    memoryUsage: 'Memory Usage',
    deleteFolder: 'Delete Keys',
    exportFolder: 'Export Keys',
  },

  redisClient: {
    clientType: 'Client Type',
    keyword: 'Filter (Addr、Name) ',
    addr: 'Addr',
    name: 'Name',
    age: 'Age',
    idle: 'Idle',
    cmd: 'Last Cmd',
    killClientHint: 'Kill Client',
    killClientConfirm: 'Confirm Kill Client【{client}】?',
    killClientOk: 'Killed',
  },

  redisConfig: {
    total: 'Total',
    noConfig: 'No Config File',
    reference: 'Reference',
    keyword: 'Filter (Param / Value / Tip)',
    param: 'Param',
    value: 'Value',
    tip: 'Tip',
    defaultConfig: 'Default',
    all: 'All',
    diff: 'Diff',
    configSet: 'Config Set',
    valueRequired: 'value required',
    command: 'Command',
    autoBroadcast: 'Broadcast',
    autoBroadcastTip: 'Automatically broadcast to all nodes in the cluster when enabled',
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
    rawInfo: 'Raw Info',
    tag: 'Tag',
    keyword: 'Filter (Key / Value / Tip)',
    key: 'Key',
    value: 'Value',
    tip: 'Tip',
    client: 'Client',
    runConfig: 'Run Config',
    cacheRatio: 'Cache Hit Ratio',
    clusterTopology: 'Cluster Topology',
  },

  redisMemory: {
    hint: `
    <b>Remark：scan / memory usage / pipeline / type</b> <br/>
    Description: Use the scan method to scan all master nodes, searching for keys that match {matchParam}. Each scan processes {scanCount} keys, then uses the pipeline to batch send the memory usage command to obtain the memory size occupied, and records keys that are >= {sizeLimitKb}Kb. If the total number of scanned keys reaches {scanTotal} (a value less than or equal to 0 means scanning all) or the result count meets {countLimit}, the process returns. Otherwise, it sleeps for {sleepMillis}ms and continues scanning using the cursor.<br/> 
    Note: The memory usage command reports the number of bytes required for a key and its value to be stored in memory. The reported usage is the total memory allocation for a key and its value, including data and administrative overhead.
    `,
    total: 'Total',
    longTimeHint:
      'Are you sure to start memory analysis? It may take a long time, please be patient!',
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
    chooseKey: 'Detail',
  },

  redisMonitor: {
    monitorHint:
      'Monitor command may cause server blocking, use with caution in production environment !',
    monitorStarted: 'Monitor Started',
    monitorStopped: 'Monitor Stoped',
    clearMessage: 'Clear Message',
    keyword: 'Filter Command',
    monitorStart: 'Monitor',
    monitorStop: 'Unmonitor',
    time: 'DateTime',
    command: 'Command',
  },

  redisPubSub: {
    psubscribePatternHint:
      '<b>PSUBSCRIBE</b> command supports glob-style subscription patterns <br> Default * subscribes to all channels, Enter multiple patterns separated by spaces to subscribe at once<br/><br/>Examples:<br/>h?llo — subscribes to hello, hallo, and hxllo<br/>h*llo — subscribes to hllo and heeeello<br/>h[ae]llo — subscribes to hello and hallo, but not hillo<br/>news.* orders.* — subscribe to two prefixes',
    subscribeStarted: 'Subscribe Started',
    subscribeStopped: 'Subscribe Stopped',
    publishOk: 'Publish Success',
    subscribeChannel: 'Patterns, Space Separated',
    clearMessage: 'Clear Message',
    keyword: 'Filter (Channel / Message) ',
    subscribeStart: 'Subscribe',
    subscribeStop: 'Unsubscribe',
    datetime: 'DateTime',
    channel: 'Channel',
    message: 'Message',
    messageContent: 'Message Content',
    send: 'Publish',
  },

  redisSlow: {
    slowParam: 'Slow Param',
    slowerThanHint: 'slowlog-log-slower-than, default 10000 μs',
    slowerThan: 'Than',
    slowerMaxLenHint: 'slowlog-max-len, default 128',
    slowerMaxLen: 'Count',
    slowerGetCount: 'Limit',
    unit: '-',
    keyword: 'Filter (Command / Client / ClientName）',
    command: 'Command',
    cost: 'Cost',
    clientName: 'ClientName',
    time: 'DateTime',
    node: 'Node',
    client: 'Client',
    editSlowParam: 'Edit Slow Param',
    saveOk: 'Save Successful',
    slowerThanRequired: 'Threshold is required',
    slowerThanDisabled: 'Disabled',
    slowerThanRecordAll: 'Record all',
    slowerMaxLenRequired: 'Count is required',
  },

  redisTerminal: {
    broadcastHint: `
① When automatic broadcasting is enabled and no node is selected, commands such as CONFIG SET will be executed on all nodes<br>
② Usually there is no need to specify a node. Manual node specification is only required in special scenarios such as viewing the configuration of a specific node
    `,
    welcome: 'Welcome to {RedisME} Terminal',
    autoBroadcast: 'Auto Broadcast',
    readonlyHint: 'Executing commands is temporarily not supported in read-only mode',
    readonlyWriteHint: 'Write or non-readonly commands are not allowed in read-only mode',
    autoCopyHint: 'Auto Copy Command Result',

    commandHint: 'View Command List',
    commandTitle: 'Commands',
    keywordHint: 'Filter (Command or Summary)',
    group: 'Group',
    command: 'Command',
    usage: 'Usage',
    summary: 'Summary',
    since: 'Since',
    readonly: 'Read-only',
    readonlyYes: 'Yes',
    readonlyNo: 'No',
    keyShortHint: 'View KeyShort',
    keyShortMore: `
        <br> F11     : Full Screen
        <br> Enter   : Execute Command
        <br> Tab     : Command Completion
        <br> ↑  ↓    : History 
        <br>
        <br> Ctrl + L : Clear Screen
        <br> Ctrl + C : Clear Input
        <br> Ctrl + A : Move Cursor to line start
        <br> Ctrl + E : Move Cursor to line end
        <br>
        <br> clear : Clear Screen
        <br> help  : Help
        <br> open  : Open Website
    `,
  },

  redisValue: {
    optional: 'Optional',
    hashKey: 'HashKey',
    streamId: 'ID',
    ttlHint: 'Click to modify the key expiration time',
    ttlHintReadonly: 'Key expiration time',
    ttlForever: 'Forever',
    deleteKey: 'Delete Key',
    prettyHint:
      'Pretty is enabled by default. When enabled, it formats hash/list/set/json, etc. When disabled, it displays the raw value toString.',
    locationHint: 'View the cluster node where this key is located',
    locationTitle: 'Cluster Node',
    slotHint: 'View the cluster slot where the key is located',
    slotTitle: 'Cluster Slot',
    tableKeyword: 'Fuzzy Filter',
    insertRow: 'Insert Row',
    id: 'ID',
    key: 'Key',
    ttl: 'TTL',
    value: 'Value',
    score: 'Score',
    deleteConfirm: 'Delete ?',
    jsonView: 'JSON View',
    tableView: 'Table View',
    noKeySelected: 'No Key Selected',
    loadMore: 'Load More',
    loadAll: 'Load All',
    renameKey: 'Rename Key',
    refreshKey: 'Refresh Key',

    textMemory: 'Memory Usage: ',
    textLength: 'Bytes Length: ',
    textEntries: 'Entries: ',
    totalCount: 'Total Count: ',
    viewAs: 'Encoding',
    keyShortHint: 'View KeyShort',
    keyShortMore: `
        <br> F11       : Fullscreen Editor
        <br> Ctrl + L  : Toggle Line Wrap
        <br> Ctrl + N  : Toggle Line Numbers
        <br>
        <br> Ctrl + =  : Increase Font Size
        <br> Ctrl + -  : Decrease Font Size
        <br> Ctrl + 0  : Reset Font Size
        <br>
        <br> Ctrl + F  : Find
        <br> Ctrl + G  : Find Next
        <br> Ctrl + Z  : Undo
        <br> Ctrl + Y  : Redo
    `,
  },

  redisChart: {
    command: 'Commands / Sec',
    memory: 'Used Memory',
    networkIn: 'Network Input（Kb/s）',
    networkOut: 'Network Output（Kb/s）',

    keyTotal: 'Key Count',
    connectedClients: 'Connected Clients',
    cacheHitRatio: 'Cache Hit Ratio',
    totalConnectionsReceived: 'Total Connections Received',
    totalCommandsProcessed: 'Total Commands Processed',

    labelWidth: '120',
    autoRefresh: 'Auto Refresh',
    refreshInterval: 'Refresh Interval',
    refreshUnit: 's',
    keepMinutes: 'Keep Minutes',
    keepUnit: 'm',
    maxPointCount: 'Max Point Count',
    pointUnit: '',
    moreChart: 'More Charts',
  },

  keyMain: {
    keyword: 'Enter to Search',
    exactSearch: 'Exact Search',
    refreshKey: 'Refresh Key',
    addKey: 'Add Key',
    loadMore: 'Load More',
    loadAll: 'Load All',
    exporting: 'Exporting',
    exportDone: 'Export Done',
    exportResult: 'Success: {okCount}, Fail: {errCount}',
    importing: 'Importing',
    importDone: 'Import Done',
    importResult: 'Success: {okCount}, Fail: {errCount}, Ignore: {ignoreCount}',
    checkedMode: 'Checked Mode',

    mockData: 'Mock Data',
    exportData: 'Export Data',
    importData: 'Import Data',
    importCmd: 'Import Cmd',
    listView: 'List View',
    treeView: 'Tree View',
    sortByCount: 'Key Count',
    sortByAlphabet: 'Alphabet',

    exportChecked: 'Export Checked',
    ttlChecked: 'TTL Checked',
    deleteChecked: 'Delete Checked',
    exitCheckedMode: 'Exit Checked',
    batchDelete: 'Delete Keys',
    flushDb: 'Flush DB',
    flushDbConfirm: '【Danger】Confirm Flush DB ?',
    flushDbOk: 'Flush DB Done',
    editDbName: 'Custom DB Name (db{index})',
    editDbNamePlaceholder: 'input custom name',
    dbShowLimit: 'DB display limit',
  },

  ttlSet: {
    title: 'Update TTL',
    batchTitle: 'Batch Update TTL',
    key: 'Key',
    ttl: 'TTL (-1 means Forever)',
    quickSet: 'Quick Set',
    quick01: 'Forever',
    quick02: '10 Seconds',
    quick03: '1 Minute',
    quick04: '1 Hour',
    quick05: '1 Day',
    ttlOk: 'Set TTL Success',
    ttlOkBatch: 'Batch Set TTL Success',
    ttlRequired: 'Please input TTL',
    ttlValidator: '-1 (Forever) or positive integer',
  },

  // Stream Groups
  tableGroup: {
    name: 'Group Name',
    consumers: 'Consumers',
    pending: 'Pending',
    lastDeliveredId: 'Last Delivered Id',
    entriesRead: 'Entries Read',
    lag: 'Lag',
    consumerName: 'Consumer Name',
    consumerPending: 'Pending',
    consumerIdle: 'Idle (ms)',
  },

  // Backend error code translations
  errors: {
    connection_not_found: 'Connection {id} not found',
    connection_lock_timeout: 'Connection lock timeout, please try again later',
    sentinel_not_supported: 'SSH tunnel does not support sentinel mode',
    cluster_not_supported: 'SSH tunnel does not support cluster mode',
    key_not_found: 'Key "{key}" not found',
    key_node_not_found: 'Node not found for key "{key}"',
    key_already_exists: 'Key "{key}" already exists',
    key_type_unsupported: 'Unsupported value type: {value_type}',
    key_type_unknown: 'Unknown value type: {value_type}',
    field_not_found: 'Hash key "{hash_key}" not found',
    field_not_found_stream: 'Stream ID "{stream_id}" not found',
    field_operation_not_supported: 'Unsupported operation mode: {mode}',
    field_scan_not_supported: 'Field scan does not support type: {value_type}',
    invalid_node_format: 'Invalid node format: {node}',
    export_import_running: 'Export/Import task is already running',
    empty_key_list: 'Key list is empty',
    empty_parameters: 'Parameters cannot be empty',
    import_invalid_line: 'Invalid import line: {line}',
    ssh_key_file_empty: 'SSH private key file path is empty',
    ssh_login_method_not_supported: 'Unsupported SSH login method: {method}',
    ssh_auth_failed: 'SSH authentication failed',
    file_read_failed: 'File read failed: {filename} ({detail})',
    file_write_failed: 'File write failed: {filename} ({detail})',
  },
}
