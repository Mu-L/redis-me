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
      message: `Links: 
             <a href="https://redis.tinycraft.cc" target="_blank">Tiny RDM</a> | 
             <a href="https://goanother.com/cn" target="_blank">Another RDM</a> | 
             <a href="https://redis.io/insight" target="_blank">Redis Insight</a>
             <br/><br/>
             Released under the MIT License`,
      copyright: 'Copyright © 2025-present All Rights Reserved'
    }
  },
})

function nav() {
  return [
    {text: 'Home', link: '/'},
    {text: 'Guide', link: '/guide/intro/about', activeMatch: '/guide/'},
    {
      text: `v${version}`,
      items: [
        {text: 'Changelog', link: '/changelog/1.x', activeMatch: '/changelog/'}
      ]
    }
  ]
}

function sidebarGuide() {
  return [
    {
      text: 'Introduction',
      items: [
        {text: 'About', link: '/intro/about'},
        {text: 'Installation', link: '/intro/install'},
      ]
    },
    {
      text: 'Usage and Configuration',
      items: [
        {text: 'Connection', link: '/usage/connection'},
        {text: 'Info', link: '/usage/info'},
        {text: 'Value', link: '/usage/value'},
        {text: 'Terminal', link: '/usage/terminal'},
      ]
    },
    {
      text: 'Redis Server',
      items: [
        {text: 'Single', link: '/server/single'},
        {text: 'Cluster', link: '/server/cluster'},
        {text: 'SSL', link: '/server/ssl'},
      ]
    },
    {
      text: 'Other',
      items: [
        {text: 'Q&A', link: '/other/faq'},
        {text: 'Privacy Policy', link: '/other/privacy'}
      ]
    }
  ]
}

function sidebarChangelog() {
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
