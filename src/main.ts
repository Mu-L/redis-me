import { createApp } from 'vue'

import setupElementPlus from '@/plugins/element-plus'
import setupI18n from '@/plugins/i18n'
import setupSvgIcon from '@/plugins/icon'
import setupMe from '@/plugins/me'
import setupTauri from '@/plugins/tauri'
import setupTernimal from '@/plugins/ternimal'

import App from './App.vue'

const app = createApp(App)

setupElementPlus(app)
setupSvgIcon(app)
setupMe(app)
setupTauri(app)
setupI18n(app)
setupTernimal(app)

app.mount('#app')
