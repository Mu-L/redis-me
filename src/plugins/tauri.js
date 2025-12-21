import {Window} from '@tauri-apps/api/window'
import {locale} from '@tauri-apps/plugin-os'
import {LazyStore} from '@tauri-apps/plugin-store'

// 打包后关闭右键菜单
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', event => event.preventDefault())
}

// 系统主题、语言、存储等
const systemTheme = await new Window('main').theme()
const systemLanguage = (await locale())?.replace('-', '') || 'en' // // zh-CN ==> zhCN
console.log('系统主题:', systemTheme, '系统语言:', systemLanguage)

// 存储及初始化数据读取
const store = new LazyStore('store.json')
const connList = await store.get('connList') || []
const storeSettings = await store.get('settings')
const initSettings =  { language: 'system', theme: 'system', uiFont: [], codeFont: [], autoUpdate: true, updateSource: 'github' }
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
watch(meTauri.connList, async (newValue) => await store.set('connList', newValue))
watch(meTauri.settings, async (newValue) => await store.set('settings', newValue))

export default function (app) {}
