<script setup lang="ts">
import { inject } from 'vue'

import { shareProvideKey } from '@/types/me-interface'
import type { RedisKey_Deserialize } from '@/types/tauri-specta'
import { meCommands, meKeyShort, meType } from '@/utils/util'

const share = inject(shareProvideKey)!
const props = defineProps<{
  /** 树虚拟列表更新时可能短暂缺失，避免 prop 校验告警 */
  redisKey?: (RedisKey_Deserialize & { keyType?: string }) | null
}>()

if (props.redisKey && !props.redisKey.keyType && share.conn) {
  try {
    const data = await meCommands.keyType(share.conn!.id, props.redisKey)
    props.redisKey.keyType = data?.toUpperCase()
  } catch {}
}
</script>

<template>
  <el-tag
    v-if="redisKey"
    size="small"
    disable-transitions
    :type="meType(redisKey.keyType)"
    effect="dark">
    {{ meKeyShort(redisKey.keyType) }}
  </el-tag>
  <el-tag v-else size="small" disable-transitions type="info" effect="dark">?</el-tag>
</template>
