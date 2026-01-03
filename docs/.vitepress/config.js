import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RedisME',
  description: 'RedisME Official Website',
  head: [
    ['link', {rel: 'icon', type: 'image/svg+xml', href: '/image/logo.svg'}],
    ['link', {rel: 'icon', type: 'image/png', href: '/image/logo.png'}]
  ],
  themeConfig: {
    logo: '/image/logo.svg',
    socialLinks: [
      {icon: 'github', link: 'https://github.com/hepengju/redis-me'},
    ],
    search: {
      provider: 'local'
    },
  },

  rewrites: {
    'en/:rest*': ':rest*'
  },
  locales: {
    root: { label: 'English', lang: 'en-US' },
    zh: { label: '简体中文', lang: 'zh-Hans' }, // zh-Hans 简体中文
  },
  srcExclude: ['latest.json', '/zz/**'],
})