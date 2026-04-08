<script setup>
// 跳转到官网: Redis中英文/Valkey中英文
import { openUrl } from '@tauri-apps/plugin-opener'

import { isZh, meOk } from '@/utils/util.js'

const { to } = defineProps({
  to: { type: String, required: true },
  placement: { type: String, default: 'right' },
  marginLeft: { type: String, default: '10px' },
})

const websize = {
  redis: 'https://redis.io',
  'redis-zh': 'https://redis.ac.cn',
  valkey: 'https://valkey.io',
  'valkey-zh': 'https://valkey.cn',
}

const info = {
  redis: '/docs/latest/commands/info/',
  'redis-zh': '/docs/latest/commands/info/',
  valkey: '/commands/info/',
  'valkey-zh': '/commands/info/',
}

const config = {
  redis: '/docs/latest/operate/oss_and_stack/management/config/',
  'redis-zh': '/docs/latest/operate/oss_and_stack/management/config/',
  valkey: '/topics/valkey.conf/',
  'valkey-zh': '/topics/valkey.conf/',
}

const client = {
  redis: '/docs/latest/commands/client-list/',
  'redis-zh': '/docs/latest/commands/client-list/',
  valkey: '/commands/client-list/',
  'valkey-zh': '/commands/client-list/',
}

const command = {
  redis: '/docs/latest/commands/',
  'redis-zh': '/docs/latest/commands/',
  valkey: '/commands/',
  'valkey-zh': '/commands/',
}

function handleCommand(cmd) {
  if (to === 'info') {
    openUrl(websize[cmd] + info[cmd])
  } else if (to === 'config') {
    openUrl(websize[cmd] + config[cmd])
  } else if (to === 'client') {
    openUrl(websize[cmd] + client[cmd])
  } else if (to === 'command') {
    openUrl(websize[cmd] + command[cmd])
  } else {
    meOk(`TODO: ${cmd}`)
  }
}
</script>

<template>
  <el-dropdown @command="handleCommand" trigger="hover" :placement :style="{ marginLeft }">
    <me-icon icon="me-icon-link" style="font-size: 14px; color: var(--el-color-success)" />
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="redis">
          <me-icon icon="me-icon-redis" name="Redis"
        /></el-dropdown-item>
        <el-dropdown-item command="valkey"
          ><me-icon icon="me-icon-valkey" name="Valkey"
        /></el-dropdown-item>
        <el-dropdown-item command="redis-zh" v-if="isZh"
          ><me-icon icon="me-icon-redis" name="Redis 中文"
        /></el-dropdown-item>
        <el-dropdown-item command="valkey-zh" v-if="isZh"
          ><me-icon icon="me-icon-valkey" name="Valkey 中文"
        /></el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
