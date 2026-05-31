import { createI18n } from 'vue-i18n'

import en from './lang/en'
import zhCN from './lang/zh-cn'

export type AppLocale = 'zhCN' | 'en'

/** BCP-47 / POSIX 系统 locale → 应用 i18n 键；macOS 常见 zh-Hans-CN，不能只 replace 第一个 '-' */
export function normalizeAppLocale(raw: string | null | undefined): AppLocale {
  if (!raw) return 'en'
  const tag = raw.trim().replace(/_/g, '-').toLowerCase()
  if (tag.startsWith('zh')) return 'zhCN'
  return 'en'
}

// 创建 i18n
const i18n = createI18n({
  legacy: false,
  globalInjection: false, // 全局模式，可以直接使用 $t, 本应用统一使用t函数
  locale: 'en',
  fallbackLocale: 'en',
  messages: { zhCN, en },
  warnHtmlMessage: false, // 关闭html警告
})

export default i18n
