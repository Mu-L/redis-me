import {defineAdditionalConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineAdditionalConfig({
  description: 'RedisME 官方站点',
  themeConfig: {
    nav: [
      {text: '主页', link: '/'},
      {text: '使用指南', link: '/guide'},
      {text: '更新日志', link: '/changelog'},
    ],
    sidebar: [],
    footer: {
      message: '友情链接 <a href="https://redis.tinycraft.cc/zh/" target="_blank">TinyRDM</a> | <a href="https://xterminal.cn/" target="_blank">XTerminal</a> <br/><br/>基于GPL-3.0开源许可协议',
      copyright: 'Copyright © 2025-present All Rights Reserved'
    }
  },
})
