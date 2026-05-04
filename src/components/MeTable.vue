<script setup lang="ts">
// 说明: 前端分页表，用于数据量比较大的场景（比如内存分析等），进行前端分页，避免卡顿
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    data?: unknown[]
    layout?: string
  }>(),
  {
    data: () => [],
    layout: 'total, sizes, prev, pager, next, jumper',
  },
)

const currentPage = ref(1)
const pageSize = ref(20)
const pageData = computed(() => {
  return props.data.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  )
})

function handleChange(page: number, size: number): void {
  currentPage.value = page
  pageSize.value = size
}

function updatePageSize(size: number): void {
  currentPage.value = 1
  pageSize.value = size
}
</script>

<template>
  <div class="me-table">
    <div class="me-table-main">
      <el-table v-bind="$attrs" :data="pageData" height="100%">
        <slot></slot>
      </el-table>
    </div>
    <el-pagination
      :style="{ margin: '10px 0 0 0', marginLeft: layout.includes('total') ? '5px' : 0 }"
      size="small"
      background
      @change="handleChange"
      :page-size="pageSize"
      :page-sizes="[20, 50, 100]"
      @update:page-size="updatePageSize"
      :total="data.length"
      :layout />
  </div>
</template>

<style scoped lang="scss">
.me-table {
  height: 100%;
  //border: 2px solid red;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .me-table-main {
    flex: 1;
    height: 0;
  }
}
</style>
