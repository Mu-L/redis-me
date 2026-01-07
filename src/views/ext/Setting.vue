<script setup>
import {useI18n} from 'vue-i18n'
import {meCheckUpdate} from '@/utils/util.js'
import {ref} from 'vue'
import {getVersion} from '@tauri-apps/api/app'
import { getSystemFonts } from "tauri-plugin-system-fonts-api";

const {t} = useI18n()
const settings = window.meTauri.settings
const isAppStore = window.meTauri.isAppStore

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

// 字体
let fonts = ref([])
const loadFonts = async () => {
  // 浏览器直接获取系统字体, safari不支持、
  let localFonts = []
  if (window.queryLocalFonts) {
    localFonts = await window.queryLocalFonts()
  }

  if (localFonts.length > 0) {
    // 只显示常规字体
    fonts.value = localFonts.filter(f => f.style === 'Regular').map(f => f.fullName).sort()
  } else {
    // 用户未授权时采用rust获取字体（名称就没有中文了）
    const systemFonts = await getSystemFonts()
    fonts.value = [...new Set(systemFonts.map(f => f.name))].sort()
  }
}
onMounted(loadFonts)

// 检查更新
const appVersion = ref('')
getVersion().then(res => appVersion.value = res).catch(_ => {})
const loading = ref(false)
const app = inject('app')
async function checkUpdate() {
  loading.value = true
  try {
    await meCheckUpdate(false, {timeout: 10000}, app)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card>
    <el-form inline label-position="right" :label-width="t('setting.labelWidth')">
      <el-row class="me-flex">
        <el-form-item :label="t('setting.theme')">
          <el-segmented v-model="settings.theme" :options="themeList"/>
        </el-form-item>
        <el-form-item :label="t('setting.language')">
          <el-select v-model="settings.language" style="width: 120px">
            <el-option v-for="item in langList" :label="item.label" :value="item.value" :key="item.value"/>
          </el-select>
        </el-form-item>
      </el-row>

      <el-row>
        <el-form-item :label="t('setting.uiFont')" style="width: 100%">
          <el-select v-model="settings.uiFont" :placeholder="t('setting.uiFontHint')"
                     clearable multiple allow-create filterable :reserve-keyword="false">
            <el-option v-for="item in fonts" :label="item" :value="item" :key="item"/>
          </el-select>
        </el-form-item>
      </el-row>
      <el-row>

        <el-form-item :label="t('setting.codeFont')" style="width: 100%">
          <el-select v-model="settings.codeFont" :placeholder="t('setting.codeFontHint')"
                     clearable multiple allow-create filterable :reserve-keyword="false">
            <el-option v-for="item in fonts" :label="item" :value="item" :key="item"/>
          </el-select>
        </el-form-item>
      </el-row>

      <el-row class="me-flex">
        <el-form-item :label="t('setting.update')">
          <el-tag v-if="isAppStore" type="info">{{ t('setting.updateAppStore') }}</el-tag>
          <el-checkbox v-else v-model="settings.autoUpdate" :label="t('setting.updateAuto')"/>
        </el-form-item>

        <el-form-item :label="t('setting.nowVersion')">
          <span><el-tag type="info">v{{appVersion}}</el-tag></span>
          <el-button style="margin-left: 10px" plain @click="checkUpdate" :loading="loading" icon="el-icon-check" :disabled="app.downloading" v-if="!isAppStore">{{ t('setting.updateNow') }}</el-button>
        </el-form-item>
      </el-row>
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