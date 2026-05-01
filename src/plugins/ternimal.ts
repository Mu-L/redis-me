import type { App } from 'vue'
import type { Command, InputTipsSearchHandlerFunc } from 'vue-web-terminal'
import { createTerminal } from 'vue-web-terminal'

import type { MeXtermCommandItem } from '@/bindings/me-interface'

const terminal = createTerminal()

// 配置本地存储名
// default is 'terminal'
// terminal.configStoreName('terminal')

// 配置每个Terminal实例记忆历史指令的最大数量
// default is 100
// terminal.configMaxStoredCommandCountPerInstance(100)

// 配置自定义主题
// import customTheme from '/your-style-dir/terminal-custom-theme1.css?inline'
// terminal.configTheme('my-custom-theme', customTheme)

export default function setupTernimal(app: App): void {
  app.use(terminal)
}

/**
 * 自定义命令搜索提示处理函数（由 Qwen AI 辅助编写）
 *
 * 替代 vue-web-terminal 默认的简单前缀匹配，实现以下功能：
 * 1. 支持空格分隔的多词匹配（如输入 `config get` 精确匹配子命令）
 * 2. 智能回退逻辑（输入多余参数时不跳回宽泛列表）
 * 3. 多词同时高亮（如 `CONFIG` 和 `GET` 都会高亮）
 * 4. 排序与 vue-web-terminal 默认逻辑保持一致（完全匹配 > 大小写匹配 > 索引位置）
 */
export const handleInputTipsSearch: InputTipsSearchHandlerFunc = (
  command,
  _cursorIndex,
  commandStore,
  callback,
) => {
  const store = commandStore as MeXtermCommandItem[]
  if (!store || store.length === 0) {
    callback([], true)
    return
  }

  const inputTrimmed = command.trim()

  if (!inputTrimmed) {
    callback([], true)
    return
  }

  const inputParts = inputTrimmed.split(/\s+/).filter(p => p)
  const firstWord = inputParts[0].toLowerCase()
  const normalizedInput = inputParts.join(' ').toUpperCase()

  let matchedCommands: MeXtermCommandItem[] = []

  if (inputParts.length === 1) {
    matchedCommands = store.filter(cmd => cmd.key.toLowerCase().includes(firstWord))
  } else {
    let found = store.filter(cmd =>
      cmd.key.replace(/\s+/g, ' ').toUpperCase().startsWith(normalizedInput),
    )

    if (found.length === 0) {
      for (let i = inputParts.length - 1; i > 0; i--) {
        const shortInput = inputParts.slice(0, i).join(' ').toUpperCase()
        found = store.filter(cmd =>
          cmd.key.replace(/\s+/g, ' ').toUpperCase().startsWith(shortInput),
        )
        if (found.length > 0) break
      }
    }

    matchedCommands =
      found.length > 0 ? found : store.filter(cmd => cmd.key.toLowerCase().includes(firstWord))
  }

  const matchArray = matchedCommands.map(cmd => {
    const cmdKey = cmd.key
    const cmdKeyLower = cmdKey.toLowerCase()
    const score: [number, number, number, number, number] = [0, 0, 0, 0, 0]

    if (firstWord.length === cmdKey.length) {
      score[0] = 1
    } else {
      score[1] = cmdKey.includes(inputParts[0]) ? 1 : 0
      score[2] = cmdKeyLower.indexOf(firstWord)
      let count = 0
      let idx = cmdKeyLower.indexOf(firstWord)
      while (idx !== -1) {
        count++
        idx = cmdKeyLower.indexOf(firstWord, idx + firstWord.length)
      }
      score[3] = count
      score[4] = cmdKey.length
    }

    let content = cmdKey
    const highlights: { start: number; end: number }[] = []

    inputParts.forEach(part => {
      const partLower = part.toLowerCase()
      let startIdx = cmdKeyLower.indexOf(partLower)

      while (startIdx !== -1) {
        highlights.push({ start: startIdx, end: startIdx + part.length })
        startIdx = cmdKeyLower.indexOf(partLower, startIdx + part.length)
      }
    })

    highlights.sort((a, b) => a.start - b.start)

    const merged: { start: number; end: number }[] = []
    if (highlights.length > 0) {
      let current = highlights[0]
      for (let i = 1; i < highlights.length; i++) {
        if (highlights[i].start < current.end) {
          current.end = Math.max(current.end, highlights[i].end)
        } else {
          merged.push(current)
          current = highlights[i]
        }
      }
      merged.push(current)
    }

    let result = ''
    let lastIndex = 0
    merged.forEach(range => {
      result += cmdKey.substring(lastIndex, range.start)
      result += `<span class="t-cmd-key">${cmdKey.substring(range.start, range.end)}</span>`
      lastIndex = range.end
    })
    content = result + cmdKey.substring(lastIndex)

    return { item: cmd, content, score }
  })

  matchArray.sort((a, b) => {
    const scoreA = a.score
    const scoreB = b.score

    if (scoreA[0] === 1 && scoreA[0] === scoreB[0]) {
      return 0
    }
    if (scoreA[0] === 1) {
      return -1
    }
    if (scoreB[0] === 1) {
      return 1
    }
    if (scoreA[1] === scoreB[1]) {
      let res = scoreA[2] - scoreB[2]
      if (res === 0) {
        res = scoreB[3] - scoreA[3]
        if (res === 0) {
          res = scoreA[4] - scoreB[4]
        }
      }
      return res
    }
    return scoreB[1] - scoreA[1]
  })

  const tips = matchArray
    .slice(0, 20)
    .map(m => ({
      content: m.content,
      description: m.item.summary ?? m.item.description ?? m.item.usage ?? '',
      command: m.item as Command,
    }))

  callback(tips, tips.length > 0)
}
