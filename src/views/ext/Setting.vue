<script setup>
import {useI18n} from 'vue-i18n'
import {meCheckUpdate} from '@/utils/util.js'
import {ref} from 'vue'
import {getVersion} from '@tauri-apps/api/app'

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

// 字体
let fonts = ref([])
const loadFonts = async () => {
  const localFonts = await window.queryLocalFonts()
  // 只显示常规字体
  fonts.value = localFonts.filter(f => f.style === 'Regular').map(f => f.fullName).sort()
}
onMounted(loadFonts)

// 检查更新
const appVersion = ref('')
getVersion().then(res => appVersion.value = res).catch(_ => {})
const loading = ref(false)
async function checkUpdate() {
  loading.value = true
  try {
    await meCheckUpdate(false, {
      // github网络访问不畅通，可加代理验证
      // proxy: 'http://127.0.0.1:7897',
      timeout: 10000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card>
    <el-form inline label-position="right" label-width="86px">
      <el-row>
        <el-col :span="12">
          <el-form-item :label="t('setting.theme')">
            <el-segmented v-model="settings.theme" :options="themeList"/>
          </el-form-item>
        </el-col>
        <el-col :span="12" align="right">
          <el-form-item :label="t('setting.language')">
            <el-select v-model="settings.language" style="width: 120px">
              <el-option v-for="item in langList" :label="item.label" :value="item.value" :key="item.value"/>
            </el-select>
          </el-form-item>
        </el-col>
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

      <el-row>
        <el-col :span="10">
          <el-form-item :label="t('setting.update')">
            <el-checkbox v-model="settings.autoUpdate" :label="t('setting.updateAuto')"/>

          </el-form-item>
        </el-col>

        <el-col :span="14" align="right">
          <el-form-item :label="t('setting.nowVersion')">
            <span style="margin-right: 10px">v{{appVersion}}</span>
            <el-button plain @click="checkUpdate" :loading="loading" icon="el-icon-check">{{ t('setting.updateNow') }}</el-button>
          </el-form-item>
        </el-col>
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