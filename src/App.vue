<script setup>
import AppMain from '@/views/AppMain.vue'
import AppTitle from '@/views/ext/AppTitle.vue'
import { useI18n } from 'vue-i18n'
import { isDark } from '@/utils/util.js'

const { locale: i18nLocale } = useI18n()

// 主题切换
watch(
  () => meTauri.settings.theme,
  newValue => {
    const newTheme = newValue === 'system' ? meTauri.systemTheme : newValue
    isDark.value = newTheme === 'dark'
  },
  { immediate: true },
)

// 语言切换
let locale = null
watch(
  () => meTauri.settings.language,
  newValue => {
    const language = newValue === 'system' ? meTauri.systemLanguage : newValue
    locale = window.ElementPlusLanguageMap[language] // ElementPlus的语言切换
    i18nLocale.value = language // RedisME的语言切换, 只能在组件中使用
  },
  { immediate: true },
)

// 字体切换
const defaultUiFont =
  "system-ui, Inter, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif"
const defaultCodeFont = 'Menlo, Monaco, Consolas, 黑体, system-ui'
const appUiFont = computed(() => meTauri.settings.uiFont || defaultUiFont)
const appCodeFont = computed(() => meTauri.settings.codeFont || defaultCodeFont)
watch(appUiFont, () => document.documentElement.style.setProperty('--ui-font', appUiFont.value), {
  immediate: true,
})
watch(
  appCodeFont,
  () => document.documentElement.style.setProperty('--code-font', appCodeFont.value),
  { immediate: true },
)
</script>

<template>
  <el-config-provider :locale>
    <AppTitle />
    <AppMain />
  </el-config-provider>
</template>

<style lang="scss">
#app {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}
</style>
