import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RedisME',
  description: 'RedisME Doc Site',
  head: [
    ['link', {rel: 'icon', type: 'image/svg+xml', href: '/image/logo.svg'}],
    ['link', {rel: 'icon', type: 'image/png', href: '/image/logo.png'}]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/image/logo.svg',
    nav: [
      {text: '主页', link: '/'},
      {text: '使用指南', link: '/guide'}
    ],
    sidebar: [],
    socialLinks: [
      {icon: 'github', link: 'https://github.com/hepengju/redis-me'}
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: '友情链接 <a href="https://redis.tinycraft.cc/zh/" target="_blank">TinyRDM</a> | <a href="https://xterminal.cn/" target="_blank">XTerminal</a> <br/><br/>基于GPL-3.0开源许可协议',
      copyright: 'Copyright © 2025 All Rights Reserved'
    }
  }
})
