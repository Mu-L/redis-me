<script setup lang="ts">
import { computed, inject, watch } from 'vue'

import { shareProvideKey } from '@/types/me-interface'
import { isConnMinimalMode } from '@/utils/conn'
import RedisChart from '@/views/tab/RedisChart.vue'
import RedisInfo from '@/views/tab/RedisInfo.vue'
import RedisMemory from '@/views/tab/RedisMemory.vue'
import RedisMonitor from '@/views/tab/RedisMonitor.vue'
import RedisPubsub from '@/views/tab/RedisPubsub.vue'
import RedisSlow from '@/views/tab/RedisSlow.vue'
import RedisTerminal from '@/views/tab/RedisTerminal.vue'
import RedisValue from '@/views/tab/RedisValue.vue'

const share = inject(shareProvideKey)!
const minimalMode = computed(() => isConnMinimalMode(share.conn))

/** 极简连接：仅键值与终端；若当前 Tab 不可见则切回键值 */
watch(
  minimalMode,
  minimal => {
    if (minimal && share.tabName !== 'value' && share.tabName !== 'terminal') {
      share.tabName = 'value'
    }
  },
  { immediate: true },
)
</script>

<template>
  <el-tabs
    v-model="share.tabName"
    class="redis-tab"
    :style="{ paddingBottom: share.tabName === 'value' ? 0 : '10px' }">
    <me-tab-pane v-if="!minimalMode" name="info" icon="el-icon-calendar">
      <RedisInfo />
    </me-tab-pane>
    <me-tab-pane name="value" icon="el-icon-memo"> <RedisValue /> </me-tab-pane>
    <me-tab-pane name="terminal" icon="me-icon-terminal" lazy> <RedisTerminal /> </me-tab-pane>
    <me-tab-pane v-if="!minimalMode" name="memory" icon="me-icon-memory" lazy>
      <RedisMemory />
    </me-tab-pane>
    <me-tab-pane v-if="!minimalMode" name="slow" icon="me-icon-slow" lazy>
      <RedisSlow />
    </me-tab-pane>
    <me-tab-pane v-if="!minimalMode" name="monitor" icon="el-icon-monitor" lazy>
      <RedisMonitor />
    </me-tab-pane>
    <me-tab-pane v-if="!minimalMode" name="pubsub" icon="me-icon-pubsub" lazy>
      <RedisPubsub />
    </me-tab-pane>
    <me-tab-pane v-if="!minimalMode" name="chart" icon="el-icon-data-line" lazy>
      <RedisChart />
    </me-tab-pane>
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
