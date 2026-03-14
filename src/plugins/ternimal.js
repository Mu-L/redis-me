import { createTerminal } from 'vue-web-terminal'

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

export default function (app) {
  app.use(terminal)
}
