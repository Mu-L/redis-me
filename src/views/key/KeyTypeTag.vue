<script setup lang="ts">
import { inject } from 'vue'

import type { AppMainShare } from '@/types/me-interface'
import type { RedisKey_Deserialize } from '@/types/tauri-specta'
import { meCommands, meKeyShort, meType } from '@/utils/util'

const share = inject('share') as AppMainShare
const props = defineProps<{
  redisKey: RedisKey_Deserialize & { keyType?: string }
}>()

if (!props.redisKey.keyType && share.conn) {
  try {
    const data = await meCommands.keyType(share.conn.id, props.redisKey)
    props.redisKey.keyType = data?.toUpperCase()
  } catch {}
}
</script>

<template>
  <el-tag size="small" disable-transitions :type="meType(redisKey.keyType)" effect="dark">
    {{ meKeyShort(redisKey.keyType) }}
  </el-tag>
</template>
