<script setup>
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const settings = window.meTauri.settings

// 主题
const themeList = computed(() => [
  {value: 'light', label: t('setting.light')},
  {value: 'dark', label: t('setting.dark')},
  {value: 'system', label: t('setting.system')},
])

// 语言
const langList = computed(() => [
  {value: 'system', label: t('setting.systemLanguage')},
  {value: 'en', label: 'English'},
  {value: 'zhCN', label: '简体中文'},
])
</script>

<template>
  <el-card :header="t('setting.appearance')" header-class="me-card">
    <el-form inline label-position="left">
      <el-form-item :label="t('setting.theme')">
        <el-segmented v-model="settings.theme" :options="themeList"/>
      </el-form-item>
      <el-form-item :label="t('setting.language')">
        <el-select v-model="settings.language" style="width: 120px">
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