<script setup>
// 跳转到官网: Redis中英文/Valkey中英文
import { openUrl } from '@tauri-apps/plugin-opener'

import { isZh, meOk } from '@/utils/util.js'

const { to } = defineProps({
  to: { type: String, required: true },
  placement: { type: String, default: 'right' },
  marginLeft: { type: String, default: '10px' },
})


// 官网站点
const websize = {
  redis: 'https://redis.io',
  'redis-zh': 'https://redis.ac.cn',
  valkey: 'https://valkey.io',
  'valkey-zh': 'https://valkey.cn',
}

// 信息命令
const info = {
  redis: '/docs/latest/commands/info/',
  valkey: '/commands/info/',
}

// 配置文件
const config = {
  redis: '/docs/latest/operate/oss_and_stack/management/config/',
  valkey: '/topics/valkey.conf/',
}

// 客户端列表
const client = {
  redis: '/docs/latest/commands/client-list/',
  valkey: '/commands/client-list/',
}

// 命令列表
const command = {
  redis: '/docs/latest/commands/',
  valkey: '/commands/',
}

function handleCommand(cmd) {
  let part = cmd.split('-')[0]
  if (to === 'info') {
    openUrl(websize[cmd] + info[part])
  } else if (to === 'config') {
    openUrl(websize[cmd] + config[part])
  } else if (to === 'client') {
    openUrl(websize[cmd] + client[part])
  } else if (to === 'command') {
    openUrl(websize[cmd] + command[part])
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
