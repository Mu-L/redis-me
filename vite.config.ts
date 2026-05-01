import * as path from 'path'

import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import UnpluginSvgComponent from 'unplugin-svg-component/vite'
import { defineConfig } from 'vite-plus'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig({
  staged: { '*': 'vp check --fix' },
  lint: {
    // 生成文件含 serde_json 递归类型，当前导出器未生成 Value 别名，避免类型检查误报
    ignorePatterns: ['src/bindings/**'],
    options: { typeAware: true, typeCheck: true },
  },

  // 这个选项目前验证只能在ts文件中才会生效，否则报错（应该是vp的bug）
  // 配置选项: https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html
  fmt: {
    // tauri-specta 生成文件，格式与 oxfmt 规则不一致，避免每次导出后触发 check 失败
    ignorePatterns: ['src/bindings/**'],
    arrowParens: 'avoid', // 单参数箭头函数去掉括号
    bracketSameLine: true, // 把html的>放在同一行
    objectWrap: 'collapse', // 可以显示在一行的对象字面量不要换行
    semi: false, // 去掉分号
    singleQuote: true, // 使用单引号
    jsxSingleQuote: true, // jsx使用单引号
    sortImports: true,
  },

  resolve: {
    alias: {
      // 配置绝对路径别名@
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },

  plugins: [
    vue(),

    AutoImport({
      imports: ['vue'], // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
    }),

    // SVG图标: 解决IconsResolver无法动态引入图标的问题
    // https://github.com/Jevon617/unplugin-svg-component
    UnpluginSvgComponent({
      iconDir: ['src/assets/icons'],
      preserveColor: '',
      treeShaking: false,
      prefix: 'me-icon',
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 2222,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 2221 } : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/dist/**', '**/src-tauri/**'],
    },
  },
})
