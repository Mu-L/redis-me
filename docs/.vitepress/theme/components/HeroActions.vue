<script setup>
import {computed} from 'vue'
import {useData} from 'vitepress'
import Windows from './icon/Windows.vue'
import Apple from './icon/Apple.vue'
import Linux from './icon/Linux.vue'
import {version} from '../../../../package.json'

const {lang} = useData()
const isZh = computed(() => lang.value.startsWith('zh'))
const downloadText = computed(() => isZh.value ? '下载安装' : 'Download')
const viewText = computed(() => isZh.value ? '进入Github' : 'View On GitHub')
const gitHost = computed(() => isZh.value ? 'gitee' : 'github')

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
      text: 'macOS Apple (.dmg)',
      link: downloadLink(`RedisME_${version}_aarch64.dmg`),
      icon: Apple,
    },
    {
      text: 'macOS Intel (.dmg)',
      link: downloadLink(`RedisME_${version}_x64.dmg`),
      icon: Apple,
    },
    {
      text: 'Linux (.deb)',
      link: downloadLink(`RedisME_${version}_amd64.deb`),
      icon: Linux,
    },
    {
      text: 'Linux (.rpm)',
      link: downloadLink(`RedisME-${version}-1.x86_64.rpm`),
      icon: Linux,
    },
    {
      text: 'Linux (.AppImage)',
      link: downloadLink(`RedisME_${version}_amd64.AppImage`),
      icon: Linux,
    },
  ]
})
</script>

<template>
  <div class="actions">
    <div class="action">
      <a class="action-button brand dropdown-button">{{ downloadText }}</a>
      <ul class="dropdown-menu">
        <li v-for="(m, i) in downloadMenu" :key="i" style="font-size: 14px">
          <component :is="m.icon"/>
          <a :href="m.link" target="_blank">{{ m.text }}</a>
        </li>
      </ul>
    </div>
    <div class="action">
      <a class="action-button alt" href="https://github.com/hepengju/redis-me" rel="noreferrer" target="_blank">
        {{ viewText }}
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
  background-color: var(--vp-button-alt-bg);
}

.action-button {
  border-radius: 20px;
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;
  display: inline-block;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
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
</style>
