<script setup>
import {computed} from 'vue'
import {isDark} from '@/utils/util.js'
import 'xterminal/dist/xterminal.css'
import {Terminal} from 'vue-web-terminal'

// TODO 命令提示
const {welcome, prefix, execCommand} = defineProps({
  welcome: {
    type: String,
    default: '欢迎使用 XTerminal',
  },
  prefix: {
    type: String,
    default: '$ ',
  },
  execCommand: {
    type: Function,
    default: async (command) => `TODO 后台运行命令: ${command}`,
  },
})

const terminalRef = useTemplateRef('terminalRef')
onMounted(() => {
  terminalRef.value.pushMessage(welcome)
})
// 主题颜色
const theme = computed(() => isDark.value ? 'dark' : 'light')
</script>

<template>
  <terminal name="terminal"
            ref="terminalRef"
            :theme
            :show-header="false"
            :line-space="0"
            cursor-style="bar"
            context=""
            :context-suffix="prefix">
  </terminal>
</template>

<style lang="scss">
/* 提示颜色 */
.t-prompt {
  color: var(--el-color-primary);
}

/* padding 和 背景色修改 */
.t-window {
  padding: 10px !important;
  background-color: #EFEFEF !important;
}

/* 深色主题下的背景色 */
html.dark {
  .t-window {
    background-color: var(--t-main-background-color) !important;
  }
}

/* 字体设置 */
.t-window, .t-ask-input, .t-window p, .t-window div, .t-crude-font {
  font-family: var(--code-font) !important;
}
</style>