import {defineAdditionalConfig} from 'vitepress'

export default defineAdditionalConfig({
  lang: 'zh-Hans',
  description: 'RedisME 官方站点',
  themeConfig: {
    nav: nav(),
    sidebar: {
      '/guide/': {base: '/guide/', items: sidebarGuide()},
    },
    footer: {
      message: '友情链接 <a href="https://redis.tinycraft.cc/zh/" target="_blank">TinyRDM</a> | <a href="https://xterminal.cn/" target="_blank">XTerminal</a> <br/><br/>基于GPL-3.0开源许可协议',
      copyright: 'Copyright © 2025-present All Rights Reserved'
    }
  },
})

function nav() {
  return [
    {text: '主页', link: '/'},
    {text: '指南', link: '/guide'},
    {
      text: 'v1.0.0',
      items: [
        {text: '更新日志', link: '/changelog'}
      ]
    }
  ]
}

function sidebarGuide() {
  return []
}