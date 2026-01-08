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
      '/server/': {base: '/server/', items: sidebarServer()},
    },
    footer: {
      message: `Links: 
             <a href="https://redis.tinycraft.cc" target="_blank">Tiny RDM</a> | 
             <a href="https://goanother.com/cn" target="_blank">Another RDM</a> | 
             <a href="https://redis.io/insight" target="_blank">Redis Insight</a>
             <br/><br/>
             Released under the MIT License`,
      copyright: 'Copyright © 2025-present All Rights Reserved. 沪ICP备2026000918号'
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
        {text: 'Changelog', link: '/changelog/1.x', activeMatch: '/changelog/'},
        {text: 'Redis Install', link: '/server/single', activeMatch: '/server/'}
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
        {text: 'Special Features', link: '/usage/special'},
        {text: 'Setting', link: '/usage/setting'},
        {text: 'Connection', link: '/usage/connection'},
        {text: 'Info', link: '/usage/info'},
        {text: 'Client', link: '/usage/client'},
        {text: 'Config', link: '/usage/config'},
        {text: 'Value', link: '/usage/value'},
        {text: 'Terminal', link: '/usage/terminal'},
        {text: 'Memory', link: '/usage/memory'},
        {text: 'SlowLog', link: '/usage/slowlog'},
        {text: 'Monitor', link: '/usage/monitor'},
        {text: 'Pub/Sub', link: '/usage/pubsub'},
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

function sidebarServer() {
  return [
    {
      text: 'Redis Install',
      items: [
        {text: 'Single', link: '/single'},
        {text: 'Cluster', link: '/cluster'},
        {text: 'SSL Cert', link: '/ssl'},
      ]
    },
  ]
}