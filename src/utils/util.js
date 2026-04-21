import { invoke } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'
import { type } from '@tauri-apps/plugin-os'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useClipboard, useDark } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import JSON5 from 'json5'
import { applyEdits, format } from 'jsonc-parser'
import { sampleSize } from 'lodash'
import mitt from 'mitt'

import i18n from '@/locales'

// 全局事件总线：setup 直接导入，app 全局属性也添加
export const bus = mitt()

// 常量
export const KEY_DELETE = 'KEY_DELETE'
export const KEY_REFRESH = 'KEY_REFRESH'
export const INFO_REFRESH = 'INFO_REFRESH'
export const CONN_REFRESH = 'CONN_REFRESH'
export const CONN_LIST_WINDOWS_SYNC = 'CONN_LIST_WINDOWS_SYNC'
export const TREE_KEY_ID_PREFIX = '_TREE_KEY_ID_PREFIX_'
export const DISPLAY_FORMAT = ['UTF8', 'Hex', 'Binary', 'Base64']
// 预设颜色
export const PREDEFINE_COLORS = [
  '#409eff', // primary
  '#67c23a', // success
  '#e6a23c', // warning
  '#f56c6c', // danger
  '#909399', // info
]

// 键类型
export const KEY_TYPE_LIST = [
  //{ value: 'ALL'   , type: 'info'},
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
export function meType(keyType) {
  return keyTypeMap.get(keyType?.toUpperCase()) || 'info'
}

/**
 * 键类型短：避免 String、Set 的简称都是 S
 */
export function meKeyShort(keyType, defaultValue = '?') {
  return keyShortMap.get(keyType?.toUpperCase()) || defaultValue
}

// 是否开发模式
const isDev = import.meta.env.DEV
const t = i18n.global.t

// 打印日志（仅开发环境）
export function meLog(...args) {
  if (isDev) {
    console.log(...args)
  }
}

// 是否是中文模式
export const isZh = computed(() => {
  const language =
    meTauri.settings.language === 'system' ? meTauri.systemLanguage : meTauri.settings.language
  return language?.startsWith('zh')
})

// 是否黑色主题
export const isDark = useDark()

// ~~~~~~~~~~~~~ 后端错误码国际化处理
/**
 * 尝试解析后端 AppError JSON
 */
function tryParseAppError(errorStr) {
  try {
    const parsed = JSON.parse(errorStr)
    if (parsed && typeof parsed.code === 'string') {
      return parsed
    }
  } catch {
    // 不是 JSON 格式
  }
  return null
}

/**
 * 翻译 AppError 为用户可见的消息
 */
function translateAppError(appError) {
  const { code, ...params } = appError
  const translationKey = `errors.${code}`
  const message = t(translationKey, params)
  // 如果找不到翻译，返回 code + 参数
  if (message === translationKey) {
    return `${code}: ${JSON.stringify(params)}`
  }
  return message
}

// invoke 命令：打印日志
let retryCount = 0
export async function meInvoke(command, params, alert = true) {
  const start = Date.now()
  try {
    const data = await invoke(command, params)
    const end = Date.now()
    meLog(`命令：${command}, 耗时：${end - start}ms, 参数：`, params, '结果：', data)
    retryCount = 0 // 一旦调用成功则重置重试次数
    return data
  } catch (e) {
    const end = Date.now()
    const error = e.toString()
    // 客户端断开后的自动重连 (后端处理大部分，前端仅处理立刻的场景，优化用户体验。避免无限递归，最多重试 3 次)
    if (error === 'unexpected end of file') {
      if (retryCount <= 3) {
        retryCount++
        meLog(`第${retryCount}次重试：${command}`)
        return await meInvoke(command, params, alert)
      }
    }

    if (alert) {
      // 尝试解析为结构化错误（AppError JSON）
      const appError = tryParseAppError(error)
      if (appError) {
        // 使用 i18n 翻译错误
        meErr(translateAppError(appError), t('error') + (isDev ? ': ' + command : ''))
      } else {
        // 回退到原始错误消息
        meErr(error, t('error') + (isDev ? ': ' + command : ''))
      }
    }

    meLog(`命令：${command}, 耗时：${end - start}ms, 参数:`, params, `, 错误：${error}`)
    throw error
  }
}

// ~~~~~~~~~~~~~确认、提示、错误
export const DoNothing = () => {}

export function meOk(message, isAlert = false, title = '', options = {}) {
  if (isAlert) {
    // 提示后不消失（适用于长时间运行的任务）
    const finalOptions = { type: 'success', draggable: true, ...options }
    void ElMessageBox.alert(message, title || t('info'), finalOptions).then(DoNothing)
  } else {
    // 提示后自动消失
    ElMessage.success(message)
  }
}

export function meWarn(message) {
  ElMessage.warning(message)
}

export function meErr(message, title = t('error')) {
  if (message instanceof Error) {
    message = message.message
  }
  void ElMessageBox.alert(message, title, { type: 'error', draggable: true }).then(DoNothing)
}

export function meConfirm(message, thenFun, boxOptions = {}) {
  ElMessageBox.confirm(message, boxOptions?.type === 'info' ? t('info') : t('warn'), {
    type: 'warning',
    ...boxOptions,
  })
    .then(thenFun)
    .catch(DoNothing)
}

export function mePrompt(message, options, thenFun) {
  ElMessageBox.prompt(message, options).then(thenFun).catch(DoNothing)
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// 复制文本
export function meCopy(text, hintContent, hint = true) {
  void useClipboard({ legacy: true }).copy(text)
  if (hint) {
    meOk(hintContent || t('copyOk'))
  }
}

// 随机 N 个字符
const CHAR_ARRAY = Array.from('abcdefghigklmnopqrstuvwxyz0123456789')
export function meRandomString(n) {
  return sampleSize(CHAR_ARRAY, n).join('')
}

// 人类可读的大小
const humanUnits = [
  { threshold: 1, symbol: 'B' },
  { threshold: 1024, symbol: 'K' },
  { threshold: 1024 ** 2, symbol: 'M' },
  { threshold: 1024 ** 3, symbol: 'G' },
  { threshold: 1024 ** 4, symbol: 'T' },
]
export function meHumanSize(size, zeroShow = '0B', fractionDigits = 2) {
  if (!size) return zeroShow || ''

  // 从大到小查找合适的单位
  for (let i = humanUnits.length - 1; i >= 0; i--) {
    if (size >= humanUnits[i].threshold) {
      const value = size / humanUnits[i].threshold
      return value.toFixed(fractionDigits) + humanUnits[i].symbol
    }
  }

  return size + 'B' // 小于 1KB 的情况
}

// 人类可读的大小
const humanNums = [
  { threshold: 1, symbol: '' },
  { threshold: 1000, symbol: 'K' },
  { threshold: 1000 ** 2, symbol: 'M' },
  { threshold: 1000 ** 3, symbol: 'B' },
]
export function meHumanNums(size, zeroShow = '0', fractionDigits = 2) {
  if (!size) return zeroShow || ''

  // 从大到小查找合适的单位
  for (let i = humanNums.length - 1; i >= 0; i--) {
    if (size >= humanNums[i].threshold) {
      const value = size / humanNums[i].threshold
      return value.toFixed(fractionDigits) + humanNums[i].symbol
    }
  }

  return size // 小于 1000 的情况
}

// w 天 xx:yy:zz 的格式
export function meHumanSeconds(seconds) {
  if (seconds === undefined || seconds === null) return '-'
  if (seconds <= 0) return seconds

  const days = Math.floor(seconds / (3600 * 24)) // 计算天数
  seconds %= 3600 * 24 // 计算剩余秒数

  const hours = Math.floor(seconds / 3600)
  seconds %= 3600

  const minutes = Math.floor(seconds / 60)
  seconds %= 60

  // 确保小时、分钟和秒数是两位数显示
  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  // 组合结果
  let result = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
  if (days > 0) {
    result = `${days}${t('util.days', days)} ${result}`
  }
  return result
}

// 时间单位转换为秒
export function meTtlSeconds(intValue, unit) {
  if (intValue === -1) return -1
  if (unit === 'second') return intValue
  if (unit === 'minute') return intValue * 60
  if (unit === 'hour') return intValue * 60 * 60
  if (unit === 'day') return intValue * 60 * 60 * 24
}

// 表格根据属性过滤
export function meFilterHandler(value, row, column) {
  const property = column.property
  return row[property] === value
}

// 删除键
export function meDeleteKey(id, redisKey, thenFn) {
  meConfirm(t('util.deleteKey', { key: redisKey.key }), async () => {
    await meInvoke('del', { id, key: redisKey })
    bus.emit(KEY_DELETE, redisKey)
    meOk(t('deleteOk'))
    if (thenFn) {
      thenFn()
    }
  })
}

// 重命名键
export function meRenameKey(id, redisKey, encoding = 'utf8') {
  let message =
    encoding === 'utf8'
      ? t('util.renameKey')
      : t('util.renameKey') + ' (' + encoding.toUpperCase() + ')'
  let inputValue = encoding === 'utf8' ? redisKey.key : meFormatBytes(redisKey.bytes, encoding)

  mePrompt(
    message,
    {
      inputValue,
      inputType: 'text',
      inputValidator: value => {
        if (!value || value.trim() === '') {
          return t('util.valueRequired')
        }
        // 非 UTF8 编码时检查 meToBase64 是否有报错
        if (encoding !== 'utf8') {
          try {
            meToBase64(value, encoding)
          } catch (e) {
            return e.message
          }
        }
        return true
      },
    },
    async ({ value }) => {
      let newKey
      if (encoding === 'utf8') {
        newKey = { key: value, bytes: '' }
      } else {
        newKey = { key: '', bytes: meToBase64(value, encoding) }
      }

      const params = { id, key: redisKey, newKey }
      const apiNewKey = await meInvoke('rename', params)

      // 注意此处不要整个替换，逐个替换可以保证左侧的键列表也实时修改
      redisKey.key = apiNewKey.key
      redisKey.bytes = apiNewKey.bytes
      meOk(t('actionOk'))
    },
  )
}

// 检查更新
export async function meCheckUpdate(quiet = true, checkOptions = {}, app) {
  if (window?.meTauri?.isAppStore) {
    meLog('应用商店内部的应用更新，忽略检查接口')
    return
  }

  if (!quiet) {
    ElMessage.primary(t('util.checking'))
  }

  // 判断是否获得检查更新结果
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

const manualCloseOptions = { closeOnClickModal: false, closeOnPressEscape: false, type: 'info' }
export async function meDownloadUpdate(quiet = true, update, app) {
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
          onClick: e => {
            e.preventDefault()
            void openUrl(changelogUrl) // a 和 el-link 都无法打开外部链接，使用 openUrl 可以
          },
        },
        changelog,
      ),
    ])

  // 更新过程中的提示：避免 Esc 及点击遮罩层关闭提示框
  meConfirm(
    'MessageInvalid',
    async () => {
      try {
        app.downloading = true
        app.downloadPercentage = 0

        let downloaded = 0
        let contentLength = 0
        const downloadingHandle = event => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength
              // console.log(`downloadAppSize: ${meHumanSize(event.data.contentLength)}`)
              break
            case 'Progress':
              downloaded += event.data.chunkLength
              app.downloadPercentage = Math.round((downloaded / contentLength) * 100)
              //console.log(`downloaded ${downloaded} from ${contentLength}`)
              break
            case 'Finished':
              app.downloadPercentage = 100
              //console.log('download finished')
              break
          }
        }

        // 在 Windows 上，由于 Windows 安装程序的限制，应用程序在执行安装步骤时将自动退出。Mac 等其他系统，下载和安装都可以在后台运行
        const isWindows = type() === 'windows'
        if (isWindows) {
          await update.download(downloadingHandle)
          meConfirm(t('util.downloadDown'), async () => await update.install(), manualCloseOptions)
        } else {
          await update.downloadAndInstall(downloadingHandle)
          meConfirm(t('util.updateDone'), async () => await relaunch(), manualCloseOptions)
        }
      } catch (e) {
        meErr(t('util.updateErr', { message: e.message }))
      } finally {
        app.downloading = false
      }
    },
    { ...manualCloseOptions, message },
  )
}

// 休眠
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 支持注释等非标格式（vscode 同款）- genericFastjson 格式化 Set 时不是标准的 json
export function meJsonFormat(jsonString) {
  return applyEdits(jsonString, format(jsonString, undefined, { insertSpaces: true, tabSize: 2 }))
}

// 支持 json5 格式的输入 (key 可以不加引号，key-value 可以为单引号，允许注释等)
export function meJsonParse(jsonString) {
  if (!jsonString) return null
  if (jsonString === 'undefined') return null
  if (jsonString === 'null') return null
  return JSON5.parse(jsonString)
}

// json5 格式转普通 json
export function meJsonNormal(jsonString) {
  return JSON.stringify(JSON5.parse(jsonString), null, 2)
}

// base64 的 bytes 转换为显示格式
export function meFormatBytes(base64, displayFormat) {
  if (displayFormat === 'base64') return base64
  if (displayFormat === 'hex') return base64ToHex(base64)
  if (displayFormat === 'binary') return base64ToBinary(base64)
  return 'Unknown displayFormat: ' + displayFormat
}

// 指定格式的 bytes 转换为 base64
export function meToBase64(bytes, encoding) {
  if (encoding === 'base64') return bytes
  if (encoding === 'hex') return hexToBase64(bytes)
  if (encoding === 'binary') return binaryToBase64(bytes)
  return 'Unknown encoding: ' + encoding
}

function base64ToHex(base64) {
  if (!base64) return ''
  const binary = atob(base64)
  return Array.from(binary)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}

function base64ToBinary(base64) {
  if (!base64) return ''
  const binary = atob(base64)
  return Array.from(binary)
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('')
}

function hexToBase64(hex) {
  if (!hex) return ''
  // 校验：长度必须是偶数
  if (hex.length % 2 !== 0) {
    throw new Error(t('util.invalidHexString'))
  }
  // 校验：每个字符必须是有效的十六进制字符
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(t('util.invalidHexCharacter'))
  }
  // 每 2 个字符处理为一个字节
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16)
    if (isNaN(byte)) {
      throw new Error(t('util.invalidHexCharacter'))
    }
    bytes.push(byte)
  }
  // 转换为二进制字符串
  const binary = bytes.map(byte => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

function binaryToBase64(binary) {
  if (!binary) return ''
  // 校验：长度必须是 8 的倍数
  if (binary.length % 8 !== 0) {
    throw new Error(t('util.invalidBinaryString'))
  }
  // 校验：每个字符必须是 0 或 1
  if (!/^[01]+$/.test(binary)) {
    throw new Error(t('util.invalidBinaryCharacter'))
  }
  // 每 8 个字符处理为一个字节
  const bytes = []
  for (let i = 0; i < binary.length; i += 8) {
    const byte = parseInt(binary.slice(i, i + 8), 2)
    if (isNaN(byte)) {
      throw new Error(t('util.invalidBinaryCharacter'))
    }
    bytes.push(byte)
  }
  // 转换为二进制字符串
  const binaryStr = bytes.map(byte => String.fromCharCode(byte)).join('')
  return btoa(binaryStr)
}
