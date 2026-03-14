import {defineConfig} from 'vite-plus'
import vue from '@vitejs/plugin-vue'
import UnpluginSvgComponent from 'unplugin-svg-component/vite'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  lint: {"options":{"typeAware":true,"typeCheck":true}},
  resolve: {
      alias: {
          // 配置绝对路径别名@
          '@': path.resolve(import.meta.dirname, 'src')
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
          prefix: 'me-icon'
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
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 2221,
        }
        : undefined,
      watch: {
          // 3. tell vite to ignore watching `src-tauri`
          ignored: ["**/dist/**", "**/src-tauri/**"],
      },
  },
})
