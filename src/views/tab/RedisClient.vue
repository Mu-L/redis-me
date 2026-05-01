<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AppMainShare } from '@/bindings/me-interface'
import { clientTip as tips } from '@/utils/tip'
import { meConfirm, meHumanSeconds, meCommands, meOk } from '@/utils/util'
import NodeList from '@/views/ext/NodeList.vue'

const { t } = useI18n()
// 共享数据
const share = inject('share') as AppMainShare
const canEdit = computed(() => !share.readonly)
const { initNode } = defineProps({
  initNode: { type: String, default: '' },
})

const node = ref(initNode)
const clientType = ref('')
const keyword = ref('')
const loading = ref(false)
const dataList = ref([])
const sortProperty = ref('id')
const sortOrder = ref('ascending')

const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  const arr = dataList.value.filter(
    row =>
      !key ||
      row.addr?.toLowerCase().indexOf(key) > -1 ||
      row.name?.toLowerCase().indexOf(key) > -1,
  )

  const prop = sortProperty.value
  const isAsc = sortOrder.value === 'ascending'
  const arr01 = arr.filter(d => d[prop])
  const arr02 = arr.filter(d => !d[prop])
  arr01.sort((a, b) => (a[prop] < b[prop] ? -1 : 1) * (isAsc ? 1 : -1))
  return [...arr01, ...arr02]
})

function sortChange({ prop, order }) {
  if (order) {
    sortProperty.value = prop
    sortOrder.value = order
  } else {
    sortProperty.value = 'id'
    sortOrder.value = 'ascending'
  }
}

async function refresh() {
  loading.value = true
  try {
    dataList.value = await meCommands.clientList(share.conn.id, node.value, clientType.value)
  } finally {
    loading.value = false
  }
}
refresh()

async function killClient(row) {
  meConfirm(t('redisClient.killClientConfirm', { client: row.addr }), async () => {
    const param = { command: `client kill ${row.addr}`, node: node.value }
    await meCommands.executeCommand(share.conn.id, param)
    meOk(t('redisClient.killClientOk'))
    await refresh()
  })
}

// 客户端属性
const totalProps = [
  'user',
  'db',
  'id',
  'addr',
  'laddr',
  'fd',
  'name',
  'age',
  'idle',
  'flags',
  'sub',
  'psub',
  'ssub',
  'multi',
  'watch',
  'qbuf',
  'qbufFree',
  'argvMem',
  'multiMem',
  'obl',
  'oll',
  'omem',
  'totMem',
  'events',
  'cmd',
  'redir',
  'resp',
  'rbp',
  'rbs',
  'libName',
  'libVer',
  'ioThread',
  'totNetIn',
  'totNetOut',
  'totCmds',
]
const mainProps = ['id', 'addr', 'name', 'age', 'idle', 'cmd']
const otherProps = totalProps.filter(p => !mainProps.includes(p))
function propWidth(item) {
  if (item === 'laddr') return 180
  if (item.length == 2) return 70
  if (item.length == 3) return 80
  if (item.length == 4) return 96
  if (item.length == 5) return 100
  return 130
}
</script>

<template>
  <div class="redis-client">
    <div class="me-flex header">
      <div class="me-flex">
        <node-list v-model="node" style="margin-right: 10px" @change="refresh" />
        <el-select
          v-model="clientType"
          style="width: 120px"
          @change="refresh"
          :placeholder="t('redisClient.clientType')"
          clearable>
          <el-option value="NORMAL" />
          <el-option value="MASTER" />
          <el-option value="SLAVE" />
          <el-option value="REPLICA" />
          <el-option value="PUBSUB" />
        </el-select>
        <me-website to="client" />
      </div>
      <div>
        <el-input
          v-model="keyword"
          :placeholder="t('redisClient.keyword')"
          style="width: 280px; margin-right: 10px"
          clearable />
        <el-button icon="el-icon-search" @click="refresh" type="primary" :loading="loading" />
      </div>
    </div>
    <div class="table">
      <me-table
        :data="filterDataList"
        ref="table"
        v-loading="loading"
        :default-sort="{ prop: 'id', order: 'ascending' }"
        @sort-change="sortChange"
        border
        stripe
        height="100%">
        <el-table-column
          label="ID"
          prop="id"
          show-overflow-tooltip
          sortable
          width="100"
          align="right">
          <template #header>
            <el-tooltip :content="tips['id'] || 'id'" placement="top">
              <span>ID</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="addr" show-overflow-tooltip width="180" sortable>
          <template #header>
            <el-tooltip :content="tips['addr'] || 'addr'" placement="top">
              <span>{{ t('redisClient.addr') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="name" show-overflow-tooltip width="160" sortable>
          <template #header>
            <el-tooltip :content="tips['name'] || 'name'" placement="top">
              <span>{{ t('redisClient.name') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="age"
          show-overflow-tooltip
          sortable
          width="140"
          align="right"
          :formatter="row => meHumanSeconds(row.age)">
          <template #header>
            <el-tooltip :content="tips['age'] || 'age'" placement="top">
              <span>{{ t('redisClient.age') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="idle"
          show-overflow-tooltip
          sortable
          width="120"
          align="right"
          :formatter="row => meHumanSeconds(row.idle)">
          <template #header>
            <el-tooltip :content="tips['idle'] || 'idle'" placement="top">
              <span>{{ t('redisClient.idle') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="cmd" show-overflow-tooltip sortable min-width="200">
          <template #header>
            <el-tooltip :content="tips['cmd'] || 'cmd'" placement="top">
              <span>{{ t('redisClient.cmd') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column
          v-for="item in otherProps"
          :key="item"
          :prop="item"
          show-overflow-tooltip
          sortable
          :width="propWidth(item)"
          align="right">
          <template #header>
            <el-tooltip :content="tips[item] || item" placement="top">
              <span>{{ item }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column
          :label="t('action')"
          width="80"
          align="center"
          fixed="right"
          v-if="canEdit">
          <template #default="scope">
            <me-icon
              :info="t('redisClient.killClientHint')"
              icon="el-icon-CircleCloseFilled"
              class="icon-btn"
              @click="killClient(scope.row)"
              style="justify-content: center" />
          </template>
        </el-table-column>
      </me-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-client {
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
    margin-top: 10px;
    flex-grow: 1;
    height: 0;
  }
}
</style>
