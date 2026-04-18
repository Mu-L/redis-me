<script setup>
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { meInvoke } from '@/utils/util.js'

const { t } = useI18n()
const share = inject('share')
const { dataList } = defineProps({
  dataList: { type: Array, default: () => [] },
})

const table = ref(null)
const consumerData = ref([])
const loading = ref(false)

async function handleExpand(row, expandedRows) {
  if (expandedRows.length === 0) return

  // 手风琴效果：如果展开行数大于1，自动收起其他行
  if (expandedRows.length > 1) {
    const otherRow = expandedRows.find(r => r.name !== row.name)
    if (otherRow) table.value.toggleRowExpansion(otherRow, false)
  }

  loading.value = true
  try {
    consumerData.value = await meInvoke('xinfo_consumers', {
      id: share.conn.id,
      key: share.redisKey,
      group: row.name,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="table-group">
    <el-table
      ref="table"
      :data="dataList"
      border
      stripe
      :default-sort="{ prop: 'name', order: 'ascending' }"
      @expand-change="handleExpand">
      <el-table-column type="expand">
        <template #default>
          <div class="consumer-wrapper" v-loading="loading">
            <el-table :data="consumerData" border stripe style="width: 80%">
              <el-table-column
                :label="t('tableGroup.consumerName')"
                prop="name"
                show-overflow-tooltip />
              <el-table-column
                :label="t('tableGroup.consumerPending')"
                prop="pending"
                show-overflow-tooltip />
              <el-table-column
                :label="t('tableGroup.consumerIdle')"
                prop="idle"
                show-overflow-tooltip />
            </el-table>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        :label="t('tableGroup.name')"
        width="140"
        prop="name"
        show-overflow-tooltip
        sortable />
      <el-table-column
        :label="t('tableGroup.consumers')"
        prop="consumers"
        width="140"
        show-overflow-tooltip
        sortable />
      <el-table-column
        :label="t('tableGroup.pending')"
        prop="pending"
        width="120"
        show-overflow-tooltip
        sortable />
      <el-table-column
        :label="t('tableGroup.lastDeliveredId')"
        prop="last_delivered_id"
        width="150"
        show-overflow-tooltip />
      <el-table-column
        :label="t('tableGroup.entriesRead')"
        prop="entries_read"
        show-overflow-tooltip />
      <el-table-column :label="t('tableGroup.lag')" prop="lag" width="120" show-overflow-tooltip />
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.table-group {
  height: 100%;
  overflow: auto;

  .consumer-wrapper {
    padding: 20px;
    background-color: var(--el-fill-color-lighter);
    display: flex;
    justify-content: center;
  }
}
</style>
