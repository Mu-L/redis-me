import {createApp} from 'vue'
import App from './App.vue'
import setupElementPlus from '@/plugins/element-plus.js'
import setupSvgIcon from '@/plugins/icon.js'
import setupMe from '@/plugins/me.js'
import setupBus from '@/plugins/bus.js'
import setupPinia from '@/plugins/pinia.js'
import setupDirective from '@/plugins/directive.js'
import setupTauri from '@/plugins/tauri.js'
import setupI18n from '@/locales'

const app = createApp(App)
setupElementPlus(app)
setupSvgIcon(app)
setupBus(app)
setupPinia(app)
setupMe(app)
setupDirective(app)
setupTauri(app)
setupI18n(app)
app.mount('#app')
