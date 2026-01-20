import mitt from 'mitt'
import {sampleSize} from 'lodash'
import {useClipboard} from '@vueuse/core'
import {ElLink, ElMessage, ElMessageBox} from 'element-plus'
import {invoke} from '@tauri-apps/api/core'
import {check} from '@tauri-apps/plugin-updater'
import {relaunch} from '@tauri-apps/plugin-process'
import i18n from '@/locales'
import {type} from '@tauri-apps/plugin-os'

// 全局事件总线: setup直接导入，app全局属性也添加
export const bus = mitt()

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

// 打印日志（仅开发环境）
export function meLog(...args) {
  if (isDev) {
    console.log(...args)
  }
}

// 是否是中文模式
export function isZh() {
  const language = meTauri.settings.language === 'system' ? meTauri.systemLanguage : meTauri.settings.language
  return language?.startsWith('zh')
}

// invoke命令: 打印日志
let retryCount = 0
export async function meInvoke(command, params, alert = true) {
  try {
    const data = await invoke(command, params)
    meLog(`命令: ${command}, 参数: `, params, '结果: ', data)
    retryCount = 0 // 一旦调用成功则重置重试次数
    return data
  } catch (error) {
    // 客户端断开后的自动重连(后端处理大部分，前端仅处理立刻的场景, 优化用户体验。避免无限递归，最多重试3次)
    if (error === 'unexpected end of file') {
      if (retryCount <= 3) {
        retryCount++
        meLog(`第${retryCount}次重试: ${command}`)
        return await meInvoke(command, params, alert)
      }
    }

    if (alert) {
      meErr(error, t('error') + (isDev ? ': ' + command : ''))
    }

    meLog(`命令: ${command}, 参数:`, params, `, 错误: ${error}`)
    throw error;
  }
}

// ~~~~~~~~~~~~~确认、提示、错误
export const DoNothing = () => {}

export function meOk(message) {
  ElMessage.success(message)
}

export function meErr(message, title = t('error')) {
  if (message instanceof Error) {
    message = message.message
  }
  ElMessageBox.alert(message, title, {type: 'error'}).then(DoNothing)
}

export function meConfirm(message, thenFun, boxOptions = {}) {
  ElMessageBox.confirm(message, boxOptions?.type === 'info' ? t('info') : t('warn'), {type: 'warning', ...boxOptions})
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
    result = `${days}${t('util.days', days)} ${result}`
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

const manualCloseOptions = {closeOnClickModal: false, closeOnPressEscape: false, type: 'info'}
export async function meDownloadUpdate(quiet = true, update, app) {
  console.log('检查结果:', update)
  const hint = t('util.updateHint', {version: update.version})
  const changelog = t('util.changelog')
  const changelogUrl = t('util.changelogUrl')
  const message = () => {
    return h('div', null, [
      h('span', hint),
      h(ElLink, {type: 'primary', href: changelogUrl, target: '_blank'}, changelog)
    ])
  }

  // 更新过程中的提示: 避免Esc及点击遮罩层关闭提示框
  meConfirm('xx',
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
              console.log(`downloadAppSize: ${meHumanSize(event.data.contentLength)}`)
              break
            case 'Progress':
              downloaded += event.data.chunkLength
              app.downloadPercentage = Math.round(downloaded / contentLength * 100)
              //console.log(`downloaded ${downloaded} from ${contentLength}`)
              break
            case 'Finished':
              app.downloadPercentage = 100
              //console.log('download finished')
              break
          }
        }

        // 在 Windows 上，由于 Windows 安装程序的限制，应用程序在执行安装步骤时将自动退出。Mac等其他系统，下载和安装都可以在后台运行
        const isWindows = type() === 'windows'
        if (isWindows) {
          await update.download(downloadingHandle)
          meConfirm(t('util.downloadDown'), async () => await update.install(), manualCloseOptions )
        } else {
          await update.downloadAndInstall(downloadingHandle)
          meConfirm(t('util.updateDone'), async () => await relaunch(), manualCloseOptions)
        }
      } catch (e) {
        meErr(t('util.updateErr', {message: e.message}))
      } finally {
        app.downloading = false
      }
    }
    , {...manualCloseOptions, message: message})
}