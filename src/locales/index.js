import { createI18n } from 'vue-i18n'
import zhCn from './lang/zh-cn.js'
import en from './lang/en.js'
import {useLocalStorage} from '@vueuse/core'

// 创建 i18n
const systemLang = navigator.language.replace(/-/g, '')
const lang = useLocalStorage('lang', systemLang)
const i18n = createI18n({
  legacy: false,
  globalInjection: true, // 全局模式，可以直接使用 $t
  locale: lang.value,
  fallbackLocale: 'en',
  messages: {zhCn, en}
})

export default i18n