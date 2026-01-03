import {defineAdditionalConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineAdditionalConfig({
  description: 'RedisME Official Website',
  themeConfig: {
    nav: [
      {text: 'Home', link: '/'},
      {text: 'Guide', link: '/guide'},
      {text: 'Changelog', link: '/changelog'},
    ],
    sidebar: [],
    footer: {
      message: 'Links: <a href="https://redis.tinycraft.cc/zh/" target="_blank">TinyRDM</a> | <a href="https://xterminal.cn/" target="_blank">XTerminal</a> <br/><br/>Released under the MIT License',
      copyright: 'Copyright © 2025-present All Rights Reserved'
    }
  },
})
