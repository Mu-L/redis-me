import { createI18n } from 'vue-i18n'
import zhCn from './lang/zh-cn.js'
import en from './lang/en.js'

// 创建 i18n
const i18n = createI18n({
  legacy: false,
  globalInjection: true, // 全局模式，可以直接使用 $t
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages: {zhCn, en}
})

export default i18n