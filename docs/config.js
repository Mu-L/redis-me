import {defineAdditionalConfig} from 'vitepress'
import {version} from '../package.json'

export default defineAdditionalConfig({
  lang: 'en-US',
  description: 'RedisME Official Website',
  themeConfig: {
    nav: nav(),
    sidebar: {
      '/guide/': {base: '/guide/', items: sidebarGuide()},
      '/changelog/': {base: '/changelog/', items: sidebarChangelog()},
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
    {text: 'Guide', link: '/guide', activeMatch: '/guide/'},
    {
      text: `v${version}`,
      items: [
        {text: 'Changelog', link: '/changelog/1.x', activeMatch: '/changelog/'}
      ]
    }
  ]
}

function sidebarGuide() {
  return []
}

function sidebarChangelog(){
  return [
    {
      text: 'Changelog',
      items: [
        {text: '1.x', link: '1.x'},
        {text: '0.x', link: '0.x'},
      ]
    }
  ]
}
