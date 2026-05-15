<script setup lang="ts">
// 说明: 前端分页表，用于数据量比较大的场景（比如内存分析等），进行前端分页，避免卡顿。
// 在分页前对整表排序：与 el-table 的 default-sort、列 sortable / sort-method / sort-by 一致；
// sortable="custom" 时不改行顺序，由父组件在 sort-change 中自行更新 :data。
import { orderBy } from 'element-plus/es/components/table/src/util.mjs'
import { computed, ref, useAttrs, watch } from 'vue'

defineOptions({ inheritAttrs: false })

// #region 其他：props、attrs、分页状态（排序变更会重置页码，故放在排序之前）
const props = withDefaults(
  defineProps<{
    data?: unknown[]
    layout?: string
    /** 仅一页时是否隐藏分页条；默认 false（始终显示） */
    hideOnSinglePage?: boolean
  }>(),
  { data: () => [], layout: 'total, sizes, prev, pager, next, jumper', hideOnSinglePage: false },
)

const attrs = useAttrs()

const currentPage = ref(1)
const pageSize = ref(20)
// #endregion

// #region 排序（default-sort、sort-change、整表 orderBy 与 EP 列行为一致）
/** 与 Element Plus sort-change 中 column 对齐的字段（避免深类型依赖） */
interface SortColumnLike {
  sortable?: boolean | string
  sortMethod?: (a: unknown, b: unknown) => number
  sortBy?: string | string[] | ((row: unknown, index: number, array?: unknown[]) => unknown)
}

const sortProp = ref<string | null>(null)
const sortOrder = ref<'ascending' | 'descending' | null>(null)
const sortMethod = ref<((a: unknown, b: unknown) => number) | undefined>(undefined)
const sortBy = ref<SortColumnLike['sortBy']>(undefined)
const isCustomSort = ref(false)

function readDefaultSortFromAttrs(): { prop: string; order: 'ascending' | 'descending' } | null {
  const ds = attrs.defaultSort as { prop?: string; order?: string } | undefined
  if (!ds?.prop) return null
  if (ds.order !== 'ascending' && ds.order !== 'descending') return null
  return { prop: ds.prop, order: ds.order }
}

function applyDefaultSortFromAttrs(): void {
  const ds = readDefaultSortFromAttrs()
  if (ds) {
    sortProp.value = ds.prop
    sortOrder.value = ds.order
    sortMethod.value = undefined
    sortBy.value = undefined
    isCustomSort.value = false
  } else {
    sortProp.value = null
    sortOrder.value = null
    sortMethod.value = undefined
    sortBy.value = undefined
    isCustomSort.value = false
  }
}

watch(
  () => attrs.defaultSort,
  () => {
    applyDefaultSortFromAttrs()
  },
  { deep: true, immediate: true },
)

const sortedData = computed(() => {
  const raw = props.data
  if (isCustomSort.value || !sortProp.value || !sortOrder.value) return raw
  return orderBy(
    [...raw] as never,
    sortProp.value,
    sortOrder.value,
    (sortMethod.value ?? null) as never,
    sortBy.value as never,
  ) as unknown[]
})

const elTableAttrs = computed(() => {
  const { onSortChange: _onSortChange, ...rest } = attrs as Record<string, unknown>
  return rest
})

function handleSortChange(payload: {
  column: SortColumnLike | null
  prop: string | null
  order: 'ascending' | 'descending' | null
}): void {
  const { column, prop, order } = payload

  if (column?.sortable === 'custom') {
    isCustomSort.value = true
    sortProp.value = prop
    sortOrder.value = order
    sortMethod.value = undefined
    sortBy.value = undefined
  } else if (order === null) {
    isCustomSort.value = false
    // 与「有 default-sort 的列表」预期一致：取消列排序时回到 default-sort，而不是按 data 插入顺序（例如监控 push 尾部最新）
    if (readDefaultSortFromAttrs()) {
      applyDefaultSortFromAttrs()
    } else {
      sortProp.value = null
      sortOrder.value = null
      sortMethod.value = undefined
      sortBy.value = undefined
    }
  } else {
    isCustomSort.value = false
    sortProp.value = prop
    sortOrder.value = order
    sortMethod.value = column?.sortMethod
    sortBy.value = column?.sortBy
  }

  currentPage.value = 1

  const onSortChange = attrs.onSortChange as ((p: typeof payload) => void) | undefined
  onSortChange?.(payload)
}
// #endregion

// #region 其他：分页数据与分页事件
const pageData = computed(() => {
  return sortedData.value.slice(
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
// #endregion
</script>

<template>
  <div class="me-table">
    <div class="me-table-main">
      <el-table
        stripe
        border
        v-bind="elTableAttrs"
        :data="pageData"
        height="100%"
        @sort-change="handleSortChange">
        <slot></slot>
      </el-table>
    </div>
    <el-pagination
      :style="{ margin: '10px 0 0 0', marginLeft: layout.includes('total') ? '5px' : 0 }"
      size="small"
      background
      :hide-on-single-page="hideOnSinglePage"
      @change="handleChange"
      :page-size="pageSize"
      :page-sizes="[20, 50, 100]"
      @update:page-size="updatePageSize"
      :total="sortedData.length"
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
