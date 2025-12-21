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

// 更新源
const updateOptions = ['github', 'gitee']
</script>

<template>
  <el-card>
    <template #header>
      <div class="card-header">{{ t('setting.appearance')}}</div>
    </template>
    <el-form inline label-position="right" :label-width="t('setting.labelWidth')">
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
    </el-form>
  </el-card>

  <el-card style="margin-top: 20px">
    <template #header>
      <div class="me-flex">
        <div>
          <span class="card-header">{{ t('setting.app') }}</span>
          <el-tag type="info" style="margin-left: 10px">v{{ appVersion }}</el-tag>
        </div>
        <el-button plain @click="checkUpdate" :loading="loading" icon="el-icon-check">
          {{t('setting.updateNow') }}
        </el-button>
      </div>
    </template>
    <el-form inline label-position="right" :label-width="t('setting.labelWidth')">
      <el-row>
        <el-col :span="10">
          <el-form-item :label="t('setting.update')">
            <el-checkbox v-model="settings.autoUpdate" :label="t('setting.updateAuto')"/>
          </el-form-item>
        </el-col>

        <el-col :span="14" align="right">
            <el-form-item :label="t('setting.updateSource')">
              <el-segmented v-model="settings.updateSource" :options="updateOptions" >
                <template #default="scope">
                  <me-icon :icon="'me-icon-' + scope.item" :name="scope.value" hint/>
                </template>
              </el-segmented>
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

.card-header {
  font-weight: bold;
}
</style>