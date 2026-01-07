import {Window} from '@tauri-apps/api/window'
import {locale} from '@tauri-apps/plugin-os'
import {LazyStore} from '@tauri-apps/plugin-store'
import {appConfigDir, appDataDir, appLogDir} from '@tauri-apps/api/path'
import {meLog} from '@/utils/util.js'

// 打包后关闭右键菜单
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', event => event.preventDefault())
}

// 系统主题、语言、存储等
const systemTheme = await new Window('main').theme()
const systemLanguage = (await locale())?.replace('-', '') || 'en' // // zh-CN ==> zhCN
meLog('系统主题:', systemTheme, '系统语言:', systemLanguage)

// 数据目录，判断是否在微软应用商店
// C:\Users\he_pe\AppData\Roaming\com.hepengju.redis
const configDir = await appConfigDir()
const dataDir = await appDataDir()
const logDir = await appLogDir()
meLog('配置目录:', configDir)
meLog('数据目录:', dataDir)
meLog('日志目录:', logDir)

// 存储及初始化数据读取
const store = new LazyStore('store.json')
const connList = await store.get('connList') || []
meLog('读取连接:', connList)
const storeSettings = await store.get('settings')
meLog('读取设置:', storeSettings)
const initSettings =  { language: 'system', theme: 'system', uiFont: [], codeFont: [], autoUpdate: true }
const settings = { ...initSettings, ...storeSettings }
const meTauri = reactive({
  systemTheme,
  systemLanguage,
  connList,
  settings,
})
// 放在Window全局变量中方便使用
window.meTauri = meTauri

// 配置保存
watch(meTauri, async (newValue) => {
  await store.set('connList', newValue.connList)
  await store.set('settings', newValue.settings)
})
export default function (app) {}
