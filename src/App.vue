<script setup>
import AppMain from '@/views/AppMain.vue'
import AppTitle from '@/views/ext/AppTitle.vue'
import {meCheckUpdate} from '@/utils/util.js'
import {useDark} from '@vueuse/core'
import {useI18n} from 'vue-i18n'

const {locale: i18nLocale} = useI18n()

// 检查更新
onMounted(() => meCheckUpdate())

let locale = null

// 主题切换
const isDark = useDark()
watch(() => meTauri.settings.theme, (newValue) => {
  const newTheme = newValue === 'system' ? meTauri.systemTheme : newValue
  isDark.value = newTheme === 'dark'
}, {immediate: true})

// 语言切换
watch(() => meTauri.settings.language, (newValue) => {
  const language = newValue === 'system' ? meTauri.systemLanguage : newValue
  locale = window.ElementPlusLanguageMap[language] // ElementPlus的语言切换
  i18nLocale.value = language // RedisME的语言切换, 只能在组件中使用
}, {immediate: true})
</script>

<template>
  <el-config-provider :locale>
    <AppTitle/>
    <AppMain/>
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