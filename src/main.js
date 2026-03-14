import { createApp } from 'vue'
import App from './App.vue'
import setupElementPlus from '@/plugins/element-plus.js'
import setupSvgIcon from '@/plugins/icon.js'
import setupMe from '@/plugins/me.js'
import setupTauri from '@/plugins/tauri.js'
import setupI18n from '@/plugins/i18n.js'
import setupTernimal from '@/plugins/ternimal.js'

const app = createApp(App)

setupElementPlus(app)
setupSvgIcon(app)
setupMe(app)
setupTauri(app)
setupI18n(app)
setupTernimal(app)

app.mount('#app')
