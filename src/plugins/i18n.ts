import type { App } from 'vue'

import i18n from '@/locales'

export default function setupI18n(app: App): void {
  app.use(i18n)
}
