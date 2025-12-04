<script setup>
import {Window} from '@tauri-apps/api/window'
import {useDark, useLocalStorage, useToggle} from '@vueuse/core'
import {type} from '@tauri-apps/plugin-os'
import {meOk} from '@/utils/util.js'
import {useI18n} from 'vue-i18n'

const { locale } = useI18n()

// 模拟窗口操作
const appWindow = new Window('main')
const isFullScreen = ref(false)
const isMaximized = ref(false)

appWindow.onResized(async () => {
  isMaximized.value = await appWindow.isMaximized()
  isFullScreen.value = await appWindow.isFullscreen()
})

// 主题切换
const isDark = useDark()
const toggleDark = useToggle(isDark)

// MacOS且未全屏时 留出最大化最小化按钮空间
const isMacOS = type() === 'macos'
const marginLeft = computed(() => {
  if (isFullScreen.value) {
    return '5px'
  } else {
    return isMacOS ? '70px' : '5px'
  }
})

// 点击名称切换语言或未来其他功能的快速测试验证
const lang = useLocalStorage('lang', 'en')
const toggleName = () => {
  if (lang.value === 'en') {
    lang.value = 'zhCn'
    locale.value = 'zhCn'
  } else {
    lang.value = 'en'
    locale.value = 'en'
  }
  meOk(`Change Lang: ${lang.value}`)
}
</script>

<template>
  <div data-tauri-drag-region class="title-bar me-flex">
    <div class="me-flex" style="align-items: center" :style="{marginLeft}">
      <me-icon icon="me-icon-redis-me" class="icon-btn" style="font-size: 16px;"
               @click="toggleDark()"/>
      <div style="margin-left: 5px;font-size: 12px" @click="toggleName">RedisME</div>
    </div>
    <div style="font-size: 12px;" v-if="!isMacOS">
      <me-icon icon="me-icon-window-minimize" class="title-button normal-btn" @click="appWindow.minimize()"/>
      <me-icon icon="me-icon-window-maximize" class="title-button normal-btn" @click="appWindow.toggleMaximize()" v-show="!isMaximized"/>
      <me-icon icon="me-icon-window-restore"  class="title-button normal-btn" @click="appWindow.toggleMaximize()" v-show="isMaximized"/>
      <me-icon icon="me-icon-window-close"    class="title-button danger-btn" @click="appWindow.close()"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
.title-bar {
  height: 30px;
  user-select: none;

  .title-button {
    width: 40px;
    height: 30px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    user-select: none;
    -webkit-user-select: none;
  }

  .normal-btn:hover {
    background: var(--el-color-info-light-7);
  }

  .danger-btn:hover {
    background: var(--el-color-danger);
  }
}
</style>