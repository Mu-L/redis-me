<script setup>
import { useI18n } from 'vue-i18n'
import { meCheckUpdate } from '@/utils/util.js'
import { ref } from 'vue'
import { getVersion } from '@tauri-apps/api/app'
import { getSystemFonts } from 'tauri-plugin-system-fonts-api'

const { t } = useI18n()
const settings = window.meTauri.settings
const isAppStore = window.meTauri.isAppStore

// 主题
const themeList = computed(() => [
  { value: 'light', label: t('setting.light') },
  { value: 'dark', label: t('setting.dark') },
  { value: 'system', label: t('setting.system') },
])

// 语言
const langList = computed(() => [
  { value: 'system', label: t('setting.systemLanguage') },
  { value: 'en', label: 'English' },
  { value: 'zhCN', label: '简体中文' },
])

// 字体
let fonts = ref([])
const loadFonts = async () => {
  // 浏览器直接获取系统字体, safari不支持
  // 取fullName作为显示, style过滤Regular去除粗体/斜体
  // 示例1: FontData {postscriptName: 'SimHei', fullName: '黑体', family: 'SimHei', style: 'Regular'}
  // 示例2: FontData {postscriptName: 'Arial-Black', fullName: 'Arial Black Normal', family: 'Arial', style: 'Black'}
  let localFonts = []
  if (window.queryLocalFonts) {
    localFonts = await window.queryLocalFonts()
    //console.log('localFonts:', localFonts)
  }

  if (localFonts.length > 0) {
    fonts.value = localFonts
      .filter((f) => f.style === 'Regular')
      .map((f) => f.fullName)
      .sort()
  } else {
    // 用户未授权时采用rust获取字体（名称就没有中文了）, 但可以判断是否为等宽字体
    // 示例1: {"id":"4294967481","name":"SimHei","fontName":"SimHei","path":"C:\\Windows\\Fonts\\simhei.ttf","weight":400,"style":"Normal","monospaced":false}
    // 示例2: {"id":"4294967341","name":"Consolas","fontName":"Consolas","path":"C:\\Windows\\Fonts\\consola.ttf","weight":400,"style":"Normal","monospaced":true}
    // 示例3: {"id":"4294967479","name":"Segoe UI Variable","fontName":"SegoeUIVariable","path":"C:\\Windows\\Fonts\\SegUIVar.ttf","weight":400,"style":"Normal","monospaced":false}
    const systemFonts = await getSystemFonts()
    //console.log('systemFonts:', systemFonts)
    fonts.value = [...new Set(systemFonts.map((f) => f.name))].sort()
  }
}
onMounted(loadFonts)

// 检查更新
const appVersion = ref('')
getVersion()
  .then((res) => (appVersion.value = res))
  .catch((_) => {})
const loading = ref(false)
const app = inject('app')
async function checkUpdate() {
  loading.value = true
  try {
    await meCheckUpdate(false, { timeout: 10000 }, app)
  } finally {
    loading.value = false
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const keyShowList = computed(() => [
  { value: 'tree', label: t('setting.keyShowTree') },
  { value: 'list', label: t('setting.keyShowList') },
])
const keySortList = computed(() => [
  { value: 'count', label: t('setting.sortByCount') },
  { value: 'alphabet', label: t('setting.sortByAlphabet') },
])
</script>

<template>
  <el-card :header="t('setting.baseSetting')">
    <el-form inline label-position="right" :label-width="t('setting.labelWidth')">
      <el-row class="me-flex">
        <el-form-item :label="t('setting.theme')">
          <el-segmented v-model="settings.theme" :options="themeList" />
        </el-form-item>
        <el-form-item :label="t('setting.language')">
          <el-select v-model="settings.language" style="width: 120px">
            <el-option
              v-for="item in langList"
              :label="item.label"
              :value="item.value"
              :key="item.value"
            />
          </el-select>
        </el-form-item>
      </el-row>

      <el-row>
        <el-form-item :label="t('setting.uiFont')" style="width: 100%">
          <el-select
            v-model="settings.uiFont"
            :placeholder="t('setting.uiFontHint')"
            clearable
            multiple
            allow-create
            filterable
            :reserve-keyword="false"
          >
            <el-option v-for="item in fonts" :label="item" :value="item" :key="item" />
          </el-select>
        </el-form-item>
      </el-row>
      <el-row>
        <el-form-item :label="t('setting.codeFont')" style="width: 100%">
          <el-select
            v-model="settings.codeFont"
            :placeholder="t('setting.codeFontHint')"
            clearable
            multiple
            allow-create
            filterable
            :reserve-keyword="false"
          >
            <el-option v-for="item in fonts" :label="item" :value="item" :key="item" />
          </el-select>
        </el-form-item>
      </el-row>

      <el-row class="me-flex">
        <el-form-item :label="t('setting.update')">
          <el-tag v-if="isAppStore" type="info">{{ t('setting.updateAppStore') }}</el-tag>
          <el-checkbox v-else v-model="settings.autoUpdate" :label="t('setting.updateAuto')" />
        </el-form-item>

        <el-form-item :label="t('setting.nowVersion')">
          <span
            ><el-tag type="info">v{{ appVersion }}</el-tag></span
          >
          <el-button
            style="margin-left: 10px"
            plain
            @click="checkUpdate"
            :loading="loading"
            icon="el-icon-check"
            :disabled="app.downloading"
            v-if="!isAppStore"
            >{{ t('setting.updateNow') }}</el-button
          >
        </el-form-item>
      </el-row>
    </el-form>
  </el-card>

  <el-card :header="t('setting.moreSetting')" style="margin-top: 20px">
    <el-form inline label-position="right" :label-width="t('setting.extLabelWidth')">
      <el-row class="me-flex">
        <el-form-item :label="t('setting.keyScanCount')">
          <el-input-number v-model="settings.keyScanCount" :min="100" :max="10000" :controls="false"
                           style="width: 100px" align="left"/>
        </el-form-item>
        <el-form-item :label="t('setting.fieldScanCount')">
          <el-input-number v-model.number="settings.fieldScanCount" :min="10" :max="1000" :controls="false"
                           style="width: 100px" align="left"/>
        </el-form-item>
      </el-row>

      <el-row class="me-flex">
        <el-form-item :label="t('setting.keyShow')">
          <el-segmented v-model="settings.keyShow" :options="keyShowList"/>
        </el-form-item>
        <el-form-item :label="t('setting.keySort')">
          <el-segmented v-model="settings.keySort" :options="keySortList" :disabled="settings.keyShow !== 'tree'"/>
        </el-form-item>
      </el-row>
    </el-form>
  </el-card>

</template>

<style scoped lang="scss">
:deep(.el-card__header) {
  font-weight: bold;
}

.me-link {
  margin-left: 10px;
}
</style>
