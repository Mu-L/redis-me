<script setup>
import { computed } from 'vue'
import { isDark } from '@/utils/util.js'
import { Terminal } from 'vue-web-terminal'

const { welcome, prefix, execCommand, commandHelp } = defineProps({
  welcome: {
    type: String,
    default: '欢迎使用 Terminal',
  },
  prefix: {
    type: String,
    default: '$ ',
  },
  execCommand: {
    type: Function,
    default: async (command) => `TODO 后台运行命令: ${command}`,
  },
  commandHelp: {
    type: Array,
    defaults: [],
  },
})

const terminalRef = useTemplateRef('terminal')
onMounted(() => terminalRef.value.pushMessage(welcome))

// 命令执行
async function execCmd(_commandKey, command, success, _failed, _name) {
  const data = await execCommand(command)
  const message = { type: 'html', content: data }
  success(message)
}

// 主题颜色
const theme = computed(() => (isDark.value ? 'dark' : 'light'))

// 快捷键
// 上下历史记录，回车执行，Ctrl + A光标到行首 已内置支持
// 新增下面的键: F11 全屏, Ctrl + L/C/E 清屏/停止当前命令/光标到行尾
function onKeydown(e) {
  const key = e.key.toUpperCase()
  const term = terminalRef.value

  // 全屏
  if (e.key === 'F11') {
    term.fullscreen()
    return
  }

  // 其他快捷键
  if (!e.ctrlKey) return

  switch (key) {
    case 'L': // 清屏
      term.clearLog()
      term.pushMessage(welcome)
      term.setCommand('')
      break
    case 'C': // 停止当前命令 （但不能保留之前的命令）
      term.setCommand('')
      break
    //case 'A': // 光标到行首
    // 似乎已支持, 但只有Ctrl键弹起时才生效（可能跟浏览器自带的全选有关系）
    //  break
    case 'E': // 光标到行尾
      term.setCommand(term.getCommand())
      break
  }
}
</script>

<template>
  <terminal
    name="terminal"
    ref="terminal"
    @exec-cmd="execCmd"
    @on-keydown="onKeydown"
    :theme
    :show-header="false"
    :line-space="2"
    cursor-style="bar"
    context=""
    :command-store="commandHelp"
    :context-suffix="prefix"
  >
  </terminal>
</template>

<style lang="scss">
/* 提示颜色 */
//.t-prompt {
//  color: var(--el-color-primary);
//}

/* help命令表格默认15px改为5px */
.t-table,
.t-table tr,
.t-table td,
.t-table tbody,
.t-table thead {
  padding: 5px !important;
}

/* 帮助手册 */
.t-cmd-help {
  top: 5px !important;
  right: 5px !important;
}

/* padding 和 背景色修改 */
.t-window {
  padding: 5px 5px 5px 20px !important;
  background-color: #efefef !important;
}

/* 深色主题下的背景色 */
html.dark {
  .t-window {
    background-color: var(--t-main-background-color) !important;
  }
}

/* 字体设置 */
code,
.t-window,
.t-ask-input,
.t-window p,
.t-window div,
.t-crude-font {
  font-family: var(--code-font) !important;
}
</style>
