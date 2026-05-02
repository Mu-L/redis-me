// 应用级通用工具；以下 `// #region` / `// #endregion` 可在 VS Code / Cursor 中折叠浏览。
import { openUrl } from '@tauri-apps/plugin-opener'
import { type } from '@tauri-apps/plugin-os'
import { relaunch } from '@tauri-apps/plugin-process'
import {
  check,
  type CheckOptions,
  type DownloadEvent,
  type Update,
} from '@tauri-apps/plugin-updater'
import { useClipboard, useDark } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElMessageBoxOptions } from 'element-plus'
import JSON5 from 'json5'
import { applyEdits, format } from 'jsonc-parser'
import { sampleSize, sortBy } from 'lodash'
import mitt from 'mitt'
import { computed, h } from 'vue'

import i18n from '@/locales'
import type {
  MeAppUpdateState,
  MeCommands,
  EnrichedRedisNode,
  KeyTypeListItem,
} from '@/types/me-interface'
import { commands as spectaCommands } from '@/types/tauri-specta'
import type { RedisKey_Deserialize, RedisNode } from '@/types/tauri-specta'

export type {
  EnrichedRedisNode,
  KeyTypeListItem,
  MeAppUpdateState,
  MeCommands,
} from '@/types/me-interface'

// #region 本文件内部类型（Specta / 应用错误载荷）
type SpectaResult<T> = { status: 'ok'; data: T } | { status: 'error'; error: unknown }

interface AppErrorPayload {
  code: string
  [key: string]: unknown
}
// #endregion

// #region 全局总线、常量、Redis 键类型与节点列表 enrich
// 全局事件总线：setup 直接导入，app 全局属性也添加
export const bus = mitt<Record<string, unknown>>()

// 常量
export const KEY_DELETE = 'KEY_DELETE'
export const KEY_REFRESH = 'KEY_REFRESH'
export const INFO_REFRESH = 'INFO_REFRESH'
export const CONN_REFRESH = 'CONN_REFRESH'
export const CONN_LIST_WINDOWS_SYNC = 'CONN_LIST_WINDOWS_SYNC'
export const TREE_KEY_ID_PREFIX = '_TREE_KEY_ID_PREFIX_'
export const DISPLAY_FORMAT = ['UTF8', 'Hex', 'Binary', 'Base64'] as const
// 预设颜色
export const PREDEFINE_COLORS = [
  '#409eff', // primary
  '#67c23a', // success
  '#e6a23c', // warning
  '#f56c6c', // danger
  '#909399', // info
] as const

// 键类型
export const KEY_TYPE_LIST: KeyTypeListItem[] = [
  { short: 'S', value: 'STRING', type: 'primary' },
  { short: 'H', value: 'HASH', type: 'primary' },
  { short: 'L', value: 'LIST', type: 'danger' },
  { short: 'E', value: 'SET', type: 'danger' },
  { short: 'Z', value: 'ZSET', type: 'danger' },
  { short: 'X', value: 'STREAM', type: 'warning' },
  { short: 'J', value: 'JSON', type: 'warning' },
]

const keyTypeMap = new Map(KEY_TYPE_LIST.map(item => [item.value, item.type]))
const keyShortMap = new Map(KEY_TYPE_LIST.map(item => [item.value, item.short]))

/**
 * 键类型：el-text, el-tag 的 type
 */
export function meType(keyType: string | undefined | null): string {
  return keyTypeMap.get(keyType?.toUpperCase() ?? '') || 'info'
}

/**
 * 键类型短：避免 String、Set 的简称都是 S
 */
export function meKeyShort(keyType: string | undefined | null, defaultValue = '?'): string {
  return keyShortMap.get(keyType?.toUpperCase() ?? '') || defaultValue
}

/**
 * 将 node_list 接口数据排序并补充与 UI 一致的字段。
 */
export function enrichNodeList(rawList: RedisNode[] | null | undefined): EnrichedRedisNode[] {
  if (!rawList?.length) return []
  const sorted = sortBy(rawList, 'node') as EnrichedRedisNode[]

  let masterIndex = 0
  const masterMap = new Map<string, { idx: number; slots: string | null }>()
  sorted.forEach(item => {
    item.isMaster = item.flags?.includes('master') ?? false
    item.isSlave = item.flags?.includes('slave') ?? false
    if (item.isMaster) {
      masterIndex++
      item.shortLabel = 'M' + masterIndex
      masterMap.set(item.node, { idx: masterIndex, slots: item.slots })
    }
  })
  sorted.forEach(item => {
    if (item.isSlave && item.slaveOfNode) {
      const master = masterMap.get(item.slaveOfNode)
      if (master) {
        item.shortLabel = 'S' + master.idx
        item.masterSlots = master.slots
      }
    }

    if (item.isMaster && item.slots) {
      item.slotsTooltip = t('nodeList.slotsTooltip', { slots: item.slots })
    } else if (item.isSlave && item.masterSlots) {
      item.slotsTooltip = t('nodeList.slotsReplicaTooltip', { slots: item.masterSlots })
    } else {
      item.slotsTooltip = ''
    }

    if (!item.shortLabel) {
      item.shortLabel = item.flags?.slice(0, 1).toUpperCase() || 'F'
    }
  })
  return sorted
}
// #endregion

// #region 开发日志、界面语言、暗色主题
const isDev = import.meta.env.DEV
const t = i18n.global.t

// 打印日志（仅开发环境）
export function meLog(...args: unknown[]): void {
  if (isDev) {
    console.log(...args)
  }
}

// 是否是中文模式
export const isZh = computed(() => {
  const language =
    meTauri.settings.language === 'system' ? meTauri.systemLanguage : meTauri.settings.language
  return language?.startsWith('zh') ?? false
})

// 是否黑色主题
export const isDark = useDark()
// #endregion

// #region Specta 命令包装（meCommands）
// 流程：Specta Result → 解包 → 成功则记日志并重置 EOF 计数；失败则 EOF 有限重试，否则弹窗（可静默）并抛出字符串化错误。
const SPECTA_EOF_MESSAGE = 'unexpected end of file'
/** 与原先 `spectaEofRetries <= 3` 一致：最多额外重试 4 次 */
const SPECTA_EOF_MAX_RETRY = 3

let spectaEofRetryCount = 0

function errString(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  try {
    return JSON.stringify(e)
  } catch {
    return Object.prototype.toString.call(e)
  }
}

/** 若 `errorStr` 为带 `code` 的应用错误 JSON 则走 i18n，否则原样返回（供弹窗） */
function formatSpectaErrorForUser(errorStr: string): string {
  try {
    const parsed = JSON.parse(errorStr) as unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('code' in parsed) ||
      typeof (parsed as AppErrorPayload).code !== 'string'
    ) {
      return errorStr
    }
    const { code, ...params } = parsed as AppErrorPayload
    const key = `errors.${code}`
    const message = t(key, params as Record<string, unknown>)
    return message === key ? `${code}: ${JSON.stringify(params)}` : message
  } catch {
    return errorStr
  }
}

function unwrapSpecta<T>(raw: SpectaResult<T>): T {
  if (raw.status === 'ok') return raw.data
  throw raw.error
}

async function invokeSpectaCommand<T>(
  name: string,
  args: readonly unknown[],
  run: () => Promise<SpectaResult<T>>,
  alert: boolean,
): Promise<T> {
  const t0 = Date.now()
  try {
    const data = unwrapSpecta(await run())
    meLog(`命令：${name}, 耗时：${Date.now() - t0}ms, 参数：`, args, '结果：', data)
    spectaEofRetryCount = 0
    return data
  } catch (e) {
    const msg = errString(e)
    if (msg === SPECTA_EOF_MESSAGE && spectaEofRetryCount <= SPECTA_EOF_MAX_RETRY) {
      spectaEofRetryCount++
      meLog(`第${spectaEofRetryCount}次重试：${name}`)
      return invokeSpectaCommand(name, args, run, alert)
    }
    if (alert) {
      const title = t('error') + (isDev ? ': ' + name : '')
      meErr(formatSpectaErrorForUser(msg), title)
    }
    meLog(`命令：${name}, 耗时：${Date.now() - t0}ms, 参数:`, args, `, 错误：${msg}`)
    throw msg
  }
}

type SpectaCommandFn = (...a: unknown[]) => Promise<SpectaResult<unknown>>

/** 与 Specta `commands` 同键；末尾多传 `false` 时失败不弹窗 */
function bindMeCommand(name: string, fn: unknown): unknown {
  if (typeof fn !== 'function') return fn
  const spectaFn = fn as SpectaCommandFn
  return (...args: unknown[]) => {
    const silent = args.length > 0 && args[args.length - 1] === false
    const pass = silent ? args.slice(0, -1) : args
    return invokeSpectaCommand(String(name), pass, () => spectaFn(...pass), !silent)
  }
}

export const meCommands = Object.fromEntries(
  Object.entries(spectaCommands).map(([name, fn]) => [name, bindMeCommand(name, fn)]),
) as MeCommands
// #endregion

// #region Element Plus 提示、确认框、剪贴板
export const DoNothing = (): void => {}

export function meOk(
  message: string,
  isAlert = false,
  title = '',
  options: Record<string, unknown> = {},
): void {
  if (isAlert) {
    const finalOptions = { type: 'success' as const, draggable: true, ...options }
    void ElMessageBox.alert(message, title || t('info'), finalOptions).then(DoNothing)
  } else {
    ElMessage.success(message)
  }
}

export function meWarn(message: string): void {
  ElMessage.warning(message)
}

export function meErr(message: string | Error, title: string = t('error')): void {
  const text = message instanceof Error ? message.message : message
  void ElMessageBox.alert(text, title, { type: 'error', draggable: true }).then(DoNothing)
}

export function meConfirm(
  message: string,
  thenFun: () => void | Promise<void>,
  boxOptions: ElMessageBoxOptions = {},
): void {
  ElMessageBox.confirm(message, boxOptions?.type === 'info' ? t('info') : t('warn'), {
    type: 'warning',
    ...boxOptions,
  })
    .then(thenFun)
    .catch(DoNothing)
}

export function mePrompt(
  message: string,
  options: ElMessageBoxOptions,
  thenFun: (result: { value: string }) => void | Promise<void>,
): void {
  ElMessageBox.prompt(message, options).then(thenFun).catch(DoNothing)
}

// 复制文本
export function meCopy(text: string, hintContent?: string, hint = true): void {
  void useClipboard({ legacy: true }).copy(text)
  if (hint) {
    meOk(hintContent || t('copyOk'))
  }
}
// #endregion

// #region 随机串、可读数量/时间、表格列过滤
const CHAR_ARRAY = Array.from('abcdefghigklmnopqrstuvwxyz0123456789')
export function meRandomString(n: number): string {
  return sampleSize(CHAR_ARRAY, n).join('')
}

const humanUnits = [
  { threshold: 1, symbol: 'B' },
  { threshold: 1024, symbol: 'K' },
  { threshold: 1024 ** 2, symbol: 'M' },
  { threshold: 1024 ** 3, symbol: 'G' },
  { threshold: 1024 ** 4, symbol: 'T' },
] as const

export function meHumanSize(size: number, zeroShow = '0B', fractionDigits = 2): string {
  if (!size) return zeroShow || ''

  for (let i = humanUnits.length - 1; i >= 0; i--) {
    const u = humanUnits[i]!
    if (size >= u.threshold) {
      const value = size / u.threshold
      return value.toFixed(fractionDigits) + u.symbol
    }
  }

  return size + 'B'
}

const humanNums = [
  { threshold: 1, symbol: '' },
  { threshold: 1000, symbol: 'K' },
  { threshold: 1000 ** 2, symbol: 'M' },
  { threshold: 1000 ** 3, symbol: 'B' },
] as const

export function meHumanNums(size: number, zeroShow = '0', fractionDigits = 2): string {
  if (!size) return zeroShow || ''

  for (let i = humanNums.length - 1; i >= 0; i--) {
    const u = humanNums[i]!
    if (size >= u.threshold) {
      const value = size / u.threshold
      return value.toFixed(fractionDigits) + u.symbol
    }
  }

  return String(size)
}

export function meHumanSeconds(seconds: number | undefined | null): string | number {
  if (seconds === undefined || seconds === null) return '-'
  if (seconds <= 0) return seconds

  let rest = seconds
  const days = Math.floor(rest / (3600 * 24))
  rest %= 3600 * 24

  const hours = Math.floor(rest / 3600)
  rest %= 3600

  const minutes = Math.floor(rest / 60)
  rest %= 60

  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(rest).padStart(2, '0')

  let result = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
  if (days > 0) {
    result = `${days}${t('util.days', days)} ${result}`
  }
  return result
}

export function meTtlSeconds(intValue: number, unit: string): number {
  if (intValue === -1) return -1
  if (unit === 'second') return intValue
  if (unit === 'minute') return intValue * 60
  if (unit === 'hour') return intValue * 60 * 60
  if (unit === 'day') return intValue * 60 * 60 * 24
  return intValue
}

export function meFilterHandler<T extends Record<string, unknown>>(
  value: unknown,
  row: T,
  column: { property?: string },
): boolean {
  const property = column.property
  if (!property) return false
  return row[property] === value
}
// #endregion

// #region Redis 键：删除 / 重命名（组合确认框与 meCommands）
export function meDeleteKey(id: string, redisKey: RedisKey_Deserialize, thenFn?: () => void): void {
  meConfirm(t('util.deleteKey', { key: redisKey.key }), async () => {
    await meCommands.del(id, redisKey)
    bus.emit(KEY_DELETE, redisKey)
    meOk(t('deleteOk'))
    thenFn?.()
  })
}

export function meRenameKey(id: string, redisKey: RedisKey_Deserialize, encoding = 'utf8'): void {
  const message =
    encoding === 'utf8'
      ? t('util.renameKey')
      : t('util.renameKey') + ' (' + String(encoding).toUpperCase() + ')'
  const inputValue = encoding === 'utf8' ? redisKey.key : meFormatBytes(redisKey.bytes, encoding)

  mePrompt(
    message,
    {
      inputValue,
      inputType: 'text',
      inputValidator: (value: string) => {
        if (!value || value.trim() === '') {
          return t('util.valueRequired')
        }
        if (encoding !== 'utf8') {
          try {
            meToBase64(value, encoding)
          } catch (e) {
            return errString(e)
          }
        }
        return true
      },
    },
    async ({ value }) => {
      let newKey: RedisKey_Deserialize
      if (encoding === 'utf8') {
        newKey = { key: value, bytes: '' }
      } else {
        newKey = { key: '', bytes: meToBase64(value, encoding) }
      }

      const apiNewKey = await meCommands.rename(id, redisKey, newKey)

      redisKey.key = apiNewKey.key
      redisKey.bytes = apiNewKey.bytes
      meOk(t('actionOk'))
    },
  )
}
// #endregion

// #region 应用内自动更新（Tauri updater）
export async function meCheckUpdate(
  quiet = true,
  checkOptions: CheckOptions = {},
  app: MeAppUpdateState,
): Promise<void> {
  if (window?.meTauri?.isAppStore) {
    meLog('应用商店内部的应用更新，忽略检查接口')
    return
  }

  if (!quiet) {
    ElMessage.primary(t('util.checking'))
  }

  const update = await check(checkOptions).catch(DoNothing)
  if (update) {
    await meDownloadUpdate(quiet, update, app)
  } else if (update === null) {
    if (!quiet) {
      ElMessage.success(t('util.latestVersion'))
    }
  } else {
    if (!quiet) {
      ElMessage.error(t('util.checkUpdateErr'))
    }
  }
}

const manualCloseOptions: ElMessageBoxOptions = {
  closeOnClickModal: false,
  closeOnPressEscape: false,
  type: 'info',
}

export async function meDownloadUpdate(
  quiet = true,
  update: Update,
  app: MeAppUpdateState,
): Promise<void> {
  meLog('检查结果:', update)
  const hint = t('util.updateHint', { version: update.version })
  const changelog = t('util.changelog')
  const changelogUrl = t('util.changelogUrl')
  const message = () =>
    h('p', null, [
      h('span', hint),
      h(
        'a',
        {
          href: changelogUrl,
          target: '_blank',
          style: 'color: var(--el-color-primary); text-decoration: none; margin-left: 5px; ',
          onClick: (e: MouseEvent) => {
            e.preventDefault()
            void openUrl(changelogUrl)
          },
        },
        changelog,
      ),
    ])

  meConfirm(
    'MessageInvalid',
    async () => {
      try {
        app.downloading = true
        app.downloadPercentage = 0

        let downloaded = 0
        let contentLength = 0
        const downloadingHandle = (event: DownloadEvent) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength ?? 0
              break
            case 'Progress':
              downloaded += event.data.chunkLength
              app.downloadPercentage = contentLength
                ? Math.round((downloaded / contentLength) * 100)
                : 0
              break
            case 'Finished':
              app.downloadPercentage = 100
              break
          }
        }

        const isWindows = type() === 'windows'
        if (isWindows) {
          await update.download(downloadingHandle)
          meConfirm(t('util.downloadDown'), async () => await update.install(), manualCloseOptions)
        } else {
          await update.downloadAndInstall(downloadingHandle)
          meConfirm(t('util.updateDone'), async () => await relaunch(), manualCloseOptions)
        }
      } catch (e) {
        meErr(t('util.updateErr', { message: errString(e) }))
      } finally {
        app.downloading = false
      }
    },
    { ...manualCloseOptions, message },
  )
}
// #endregion

// #region sleep、JSON 格式化与解析
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function meJsonFormat(jsonString: string): string {
  return applyEdits(jsonString, format(jsonString, undefined, { insertSpaces: true, tabSize: 2 }))
}

export function meJsonParse(jsonString: string | null | undefined): unknown {
  if (!jsonString) return null
  if (jsonString === 'undefined') return null
  if (jsonString === 'null') return null
  return JSON5.parse(jsonString)
}

export function meJsonNormal(jsonString: string): string {
  return JSON.stringify(JSON5.parse(jsonString), null, 2)
}
// #endregion

// #region Base64 / Hex / Binary 展示与互转（键编辑等）
export function meFormatBytes(base64: string, displayFormat: string): string {
  if (displayFormat === 'base64') return base64
  if (displayFormat === 'hex') return base64ToHex(base64)
  if (displayFormat === 'binary') return base64ToBinary(base64)
  return 'Unknown displayFormat: ' + displayFormat
}

export function meToBase64(bytes: string, encoding: string): string {
  if (encoding === 'base64') return bytes
  if (encoding === 'hex') return hexToBase64(bytes)
  if (encoding === 'binary') return binaryToBase64(bytes)
  return 'Unknown encoding: ' + encoding
}

function base64ToHex(base64: string): string {
  if (!base64) return ''
  const binary = atob(base64)
  return Array.from(binary)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}

function base64ToBinary(base64: string): string {
  if (!base64) return ''
  const binary = atob(base64)
  return Array.from(binary)
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('')
}

function hexToBase64(hex: string): string {
  if (!hex) return ''
  if (hex.length % 2 !== 0) {
    throw new Error(t('util.invalidHexString'))
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(t('util.invalidHexCharacter'))
  }
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    const byte = Number.parseInt(hex.slice(i, i + 2), 16)
    if (Number.isNaN(byte)) {
      throw new Error(t('util.invalidHexCharacter'))
    }
    bytes.push(byte)
  }
  const binary = bytes.map(b => String.fromCharCode(b)).join('')
  return btoa(binary)
}

function binaryToBase64(binary: string): string {
  if (!binary) return ''
  if (binary.length % 8 !== 0) {
    throw new Error(t('util.invalidBinaryString'))
  }
  if (!/^[01]+$/.test(binary)) {
    throw new Error(t('util.invalidBinaryCharacter'))
  }
  const bytes: number[] = []
  for (let i = 0; i < binary.length; i += 8) {
    const byte = Number.parseInt(binary.slice(i, i + 8), 2)
    if (Number.isNaN(byte)) {
      throw new Error(t('util.invalidBinaryCharacter'))
    }
    bytes.push(byte)
  }
  const binaryStr = bytes.map(b => String.fromCharCode(b)).join('')
  return btoa(binaryStr)
}
// #endregion
