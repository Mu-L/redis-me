import * as ElementPlusIcons from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import en from 'element-plus/es/locale/lang/en'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import type { App } from 'vue'

export default function setupElementPlus(app: App): void {
  window.ElementPlusLanguageMap = { zhCN, en }
  app.use(ElementPlus)
  for (const [key, component] of Object.entries(ElementPlusIcons)) {
    app.component(`ElIcon${key}`, component)
  }
}
