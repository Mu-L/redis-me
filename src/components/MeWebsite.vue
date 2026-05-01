<script setup lang="ts">
// 跳转到官网: Redis中英文/Valkey中英文
import { openUrl } from '@tauri-apps/plugin-opener'

import { isZh, meOk } from '@/utils/util'

const props = withDefaults(
  defineProps<{
    to: string
    placement?: string
    marginLeft?: string
  }>(),
  {
    placement: 'right',
    marginLeft: '10px',
  },
)

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

// 慢日志命令
const slowlog = {
  redis: '/docs/latest/commands/slowlog-get/',
  valkey: '/commands/slowlog-get/',
}

// 监控命令
const monitor = {
  redis: '/docs/latest/commands/monitor/',
  valkey: '/commands/monitor/',
}

// 发布订阅命令
const pubsub = {
  redis: '/docs/latest/commands/psubscribe/',
  valkey: '/commands/psubscribe/',
}

function handleCommand(cmd: string): void {
  const part = cmd.split('-')[0] as keyof typeof info
  const base = websize[cmd as keyof typeof websize]
  void openUrl(base + info[part])
  if (props.to === 'info') {
    void openUrl(base + info[part])
  } else if (props.to === 'config') {
    void openUrl(base + config[part])
  } else if (props.to === 'client') {
    void openUrl(base + client[part])
  } else if (props.to === 'command') {
    void openUrl(base + command[part])
  } else if (props.to === 'slowlog') {
    void openUrl(base + slowlog[part])
  } else if (props.to === 'monitor') {
    void openUrl(base + monitor[part])
  } else if (props.to === 'pubsub') {
    void openUrl(base + pubsub[part])
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
