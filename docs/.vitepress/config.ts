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
    ]
  }
})
