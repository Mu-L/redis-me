import { Window } from '@tauri-apps/api/window'
import { openUrl } from '@tauri-apps/plugin-opener'
import { locale } from '@tauri-apps/plugin-os'
import { LazyStore } from '@tauri-apps/plugin-store'
import { reactive, watch } from 'vue'
import type { App } from 'vue'

import { commands, type ConnConfig } from '@/types/tauri-specta'
import { meLog } from '@/utils/util'

/** 本地 store / 旧版数据：字段可能缺失，或含已迁移的扁平哨兵字段 */
type ConnFromStore = { [K in keyof ConnConfig]?: ConnConfig[K] } & Record<string, unknown>

// 打包后关闭右键菜单
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', event => event.preventDefault())
}

// 系统主题、语言、存储等
const systemTheme = (await new Window('main').theme()) ?? 'light'
const systemLanguage = (await locale())?.replace('-', '') || 'en' // // zh-CN ==> zhCN
meLog('系统主题:', systemTheme, '系统语言:', systemLanguage)

// 应用商店安装时禁用内置升级，改由各商店 / 系统更新管道负责
const isAppStore = await commands.isAppStore()
meLog('应用商店安装:', isAppStore)

// 存储及初始化数据读取
const store = new LazyStore('store.json')
const connList = ((await store.get('connList')) as ConnFromStore[] | null | undefined) ?? []
meLog('读取连接:', connList)
checkConnList(connList) // 初始化的时候就检查1次，以便兼容旧版本数据

const rawSettings = await store.get('settings')
meLog('读取设置:', rawSettings)
const storeSettings =
  rawSettings !== null && typeof rawSettings === 'object' && !Array.isArray(rawSettings)
    ? (rawSettings as Record<string, unknown>)
    : {}
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
  fieldShow: 'auto', // 'auto' 初始 JSON、手动切换后沿用 | 'table' 优先表格
  fieldShowView: 'json', // auto 模式下上次手动选择的 json/table，持久化供切换连接沿用
  // 首页连接分组（见 src/utils/conn-group.ts）
  connShow: 'flat', // 'flat' | 'group'
  connGroups: [] as string[], // 分组名有序列表
  connGroupExpanded: {} as Record<string, boolean>, // 分组折叠状态，键为分组名（''=默认分组）
}
const settings = { ...initSettings, ...storeSettings }
if (settings.fieldShow !== 'auto' && settings.fieldShow !== 'table') settings.fieldShow = 'auto'
if (settings.fieldShowView !== 'json' && settings.fieldShowView !== 'table')
  settings.fieldShowView = 'json'
// delete settings.keyLabel // v3.5+ 移除键名称全称/简称，统一简称
if (!Array.isArray(settings.connGroups)) settings.connGroups = []
if (settings.connShow !== 'flat' && settings.connShow !== 'group') settings.connShow = 'flat'
if (
  !settings.connGroupExpanded ||
  typeof settings.connGroupExpanded !== 'object' ||
  Array.isArray(settings.connGroupExpanded)
) {
  settings.connGroupExpanded = {}
}
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
window.meTauri = meTauri as MeTauriGlobal

// window.open不能用，修改为tauri的openUrl
try {
  window.open = openUrl as unknown as typeof window.open
} catch {}

// 配置保存
watch(meTauri, async newValue => {
  meLog('持久化连接和设置')
  await store.set('connList', newValue.connList)
  await store.set('settings', newValue.settings)
})

export function checkConnList(connList: ConnFromStore[]): void {
  connList.forEach(conn => {
    // v1.6.0 兼容旧版本，补充哨兵模式属性;
    // v2.7.0 属性移动到sentinelOption中
    if (!('sentinel' in conn) || typeof conn.sentinel != 'boolean') conn.sentinel = false
    if (!conn.sentinelOption)
      conn.sentinelOption = { masterName: '', masterUsername: '', masterPassword: '' }
    const so = conn.sentinelOption

    const legacyMasterName = conn['masterName']
    const legacyMasterUsername = conn['masterUsername']
    const legacyMasterPassword = conn['masterPassword']
    if (typeof legacyMasterName === 'string' && !so.masterName) so.masterName = legacyMasterName
    if (typeof legacyMasterUsername === 'string' && !so.masterUsername)
      so.masterUsername = legacyMasterUsername
    if (typeof legacyMasterPassword === 'string' && !so.masterPassword)
      so.masterPassword = legacyMasterPassword
    if ('masterName' in conn) delete conn.masterName
    if ('masterUsername' in conn) delete conn.masterUsername
    if ('masterPassword' in conn) delete conn.masterPassword

    // v2.5.0 兼容旧版本，补充meta属性
    if (!('meta' in conn) || typeof conn.meta !== 'object' || conn.meta === null) conn.meta = {}
    const meta = conn.meta as Record<string, unknown>
    const group = meta['group']
    if (group !== undefined && typeof group !== 'string') delete meta['group']
    else if (typeof group === 'string') meta['group'] = group.trim()

    // v2.7.0 兼容旧版本，补充SSH属性
    if (!('ssh' in conn) || typeof conn.ssh != 'boolean') conn.ssh = false
    if (!conn.sshOption)
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

export default function setupTauri(_app: App): void {}
