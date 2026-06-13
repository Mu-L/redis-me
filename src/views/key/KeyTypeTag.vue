<script setup lang="ts">
import { inject, ref, watch } from 'vue'

import { shareProvideKey } from '@/types/me-interface'
import type { RedisKey_Deserialize } from '@/types/tauri-specta'
import { meCommands, meKeyShort, meType } from '@/utils/util'

const share = inject(shareProvideKey)!
const props = defineProps<{
  /** 树虚拟列表更新时可能短暂缺失，避免 prop 校验告警 */
  redisKey?: RedisKey_Deserialize | null
}>()

const keyType = ref<string | undefined>()

// scan 结果无 keyType；虚拟列表会复用实例，redisKey 换引用时需重新拉取
watch(
  () => props.redisKey,
  async rk => {
    if (!rk || !share.conn) {
      keyType.value = undefined
      return
    }
    try {
      keyType.value = (await meCommands.keyType(share.conn.id, rk))?.toUpperCase()
    } catch {
      keyType.value = undefined
    }
  },
  { immediate: true },
)
</script>

<template>
  <el-tag v-if="redisKey" size="small" disable-transitions :type="meType(keyType)" effect="dark">
    {{ meKeyShort(keyType) }}
  </el-tag>
  <el-tag v-else size="small" disable-transitions type="info" effect="dark">?</el-tag>
</template>
