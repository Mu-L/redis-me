<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'

import { version } from '../../../../package.json'
import Apple from './icon/Apple.vue'
import Linux from './icon/Linux.vue'
import Windows from './icon/Windows.vue'

const { lang } = useData()
const isZh = computed(() => lang.value.startsWith('zh'))
const downloadText = computed(() => (isZh.value ? '下载安装' : 'Download'))
const viewText = computed(() => (isZh.value ? '进入Github' : 'View on GitHub'))
const gitHost = computed(() => (isZh.value ? 'gitee' : 'github'))

function downloadLink(fileName) {
  return `https://${gitHost.value}.com/hepengju/redis-me/releases/download/v${version}/${fileName}`
}

const downloadMenu = computed(() => {
  return [
    {
      text: 'Windows x64 (.exe)',
      link: downloadLink(`RedisME_${version}_x64-setup.exe`),
      icon: Windows,
    },
    {
      text: 'Windows arm64 (.exe)',
      link: downloadLink(`RedisME_${version}_arm64-setup.exe`),
      icon: Windows,
    },
    {
      text: 'MacOS x64 (.dmg)',
      link: downloadLink(`RedisME_${version}_x64.dmg`),
      icon: Apple,
    },
    {
      text: 'MacOS arm64 (.dmg)',
      link: downloadLink(`RedisME_${version}_aarch64.dmg`),
      icon: Apple,
    },
    {
      text: 'Linux amd64 (.deb)',
      link: downloadLink(`RedisME_${version}_amd64.deb`),
      icon: Linux,
    },
    {
      text: 'Linux amd64 (.rpm)',
      link: downloadLink(`RedisME-${version}-1.x86_64.rpm`),
      icon: Linux,
    },
    {
      text: 'Linux amd64 (.AppImage)',
      link: downloadLink(`RedisME_${version}_amd64.AppImage`),
      icon: Linux,
    },
  ]
})
</script>

<template>
  <div class="actions">
    <div class="action">
      <a class="action-button brand dropdown-button">
        <span class="download-icon" />
        <span>{{ downloadText }}</span>
      </a>
      <ul class="dropdown-menu">
        <li v-for="(m, i) in downloadMenu" :key="i" style="font-size: 14px">
          <component :is="m.icon" />
          <a :href="m.link" target="_blank">{{ m.text }}</a>
        </li>
      </ul>
    </div>
    <div class="action">
      <a
        class="action-button alt"
        href="https://github.com/hepengju/redis-me"
        rel="noreferrer"
        target="_blank">
        <span class="github-icon" />
        <span>{{ viewText }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
}

.action {
  flex-shrink: 0;
  padding: 6px;
}

@media (min-width: 640px) {
  .actions {
    padding-top: 32px;
  }
}

@media (min-width: 960px) {
  .actions {
    justify-content: flex-start;
  }
}

.action-button.brand {
  border-color: var(--vp-button-brand-border);
  color: var(--vp-button-brand-text);
  background-color: var(--vp-button-brand-bg);
}

.action-button.alt {
  border-color: var(--vp-button-alt-border);
  color: var(--vp-button-alt-text);
  /*background-color: var(--vp-button-alt-bg);*/
}

.action-button {
  border-radius: 10px;
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;
  display: inline-block;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  transition:
    color 0.25s,
    border-color 0.25s,
    background-color 0.25s;
  cursor: pointer;
}

.action:hover .dropdown-menu {
  display: block;
}

.dropdown-menu {
  position: absolute;
  list-style-type: none;
  margin: 5px 0 0;
  padding: 5px;
  border-radius: 10px;
  border: 1px solid var(--vp-button-brand-border);
  background-color: var(--vp-button-brand-bg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
  display: none;
}

.dropdown-menu li {
  padding: 8px 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  color: var(--vp-button-brand-text);
}

.dropdown-menu li:hover {
  background-color: #f0f0f066;
  border-radius: 10px;
}

/* 新增a标签图标 */
.action a {
  display: flex;
  align-items: center;
}

.github-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  -webkit-mask-image: var(--svg);
  mask-image: var(--svg);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='black' d='M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/%3E%3C/svg%3E");

  margin-right: 8px;
}

.download-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  -webkit-mask-image: var(--svg);
  mask-image: var(--svg);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='black' d='M10.797 14.182H3.635L16.728 0l-3.525 9.818h7.162L7.272 24l3.524-9.818Z'/%3E%3C/svg%3E");

  margin-right: 8px;
  margin-left: -10px;
}
</style>
