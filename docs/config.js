import {defineAdditionalConfig} from 'vitepress'

export default defineAdditionalConfig({
  lang: 'en-US',
  description: 'RedisME Official Website',
  themeConfig: {
    nav: nav(),
    sidebar: {
      '/guide/': {base: '/guide/', items: sidebarGuide()},
    },
    footer: {
      message: 'Links: <a href="https://redis.tinycraft.cc/zh/" target="_blank">TinyRDM</a> | <a href="https://xterminal.cn/" target="_blank">XTerminal</a> <br/><br/>Released under the MIT License',
      copyright: 'Copyright © 2025-present All Rights Reserved'
    }
  },
})

function nav() {
  return [
    {text: 'Home', link: '/'},
    {text: 'Guide', link: '/guide'},
    {
      text: 'v1.0.0',
      items: [
        {text: 'Changelog', link: '/changelog'}
      ]
    }
  ]
}

function sidebarGuide() {
  return []
}
