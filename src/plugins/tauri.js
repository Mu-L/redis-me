import {Window} from '@tauri-apps/api/window'
import {locale} from '@tauri-apps/plugin-os'
import {LazyStore} from '@tauri-apps/plugin-store'
import {appConfigDir, appDataDir, appLocalDataDir, appLogDir, BaseDirectory} from '@tauri-apps/api/path'
import {meLog} from '@/utils/util.js'
import {exists} from '@tauri-apps/plugin-fs'

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
const isAppStore = await exists('isAppStore.me', {baseDir: BaseDirectory.AppLocalData})
meLog('应用商店应用:', isAppStore, '(isAppStore.me)')

// 存储及初始化数据读取
const store = new LazyStore('store.json')
const connList = await store.get('connList') || []
meLog('读取连接:', connList)
const storeSettings = await store.get('settings')
meLog('读取设置:', storeSettings)
const initSettings =  { language: 'system', theme: 'system', uiFont: [], codeFont: [], autoUpdate: true }
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

// 配置保存
watch(meTauri, async (newValue) => {
  await store.set('connList', newValue.connList)
  await store.set('settings', newValue.settings)
})
export default function (app) {}
