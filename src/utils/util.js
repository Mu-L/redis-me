import mitt from 'mitt'
import {sampleSize} from 'lodash'
import {useClipboard} from '@vueuse/core'
import {ElMessage, ElMessageBox} from 'element-plus'
import {invoke} from '@tauri-apps/api/core'
import {check} from '@tauri-apps/plugin-updater'
import {relaunch} from '@tauri-apps/plugin-process'
import i18n from '@/locales'

// 全局事件总线: setup直接导入，app全局属性也添加
export const bus = mitt()

// 存储
export const STORE_FILE_NAME = 'store.json'
export const STORE_CONN_LIST = 'connList'
export const STORE_SETTING = 'setting'

// 常量
export const KEY_DELETE = 'DELETE_KEY'
export const KEY_REFRESH = 'REFRESH_KEY'
export const CONN_REFRESH = 'CONN_REFRESH'

// 预设颜色
export const PREDEFINE_COLORS = [
  '#409eff',  // primary
  '#67c23a',  // success
  '#e6a23c',  // warning
  '#f56c6c',  // danger
  '#909399',  // info
]

// 是否开发模式
const isDev = import.meta.env.DEV
const t = i18n.global.t

// 打印日志
export async function meInvoke(command, params, alert = true) {
  try {
    const data = await invoke(command, params)
    if (isDev) {
      console.log(`命令: ${command}, 参数: `, params, '结果: ', data)
    }

    return data
  } catch (error) {
    if (alert) {
      meErr(error, t('error') + (isDev ? ': ' + command : ''))
    }

    if (isDev) {
      console.log(`命令: ${command}, 参数:`, params, `, 错误: ${error}`)
    }
    throw error;
  }
}

// ~~~~~~~~~~~~~确认、提示、错误
const DoNothing = () => {}

export function meOk(message) {
  ElMessage.success(message)
}

export function meErr(message, title = t('error')) {
  if (message instanceof Error) {
    message = message.message
  }
  ElMessageBox.alert(message, title, {type: 'error'}).then(DoNothing)
}

export function meConfirm(message, thenFun) {
  ElMessageBox.confirm(message, t('warn'), {type: 'warning'})
    .then(thenFun)
    .catch(DoNothing)
}

export function mePrompt(message, options, thenFun) {
  ElMessageBox.prompt(message, options)
    .then(thenFun)
    .catch(DoNothing)
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// 复制文本
export function meCopy(text) {
  useClipboard({legacy: true}).copy(text)
  ElMessage({message: t('copyOk'), type: 'success'})
}

// 随机N个字符
const CHAR_ARRAY = [...'abcdefghigklmnopqrstuvwxyz0123456789']
export function meRandomString(n) {
  return sampleSize(CHAR_ARRAY, n).join('')
}

// 人类可读的大小
const humanUnits = [
  {threshold: 1        , symbol: 'B'},
  {threshold: 1024     , symbol: 'K'},
  {threshold: 1024 ** 2, symbol: 'M'},
  {threshold: 1024 ** 3, symbol: 'G'},
  {threshold: 1024 ** 4, symbol: 'T'},
]
export function meHumanSize(size, zeroShow = '0B', fractionDigits = 2) {
  if (!size) return zeroShow || ''

  // 从大到小查找合适的单位
  for (let i = humanUnits.length - 1; i >= 0; i--) {
    if (size >= humanUnits[i].threshold) {
      const value = size / humanUnits[i].threshold;
      return value.toFixed(fractionDigits) + humanUnits[i].symbol;
    }
  }

  return size + 'B'; // 小于1KB的情况
}

// w天 xx:yy:zz 的格式
export function meHumanSeconds(seconds) {
  const days = Math.floor(seconds / (3600 * 24)) // 计算天数
  seconds %= (3600 * 24) // 计算剩余秒数

  const hours = Math.floor(seconds / 3600)
  seconds %= 3600

  const minutes = Math.floor(seconds / 60)
  seconds %= 60

  // 确保小时、分钟和秒数是两位数显示
  const formattedHours   = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  // 组合结果
  let result = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
  if (days > 0) {
    result = `${days}${t('day')} ${result}`
  }
  return result
}


// 表格根据属性过滤
export function meFilterHandler(value, row, column){
  const property = column.property;
  return row[property] === value;
}

// 删除键
export function meDeleteKey(id, redisKey, thenFn) {
  meConfirm(t('util.deleteKey', {key: redisKey.key}), async () => {
    await meInvoke('del', {id, key: redisKey})
    bus.emit(KEY_DELETE, redisKey)
    meOk(t('deleteOk'))
    if (thenFn) {
      thenFn()
    }
  })
}


// 检查更新
export async function meCheckUpdate() {
  console.log('检查更新')
  const update = await check().catch(DoNothing)
  if (update) {
    meConfirm(t('updateHint', {version: update.version}),
      async () => {
        try {
          await update.downloadAndInstall(DoNothing)
          meConfirm(t('updateDone'), async () => await relaunch())
        } catch (e) {
          meOk(t('updateErr', {message: e.message}))
        }
      }
    )
  }
}