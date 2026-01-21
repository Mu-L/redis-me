<script setup>

import {meInvoke} from '@/utils/util.js'

const share = inject('share')
const node = ref('')         // 指定节点

const showData = ref({})
async function clickMe() {
  const data = await meInvoke('chart', {id: share.conn.id, node: node.value})
  console.log(data)
  showData.value = data
}
</script>

<template>
  <div class="redis-chart">
    <el-button @click="clickMe">点我</el-button>
    <div>{{JSON.stringify(showData, null, 2)}}</div>
  </div>
</template>

<style scoped lang="scss">
.redis-chart {
  height: 100%;
  border: 2px solid red;
}
</style>