import { createI18n } from 'vue-i18n'

import en from './lang/en'
import zhCN from './lang/zh-cn'

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
