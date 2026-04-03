<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { dataList } = defineProps({
  dataList: { type: Array, default: () => [] },
})
</script>

<template>
  <el-table
    ref="table"
    :data="dataList"
    border
    stripe
    :default-sort="{ prop: 'key', order: 'ascending' }"
  >
    <el-table-column :label="t('tableGroup.name')" prop="name" show-overflow-tooltip sortable />
    <el-table-column
      :label="t('tableGroup.consumers')"
      prop="consumers"
      width="140"
      show-overflow-tooltip
      sortable
    />
    <el-table-column
      :label="t('tableGroup.pending')"
      prop="pending"
      width="120"
      show-overflow-tooltip
      sortable
    />
    <el-table-column
      :label="t('tableGroup.lastDeliveredId')"
      prop="pending"
      width="150"
      show-overflow-tooltip
    />
    <el-table-column
      :label="t('tableGroup.entriesRead')"
      prop="entriesRead"
      width="150"
      show-overflow-tooltip
      sortable
    />
    <el-table-column
      :label="t('tableGroup.lag')"
      prop="lag"
      width="120"
      show-overflow-tooltip
      sortable
    />
  </el-table>
</template>
