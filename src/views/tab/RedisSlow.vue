<script setup>
import { useI18n } from 'vue-i18n'

import MeWebsite from '@/components/MeWebsite.vue'
// 官网参考: https://redis.ac.cn/docs/latest/commands/slowlog-get/
import { meCopy, meInvoke } from '@/utils/util.js'
import NodeList from '@/views/ext/NodeList.vue'

const { t } = useI18n()
// 共享数据
const share = inject('share')

const slowerThan = ref(10000)
const slowerMaxLen = ref(128)
const slowerGetCount = ref(Math.min(slowerMaxLen.value, 200))
const keyword = ref('')
const loading = ref(false)
const dataList = ref([])
const sortProperty = ref('cost')
const sortOrder = ref('descending')
const node = ref('')

// 最小为1
watchEffect(() => {
  if (slowerGetCount.value < 1) slowerGetCount.value = 1
})

const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  const arr = dataList.value.filter(
    row =>
      !key ||
      row.command?.toLowerCase().indexOf(key) > -1 ||
      row.client?.toLowerCase().indexOf(key) > -1 ||
      row.clientName?.toLowerCase().indexOf(key) > -1,
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
    sortProperty.value = 'time'
    sortOrder.value = 'descending'
  }
}

async function apiConfigGet() {
  const params = { id: share.conn.id, pattern: 'slowlog*', node: node.value }
  const data = await meInvoke('config_get', params)
  slowerThan.value = data['slowlog-log-slower-than']
  slowerMaxLen.value = data['slowlog-max-len']
}

async function apiSlowLog() {
  const params = { id: share.conn.id, count: slowerGetCount.value, node: node.value }
  const data = await meInvoke('slow_log', params)
  dataList.value = data || []
}

async function refresh() {
  loading.value = true
  try {
    await apiConfigGet()
    await apiSlowLog()
  } finally {
    loading.value = false
  }
}
refresh()
</script>

<template>
  <div class="redis-slow">
    <div class="me-flex header">
      <div class="me-flex">
        <el-dropdown placement="bottom-start" :hide-on-click="false" :teleported="false">
          <el-button icon="el-icon-setting">{{ t('redisSlow.slowParam') }}</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <el-input :value="slowerThan / 1000" style="width: 150px" disabled>
                  <template #prepend>
                    <el-tooltip
                      placement="top-end"
                      :content="t('redisSlow.slowerThanHint')"
                      :show-after="1000">
                      <div>{{ t('redisSlow.slowerThan') }}</div>
                    </el-tooltip>
                  </template>
                  <template #append>ms</template>
                </el-input>
              </el-dropdown-item>

              <el-dropdown-item>
                <el-input v-model.number="slowerMaxLen" style="width: 150px" disabled>
                  <template #prepend>
                    <el-tooltip
                      placement="top-end"
                      :content="t('redisSlow.slowerMaxLenHint')"
                      :show-after="1000">
                      <div>{{ t('redisSlow.slowerMaxLen') }}</div>
                    </el-tooltip>
                  </template>
                  <template #append>{{ t('redisSlow.unit') }}</template>
                </el-input>
              </el-dropdown-item>

              <el-dropdown-item>
                <el-input v-model.number="slowerGetCount" style="width: 150px">
                  <template #prepend>{{ t('redisSlow.slowerGetCount') }}</template>
                  <template #append>{{ t('redisSlow.unit') }}</template>
                </el-input>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <node-list v-model="node" clearable style="margin-left: 10px" @change="refresh" />
        <me-website to="slowlog" />
      </div>

      <div>
        <el-input
          v-model="keyword"
          :placeholder="t('redisSlow.keyword')"
          style="width: 300px; margin-right: 10px"
          clearable />
        <el-button icon="el-icon-search" @click="refresh" type="primary" :loading="loading" />
      </div>
    </div>
    <div class="table">
      <me-table
        :data="filterDataList"
        ref="table"
        v-loading="loading"
        :default-sort="{ prop: 'time', order: 'descending' }"
        @sort-change="sortChange"
        border
        stripe>
        <!--
      <el-table-column :label="t('action')" width="80" align="center">
          <template #default="scope">
            <me-icon
                :info="t('copy')"
                icon="el-icon-document-copy"
                class="icon-btn"
                @click="meCopy(scope.row.command)"
                style="justify-content: center"
            />
          </template>
        </el-table-column>-->
        <el-table-column :label="t('redisSlow.time')" prop="time" width="170" sortable />
        <el-table-column
          :label="t('redisSlow.cost')"
          prop="cost"
          width="90"
          sortable
          show-overflow-tooltip>
          <template #default="scope"> {{ scope.row.cost.toFixed(2) }} ms </template>
        </el-table-column>
        <el-table-column
          :label="t('redisSlow.command')"
          prop="command"
          min-width="120"
          sortable
          show-overflow-tooltip />
        <el-table-column
          :label="t('redisSlow.clientName')"
          prop="clientName"
          width="140"
          sortable
          show-overflow-tooltip />
        <el-table-column
          :label="t('redisSlow.client')"
          prop="client"
          width="180"
          sortable
          show-overflow-tooltip />
        <el-table-column
          :label="t('redisSlow.node')"
          prop="node"
          width="180"
          show-overflow-tooltip
          sortable
          v-if="share.conn?.cluster" />
      </me-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-slow {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  .header {
    :deep(.el-input-group__prepend) {
      //padding: 0 14px;
      width: 60px;
    }
    :deep(.el-input-group__append) {
      width: 40px;
    }
  }

  .table {
    margin-top: 10px;
    flex-grow: 1;
    height: 0;
  }
}
</style>
