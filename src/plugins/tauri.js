import {
  appConfigDir,
  appDataDir,
  appLocalDataDir,
  appLogDir,
  BaseDirectory,
} from '@tauri-apps/api/path'
import { Window } from '@tauri-apps/api/window'
import { exists } from '@tauri-apps/plugin-fs'
import { openUrl } from '@tauri-apps/plugin-opener'
import { locale } from '@tauri-apps/plugin-os'
import { LazyStore } from '@tauri-apps/plugin-store'

import { meLog } from '@/utils/util.js'

// 打包后关闭右键菜单
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', event => event.preventDefault())
}

// 系统主题、语言、存储等
const systemTheme = await new Window('main').theme()
const systemLanguage = (await locale())?.replace('-', '') || 'en' // // zh-CN ==> zhCN
meLog('系统主题:', systemTheme, '系统语言:', systemLanguage)

// 数据目录，判断是否在微软应用商店
const configDir = await appConfigDir()
const dataDir = await appDataDir()
const logDir = await appLogDir()
const localDataDir = await appLocalDataDir()
meLog('配置目录:', configDir) // C:\Users\he_pe\AppData\Roaming\com.hepengju.redis
meLog('日志目录:', logDir)
meLog('数据目录:', dataDir)
meLog('本地数据目录:', localDataDir)

// 应用商店里面的更新依赖应用商店自身的更新机制
// 微软应用商店示例: C:\Program Files\WindowsApps\hepengju.RedisME_1.2.0.0_x64__v2a7j12f6a642\VFS\Local AppData\RedisME
// const isAppStore = configDir.includes('WindowsApps')
// 实测VFS文件系统中读取不到原始目录，修改判断方式为: resources目录下是否存在appStore.me文件
// 改为AppData下读取 ==> 目前测试下来还是不行
const isAppStore = await exists('appStore.txt', { baseDir: BaseDirectory.AppData })
meLog('应用商店应用(AppData目录下appStore.txt):', isAppStore)

// 存储及初始化数据读取
const store = new LazyStore('store.json')
const connList = (await store.get('connList')) || []
meLog('读取连接:', connList)
checkConnList(connList) // 初始化的时候就检查1次，以便兼容旧版本数据

const storeSettings = await store.get('settings')
meLog('读取设置:', storeSettings)
const initSettings = {
  language: 'system',
  theme: 'system',
  uiFont: [],
  codeFont: [],
  autoUpdate: true,

  // 扩展设置
  keyScanCount: 1000,
  fieldScanCount: 20,
  keyShow: 'tree',
  keySort: 'count',
  keyHeight: 20,
  keyLabel: 'short',
}
const settings = { ...initSettings, ...storeSettings }
const meTauri = reactive({
  // 响应式，自动保存
  connList,
  settings,

  // 纯记录
  systemTheme,
  systemLanguage,
  isAppStore,
})
// 放在Window全局变量中方便使用
window.meTauri = meTauri

// window.open不能用，修改为tauri的openUrl
try {
  window.open = openUrl
} catch {}

// 配置保存
watch(meTauri, async newValue => {
  meLog('持久化连接和设置')
  await store.set('connList', newValue.connList)
  await store.set('settings', newValue.settings)
})

export function checkConnList(connList) {
  connList.forEach(conn => {
    // v1.6.0 兼容旧版本，补充哨兵模式属性;
    // v2.7.0 属性移动到sentinelOption中
    if (!('sentinel' in conn) || typeof conn.sentinel != 'boolean') conn.sentinel = false
    if (!('sentinelOption' in conn))
      conn.sentinelOption = { masterName: '', masterUsername: '', masterPassword: '' }

    if (!conn.sentinelOption.masterName && conn.masterName)
      conn.sentinelOption.masterName = conn.masterName
    if (!conn.sentinelOption.masterUsername && conn.masterUsername)
      conn.sentinelOption.masterUsername = conn.masterUsername
    if (!conn.sentinelOption.masterPassword && conn.masterPassword)
      conn.sentinelOption.masterPassword = conn.masterPassword
    if ('masterName' in conn) delete conn.masterName
    if ('masterUsername' in conn) delete conn.masterUsername
    if ('masterPassword' in conn) delete conn.masterPassword

    // v2.5.0 兼容旧版本，补充meta属性
    if (!('meta' in conn)) conn.meta = {}

    // v2.7.0 兼容旧版本，补充SSH属性
    if (!('ssh' in conn) || typeof conn.ssh != 'boolean') conn.ssh = false
    if (!('sshOption' in conn))
      conn.sshOption = {
        host: '',
        port: 22,
        loginType: 'pwd', // pwd 用户名/密码, pkfile 私钥文件
        username: '',
        password: '',
        pkfile: '', // 私钥文件
        passphrase: '', // 私钥密码
      }
  })
}

export default function (_app) {}
