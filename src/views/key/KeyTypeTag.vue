<script setup>
import { meCommands, meKeyShort, meType } from '@/utils/util.js'

const share = inject('share')
const props = defineProps({
  redisKey: { type: Object, required: true },
})

// 如果还没有类型，触发异步加载
if (!props.redisKey.keyType) {
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
