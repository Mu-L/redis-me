import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RedisME',
  description: 'RedisME Official Website',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/images/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/images/logo.png' }],
  ],
  themeConfig: {
    logo: '/images/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hepengju/redis-me' },
      { icon: 'gitee', link: 'https://gitee.com/hepengju/redis-me' },
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
  },

  // 多语言设置, 其中英文为默认语言（重写路径）
  locales: {
    root: { label: 'English', lang: 'en-US' },
    zh: { label: '简体中文', lang: 'zh-Hans' }, // zh-Hans 简体中文
  },
  rewrites: {
    'en/:rest*': ':rest*',
  },

  // 显示最后更新时间
  lastUpdated: false,
  // srcExclude: ['latest.json', '/zz/**'],
})
