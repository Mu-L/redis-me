<script setup>
import {useDark, useLocalStorage, usePreferredDark} from '@vueuse/core'
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'

const { t, locale } = useI18n()

// 主题
const theme = ref('system')
const themeList = computed( () => [
  {value: 'light', label: t('setting.light')},
  {value: 'dark', label: t('setting.dark')},
  {value: 'system', label: t('setting.system')},
])

// 主题初始化值
const isPreferredDark = usePreferredDark()
const isDark = useDark()
if (isPreferredDark.value) { // 如果为true，表示浏览器设置为dark模式，采用系统设置即可
  theme.value = 'system'
} else { // 否则只有手动设置过dark才会是dark
  theme.value = isDark.value ? 'dark' : 'light'
}

// 切换主题
function changeTheme(theme) {
  if (theme === 'system') {
    isDark.value = isPreferredDark.value
  } else {
    isDark.value = theme === 'dark'
  }
}
watch(theme, () => {changeTheme(theme.value)})
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 语言
const lang = useLocalStorage('lang', 'en')
const langList = [
  {value: 'en', label: 'English'},
  {value: 'zhCn', label: '简体中文'},
  {value: 'zhTw', label: '繁体中文'}
]

// 自动切换语言
watch(lang, () => {locale.value = lang.value})
</script>

<template>
  <el-card :header="t('setting.appearance')" header-class="me-card">
    <el-form inline label-position="left">
      <el-form-item :label="t('setting.theme')">
<!--        <el-select v-model="theme" style="width: 120px" @change="changeTheme">
          <el-option v-for="item in themeList" :label="item.label" :value="item.value" :key="item.value"/>
        </el-select>-->
        <el-segmented v-model="theme" :options="themeList"/>
      </el-form-item>
      <el-form-item :label="t('setting.language')">
        <el-select v-model="lang" style="width: 120px">
          <el-option v-for="item in langList" :label="item.label" :value="item.value" :key="item.value"/>
        </el-select>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
:deep(.me-card) {
  font-weight: bold;
}

.me-link {
  margin-left: 10px;
}
</style>