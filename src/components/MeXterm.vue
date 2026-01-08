<script setup lang="ts">
// 说明: 基于Xterm的自定义终端组件
import {computed, onMounted, onUnmounted, watch} from 'vue'
import {useDark} from "@vueuse/core"
import 'xterminal/dist/xterminal.css'
import XTerminal from 'xterminal'

// TODO 命令提示
const {welcome, prefix, execCommand} = defineProps({
  welcome: {
    type: String,
    default: '欢迎使用 RedisME Terminal',
  },
  prefix: {
    type: String,
    default: '$ ',
  },
  execCommand: {
    type: Function,
    default: async (command: string) => `TODO 后台运行命令: ${command}`,
  },
})

watch(() => prefix, () => prompt())

const term = new XTerminal()

// 处理命令
term.on('data', async (data) => {
  if (data) {
    term.pause()
    const result = await execCommand(data)
    term.write(result)
    prompt()
  } else {
    prompt(false, false)
  }
})

// 追加额外快捷键
term.on('keypress', e => {
  const key = e.key.toLowerCase();
  // 上下历史记录，回车执行，Ctrl + A光标到行首 已内置支持

  // 新增下面的键: Ctrl + L/C/E 清屏/停止当前命令/光标到行尾
  if (e.ctrlKey && key === 'l') { // Ctrl + L 清屏
    term.clear()
    prompt(true)
  } else if (e.ctrlKey && key === 'c') {  // Ctrl + C 取消命令
    // TODO 暂无法删除用户的输入
    //term.write('^C')
    //prompt()
  }
})


onMounted(() => {
  term.mount('#terminal')
  prompt(true)
})
onUnmounted(() => term?.dispose())

// 命令行提示符
function prompt(printWelcome = false, printlnPrefix = true) {
  if (printWelcome) {
    term.write(welcome)
  }

  if (printlnPrefix) {
    term.writeln('')
  }

  term.write(prefix)
  term.resume()
  term.focus()
}

// 主题颜色
const isDark = useDark()
const terminalClass = computed(() => isDark.value ? 'dark' : '')
</script>

<template>
  <div id="terminal" :class="terminalClass"></div>
</template>

<style scoped lang="scss">
#terminal {
  --xt-font-family: var(--code-font);
  --xt-bg: #efefef;
  --xt-fg: #191a22;
}

#terminal.dark {
  --xt-bg: #191a22;
  --xt-fg: #efefef;
}
</style>
