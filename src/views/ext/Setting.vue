<script setup>
import { getVersion } from '@tauri-apps/api/app'
import { openPath } from '@tauri-apps/plugin-opener'
import { getSystemFonts } from 'tauri-plugin-system-fonts-api'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {meCheckUpdate, meConfirm, meInvoke} from '@/utils/util.js'
import {appConfigDir, appDataDir, appLogDir, resourceDir} from '@tauri-apps/api/path'

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
      .filter(f => f.style === 'Regular')
      .map(f => f.fullName)
      .sort()
  } else {
    // 用户未授权时采用rust获取字体（名称就没有中文了）, 但可以判断是否为等宽字体
    // 示例1: {"id":"4294967481","name":"SimHei","fontName":"SimHei","path":"C:\\Windows\\Fonts\\simhei.ttf","weight":400,"style":"Normal","monospaced":false}
    // 示例2: {"id":"4294967341","name":"Consolas","fontName":"Consolas","path":"C:\\Windows\\Fonts\\consola.ttf","weight":400,"style":"Normal","monospaced":true}
    // 示例3: {"id":"4294967479","name":"Segoe UI Variable","fontName":"SegoeUIVariable","path":"C:\\Windows\\Fonts\\SegUIVar.ttf","weight":400,"style":"Normal","monospaced":false}
    const systemFonts = await getSystemFonts()
    //console.log('systemFonts:', systemFonts)
    fonts.value = [...new Set(systemFonts.map(f => f.name))].sort()
  }
}
onMounted(loadFonts)

// 检查更新
const appVersion = ref('')
getVersion()
  .then(res => (appVersion.value = res))
  .catch(_ => {})
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
const keyLabelList = computed(() => [
  { value: 'full', label: t('setting.keyLabelFull') },
  { value: 'short', label: t('setting.keyLabelShort') },
])

// 默认设置
const baseDefaultSettings = {
  theme: 'system',
  language: 'system',
  uiFont: [],
  codeFont: [],
  autoUpdate: true,
}

const moreDefaultSettings = {
  keyScanCount: 1000,
  fieldScanCount: 20,
  keyShow: 'tree',
  keySort: 'count',
  keyHeight: 20,
  keyLabel: 'short',
}

// 任何一个字段不同则视为不同
// 判断设置是否与默认值不同
const isBaseDiff = computed(() =>
  Object.keys(baseDefaultSettings).some(key => {
    const current = settings[key]
    const defaultValue = baseDefaultSettings[key]

    // 处理数组类型的比较
    if (Array.isArray(current) && Array.isArray(defaultValue)) {
      return (
        current.length !== defaultValue.length ||
        current.some((item, index) => item !== defaultValue[index])
      )
    }

    return current !== defaultValue
  }),
)

const isMoreDiff = computed(() =>
  Object.keys(moreDefaultSettings).some(key => settings[key] !== moreDefaultSettings[key]),
)

// 恢复默认
function toDefault(name) {
  meConfirm(t('setting.confirmToDefault', { name: t('setting.' + name) }), () => {
    Object.assign(settings, name === 'baseSetting' ? baseDefaultSettings : moreDefaultSettings)
  })
}

// 打开目录
async function openDir(dirType) {
  let dir = ''
  if (dirType === 'config') {
    dir = await appConfigDir()
  } else if (dirType === 'app') {
    dir = await meInvoke('app_dir')
  } else {
    dir = await appLogDir()
  }
  await openPath(dir)
}
</script>

<template>
  <!-- 基础设置 -->
  <el-card>
    <template #header>
      <div class="me-flex" style="align-items: center">
        <div>{{ t('setting.baseSetting') }}</div>
        <el-text class="restore" type="info" @click="toDefault('baseSetting')" v-if="isBaseDiff">{{
          t('setting.toDefault')
        }}</el-text>
      </div>
    </template>
    <el-form inline label-position="right" :label-width="t('setting.labelWidth')">

      <!-- 主题、语言 -->
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
              :key="item.value" />
          </el-select>
        </el-form-item>
      </el-row>

      <!-- 界面字体 -->
      <el-row>
        <el-form-item :label="t('setting.uiFont')" style="width: 100%">
          <el-select
            v-model="settings.uiFont"
            :placeholder="t('setting.uiFontHint')"
            clearable
            multiple
            allow-create
            filterable
            :reserve-keyword="false">
            <el-option v-for="item in fonts" :label="item" :value="item" :key="item" />
          </el-select>
        </el-form-item>
      </el-row>

      <!-- 代码字体 -->
      <el-row>
        <el-form-item :label="t('setting.codeFont')" style="width: 100%">
          <el-select
            v-model="settings.codeFont"
            :placeholder="t('setting.codeFontHint')"
            clearable
            multiple
            allow-create
            filterable
            :reserve-keyword="false">
            <el-option v-for="item in fonts" :label="item" :value="item" :key="item" />
          </el-select>
        </el-form-item>
      </el-row>

      <!-- 打开目录 -->
      <el-row>
        <el-form-item :label="t('setting.dir')" style="width: 100%;">
          <div class="me-flex" style="width: 100%">
            <el-button icon="el-icon-document" @click="openDir('config')"> {{ t('setting.configDir') }}</el-button>
            <el-button icon="el-icon-place" @click="openDir('app')">{{ t('setting.appDir') }}</el-button>
            <el-button icon="el-icon-memo" @click="openDir('log')">{{ t('setting.logDir') }}</el-button>
          </div>
        </el-form-item>
      </el-row>

      <!-- 更新设置 -->
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

  <!-- 更多设置 -->
  <el-card style="margin-top: 20px">
    <template #header>
      <div class="me-flex" style="align-items: center">
        <div>{{ t('setting.moreSetting') }}</div>
        <el-text class="restore" type="info" @click="toDefault('moreSetting')" v-if="isMoreDiff">{{
          t('setting.toDefault')
        }}</el-text>
      </div>
    </template>
    <el-form inline label-position="right" :label-width="t('setting.extLabelWidth')">
      <!-- 扫描数量 -->
      <el-row class="me-flex">
        <el-form-item>
          <template #label>
            <me-icon
              :name="t('setting.keyScanCount')"
              icon="el-icon-question-filled"
              :info="t('setting.keyScanCountTip')"
              placement="top" />
          </template>
          <el-input-number
            v-model="settings.keyScanCount"
            :min="1000"
            :max="10000"
            :controls="false"
            style="width: 100px"
            align="left" />
        </el-form-item>
        <el-form-item>
          <template #label>
            <me-icon
              :name="t('setting.fieldScanCount')"
              icon="el-icon-question-filled"
              :info="t('setting.fieldScanCountTip')"
              placement="top" />
          </template>
          <el-input-number
            v-model.number="settings.fieldScanCount"
            :min="10"
            :max="100"
            :controls="false"
            style="width: 100px"
            align="left" />
        </el-form-item>
      </el-row>

      <!-- 键展示方式1 -->
      <el-row class="me-flex">
        <el-form-item :label="t('setting.keyShow')">
          <el-segmented v-model="settings.keyShow" :options="keyShowList" />
        </el-form-item>

        <el-form-item>
          <template #label>
            <me-icon
              :name="t('setting.keyLabel')"
              icon="el-icon-question-filled"
              :info="t('setting.keyLabelTip')"
              placement="top" />
          </template>
          <el-segmented
            v-model="settings.keyLabel"
            :options="keyLabelList"
            :disabled="settings.keyShow !== 'tree'" />
        </el-form-item>
      </el-row>

      <!-- 键展示方式2 -->
      <el-row class="me-flex">
        <el-form-item :label="t('setting.keyHeight')">
          <el-input-number
            v-model="settings.keyHeight"
            :min="16"
            :max="28"
            style="width: 100px"
            align="center" />
        </el-form-item>
        <el-form-item :label="t('setting.keySort')">
          <el-segmented
            v-model="settings.keySort"
            :options="keySortList"
            :disabled="settings.keyShow !== 'tree'" />
        </el-form-item>
      </el-row>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
:deep(.el-card__header) {
  font-weight: bold;
}

.restore {
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
  }
}
</style>
