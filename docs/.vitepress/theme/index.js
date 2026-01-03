import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import AppPreview from './components/AppPreview.vue'
import HeroActions from './components/HeroActions.vue'
import './styles.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-actions-after': () => h(HeroActions),
      'home-hero-after': () => h(AppPreview)
    })
  }
}
