import { createI18n } from 'vue-i18n'
import zhCn from './lang/zh-cn.js'
import en from './lang/en.js'

// 创建 i18n
const i18n = createI18n({
  legacy: false,
  globalInjection: true, // 全局模式，可以直接使用 $t
  locale: localStorage.getItem('lang') || 'en',
  messages: {zhCn, en}
})

export default function (app) {
  app.use(i18n)
}