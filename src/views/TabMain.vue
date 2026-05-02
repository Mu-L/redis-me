<script setup lang="ts">
import { inject } from 'vue'

import { shareProvideKey, type AppMainShare } from '@/types/me-interface'
import RedisChart from '@/views/tab/RedisChart.vue'
import RedisInfo from '@/views/tab/RedisInfo.vue'
import RedisMemory from '@/views/tab/RedisMemory.vue'
import RedisMonitor from '@/views/tab/RedisMonitor.vue'
import RedisPubsub from '@/views/tab/RedisPubsub.vue'
import RedisSlow from '@/views/tab/RedisSlow.vue'
// import RedisTauri from '@/views/tab/RedisTauri.vue'
import RedisTerminal from '@/views/tab/RedisTerminal.vue'
import RedisValue from '@/views/tab/RedisValue.vue'

const share = inject(shareProvideKey)!
</script>

<template>
  <el-tabs
    v-model="share.tabName"
    class="redis-tab"
    :style="{ paddingBottom: share.tabName === 'value' ? 0 : '10px' }">
    <me-tab-pane name="info" icon="el-icon-calendar"> <RedisInfo /> </me-tab-pane>
    <me-tab-pane name="value" icon="el-icon-memo"> <RedisValue /> </me-tab-pane>
    <me-tab-pane name="terminal" icon="me-icon-terminal" lazy> <RedisTerminal /> </me-tab-pane>
    <me-tab-pane name="memory" icon="me-icon-memory" lazy> <RedisMemory /> </me-tab-pane>
    <me-tab-pane name="slow" icon="me-icon-slow" lazy> <RedisSlow /> </me-tab-pane>
    <me-tab-pane name="monitor" icon="el-icon-monitor" lazy> <RedisMonitor /> </me-tab-pane>
    <me-tab-pane name="pubsub" icon="me-icon-pubsub" lazy> <RedisPubsub /> </me-tab-pane>
    <me-tab-pane name="chart" icon="el-icon-data-line" lazy> <RedisChart /> </me-tab-pane>
    <!-- <me-tab-pane name="tauri" icon="el-icon-data-line" lazy> <RedisTauri /> </me-tab-pane> -->
  </el-tabs>
</template>

<style scoped lang="scss">
.redis-tab {
  //border: 2px solid red;
  border: 1px solid var(--el-border-color);
  padding: 0 10px 10px 10px;

  height: 100%;

  :deep(.el-tab-pane) {
    height: 100%;
  }

  // 调整标签页的宽度以便可以显示更多标签（默认20px）
  :deep(.el-tabs__item) {
    padding: 0 15px;
  }
}
</style>
