import {defineAdditionalConfig} from 'vitepress'
import {version} from '../../package.json'

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
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    lastUpdated: {
      text: '最后更新于'
    },

    notFound: {
      title: '页面未找到',
      quote:
        '但如果你不改变方向，并且继续寻找，你可能最终会到达你所前往的地方。',
      linkLabel: '前往首页',
      linkText: '带我回首页'
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    skipToContentLabel: '跳转到内容'
  },
})

function nav() {
  return [
    {text: '主页', link: '/'},
    {text: '指南', link: '/guide'},
    {
      text: `v${version}`,
      items: [
        {text: '更新日志', link: '/changelog'}
      ]
    }
  ]
}

function sidebarGuide() {
  return []
}