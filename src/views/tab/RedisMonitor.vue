<script setup>
import { listen } from '@tauri-apps/api/event'
import { useI18n } from 'vue-i18n'

import { meConfirm, meCopy, meInvoke, meOk } from '@/utils/util.js'
import NodeList from '@/views/ext/NodeList.vue'

const { t } = useI18n()
// 共享数据
const share = inject('share')

const node = ref('')
const keyword = ref('')
const monitoring = ref(false)
const dataList = ref([])
const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  return dataList.value.filter(item => !key || item.toLowerCase().indexOf(key) > -1)
})

// 监控函数防抖
const loading = ref(false)
const monitor = async () => {
  loading.value = true
  try {
    if (monitoring.value) {
      await unlisten()
      await meInvoke('monitor_stop', { id: share.conn.id })
      monitoring.value = false
      meOk(t('redisMonitor.monitorStopped'))
    } else {
      meConfirm(t('redisMonitor.monitorHint'), async () => {
        await tauriListen()
        await meInvoke('monitor', { id: share.conn.id, node: node.value })
        monitoring.value = true
        meOk(t('redisMonitor.monitorStarted'))
      })
    }
  } finally {
    loading.value = false
  }
}

function clearData() {
  dataList.value = []
  //meConfirm('确定清空消息吗？', () => dataList.value = [])
}

// 监听消息
let unlisten = null
async function tauriListen() {
  unlisten = await listen('monitor', event => {
    const payload = event.payload
    if (payload.id !== share.conn.id) return
    dataList.value.push(event.payload)
  })
}

async function tauriUnlisten() {
  if (unlisten) {
    unlisten()
  }
}
onUnmounted(() => tauriUnlisten())
</script>

<template>
  <div class="redis-monitor">
    <div class="me-flex header">
      <div>
        <node-list v-model="node" style="margin-right: 10px" init-node :disabled="monitoring" />
      </div>
      <div>
        <me-button
          icon="el-icon-delete"
          :info="t('redisMonitor.clearMessage')"
          @click="clearData"
          :disabled="dataList.length === 0"
          placement="top" />
        <el-input
          v-model="keyword"
          :placeholder="t('redisMonitor.keyword')"
          style="width: 280px; margin: 0 10px"
          clearable />
        <el-button
          :icon="monitoring ? 'el-icon-video-pause' : 'el-icon-video-play'"
          @click="monitor"
          type="primary"
          :loading="loading">
          {{ monitoring ? t('redisMonitor.monitorStop') : t('redisMonitor.monitorStart') }}
        </el-button>
      </div>
    </div>
    <div class="table">
      <el-table :data="filterDataList" ref="table" border stripe height="100%">
        <el-table-column :label="t('redisMonitor.time')" prop="datetime" sortable width="200" />
        <el-table-column :label="t('redisMonitor.command')" prop="command" show-overflow-tooltip />
        <el-table-column :label="t('action')" width="80" align="center">
          <template #default="scope">
            <me-icon
              :info="t('copy')"
              icon="el-icon-document-copy"
              class="icon-btn"
              @click="meCopy(scope.row.command)"
              style="justify-content: center" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-monitor {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  .header {
    :deep(.el-input-group__prepend) {
      padding: 0 14px;
    }
  }

  .table {
    flex-grow: 1;
    height: 0;
    margin: 10px 0;
  }
}
</style>
