<script setup>
import { computed } from 'vue'
import { Terminal } from 'vue-web-terminal'

import { isDark } from '@/utils/util.js'

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
    default: async command => `TODO 后台运行命令: ${command}`,
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
// 新增下面的键: F11 全屏, Ctrl + C 停止当前命令
// vue-web-terminal 3.4.2 新增：内置快捷键：清屏（Ctrl+L），光标跳转行首（Ctrl+A），光标跳转行尾（Ctrl+E），清除输入（Ctrl+U）
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
  }
}

/**
 * 自定义命令搜索提示处理函数（由 Qwen AI 辅助编写）
 *
 * 替代 vue-web-terminal 默认的简单前缀匹配，实现以下功能：
 * 1. 支持空格分隔的多词匹配（如输入 `config get` 精确匹配子命令）
 * 2. 智能回退逻辑（输入多余参数时不跳回宽泛列表）
 * 3. 多词同时高亮（如 `CONFIG` 和 `GET` 都会高亮）
 * 4. 排序与 vue-web-terminal 默认逻辑保持一致（完全匹配 > 大小写匹配 > 索引位置）
 *
 * @param {string} command - 当前用户输入的完整命令行
 * @param {number} _cursorIndex - 当前光标所处位置（未使用）
 * @param {Array} commandStore - 命令集合
 * @param {Function} callback - 搜索结束回调，格式为 (tips: InputTipItem[], openTips?: boolean) => void
 */
function handleInputTipsSearch(command, _cursorIndex, commandStore, callback) {
  if (!commandStore || commandStore.length === 0) {
    callback([], true)
    return
  }

  // 获取用户输入的内容（直接使用 command，与 vue-web-terminal 默认行为一致）
  const inputTrimmed = command.trim()

  if (!inputTrimmed) {
    callback([], true)
    return
  }

  const inputParts = inputTrimmed.split(/\s+/).filter(p => p)
  const firstWord = inputParts[0].toLowerCase()
  // 使用单个空格连接,避免多个空格导致匹配失败
  const normalizedInput = inputParts.join(' ').toUpperCase()

  let matchedCommands = []

  if (inputParts.length === 1) {
    // 单个词,包含匹配
    matchedCommands = commandStore.filter(cmd => cmd.key.toLowerCase().includes(firstWord))
  } else {
    // 多个词,尝试严格前缀匹配 (对命令关键字段做空格归一化,防止多余空格导致匹配失败)
    let found = commandStore.filter(cmd =>
      cmd.key.replace(/\s+/g, ' ').toUpperCase().startsWith(normalizedInput),
    )

    // 如果完全没匹配到（通常是参数输错或多输了单词），尝试缩短输入寻找最精确的命令前缀
    // 例如输入 "config get save"，虽然没有命令以它开头，但 "config get" 是匹配的
    // 这样能保持列表聚焦在 "config get"，而不会跳回显示 "config" 或消失
    if (found.length === 0) {
      for (let i = inputParts.length - 1; i > 0; i--) {
        const shortInput = inputParts.slice(0, i).join(' ').toUpperCase()
        found = commandStore.filter(cmd =>
          cmd.key.replace(/\s+/g, ' ').toUpperCase().startsWith(shortInput),
        )
        if (found.length > 0) break
      }
    }

    matchedCommands =
      found.length > 0
        ? found
        : commandStore.filter(cmd => cmd.key.toLowerCase().includes(firstWord))
  }

  // 转换为提示项格式,并添加高亮效果(与 vue-web-terminal 默认高亮一致)
  const matchArray = matchedCommands.map(cmd => {
    const cmdKey = cmd.key
    const cmdKeyLower = cmdKey.toLowerCase()
    // 匹配分数集合:[是否完全匹配,是否大小写完全匹配,首个匹配索引位置,匹配次数,源字符串长度]
    const score = [0, 0, 0, 0, 0]

    if (firstWord.length === cmdKey.length) {
      // 完全匹配
      score[0] = 1
    } else {
      score[1] = cmdKey.includes(inputParts[0]) ? 1 : 0
      score[2] = cmdKeyLower.indexOf(firstWord)
      // 计算匹配次数
      let count = 0
      let idx = cmdKeyLower.indexOf(firstWord)
      while (idx !== -1) {
        count++
        idx = cmdKeyLower.indexOf(firstWord, idx + firstWord.length)
      }
      score[3] = count
      score[4] = cmdKey.length
    }

    // 高亮所有匹配部分
    let content = cmdKey

    // 收集所有需要高亮的区间 [start, end]
    const highlights = []

    // 为了处理大小写不敏感，我们转小写来查找
    // 注意：这里使用 cmdKeyLower 变量，前面已经定义过 const cmdKeyLower = cmdKey.toLowerCase()

    inputParts.forEach(part => {
      const partLower = part.toLowerCase()
      let startIdx = cmdKeyLower.indexOf(partLower)

      // 查找所有出现的位置
      while (startIdx !== -1) {
        highlights.push({ start: startIdx, end: startIdx + part.length })
        startIdx = cmdKeyLower.indexOf(partLower, startIdx + part.length)
      }
    })

    // 按起始位置排序
    highlights.sort((a, b) => a.start - b.start)

    // 合并重叠区间
    const merged = []
    if (highlights.length > 0) {
      let current = highlights[0]
      for (let i = 1; i < highlights.length; i++) {
        if (highlights[i].start < current.end) {
          // 重叠或相邻，扩展当前区间
          current.end = Math.max(current.end, highlights[i].end)
        } else {
          merged.push(current)
          current = highlights[i]
        }
      }
      merged.push(current)
    }

    // 构建最终字符串
    let result = ''
    let lastIndex = 0
    merged.forEach(range => {
      result += cmdKey.substring(lastIndex, range.start)
      result += `<span class="t-cmd-key">${cmdKey.substring(range.start, range.end)}</span>`
      lastIndex = range.end
    })
    content = result + cmdKey.substring(lastIndex)

    return {
      item: cmd,
      content,
      score,
    }
  })

  // 排序逻辑(与 vue-web-terminal 默认一致)
  matchArray.sort((a, b) => {
    const scoreA = a.score
    const scoreB = b.score

    // 都完全匹配
    if (scoreA[0] === 1 && scoreA[0] === scoreB[0]) {
      return 0
    }
    // a完全匹配
    if (scoreA[0] === 1) {
      return -1
    }
    // b完全匹配
    if (scoreB[0] === 1) {
      return 1
    }
    // 均不完全匹配
    if (scoreA[1] === scoreB[1]) {
      // 匹配索引位置越靠左越优先展示
      let res = scoreA[2] - scoreB[2]
      if (res === 0) {
        // 匹配次数越多越优先展示
        res = scoreB[3] - scoreA[3]
        // 匹配源字符长度越短越优先展示
        if (res === 0) {
          res = scoreA[4] - scoreB[4]
        }
      }
      return res
    }
    // 大小写完全匹配的优先展示
    return scoreB[1] - scoreA[1]
  })

  const tips = matchArray.slice(0, 20).map(m => ({
    content: m.content,
    description: m.item.summary || m.item.usage || '',
    command: m.item,
  }))

  callback(tips, tips.length > 0)
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
    :input-tips-search-handler="handleInputTipsSearch"
    :context-suffix="prefix">
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
