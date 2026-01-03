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

  // 多语言设置, 其中英文为默认语言（重写路径）
  locales: {
    root: { label: 'English', lang: 'en-US' },
    zh: { label: '简体中文', lang: 'zh-Hans' }, // zh-Hans 简体中文
  },
  rewrites: {
    'en/:rest*': ':rest*'
  },

  // 显示最后更新时间
  lastUpdated: true,

  srcExclude: ['latest.json', '/zz/**'],
})