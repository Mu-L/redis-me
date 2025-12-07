import ElementPlus from 'element-plus'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

export default function (app) {
  window.ElementPlusLanguageMap = {zhCN, en}
  app.use(ElementPlus)
  for (const [key, component] of Object.entries(ElementPlusIcons)) {
    app.component(`ElIcon${key}`, component)
  }
}