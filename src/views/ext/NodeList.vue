<script setup>
import { sortBy } from 'lodash'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const share = inject('share')
const node = defineModel()
const emit = defineEmits(['update:modelValue'])

const { initNode } = defineProps({
  initNode: { type: Boolean, default: false },
})

let masterIndex = 0
let masterLabelMap = new Map()
const nodeList = computed(() => {
  let tempList = share.nodeList
  // 节点列表排序: 按照node升序
  tempList = sortBy(tempList, 'node')
  tempList.forEach(item => {
    item.isMaster = item.flags.includes('master')
    item.isSlave = item.flags.includes('slave')
  })

  // 主节点: M1, M2, M3
  tempList.forEach(item => {
    if (item.isMaster) {
      masterIndex++
      item.shortLabel = 'M' + masterIndex
      masterLabelMap.set(item.node, masterIndex)
    }
  })

  // 从节点: S1, S2, S3
  tempList.forEach(item => {
    if (item.isSlave && item.slaveOfNode) {
      let masterIndex = masterLabelMap.get(item.slaveOfNode)
      item.shortLabel = 'S' + masterIndex
    }
  })

  // 其他节点: -
  tempList.forEach(item => {
    if (!item.shortLabel) {
      item.shortLabel = '-'
    }
  })

  return tempList
})

// 如果需要初始化节点，默认选中第一个Master节点
const masterNodeList = computed(() => nodeList.value.filter(item => item.isMaster))
if (initNode && masterNodeList.value.length > 0) {
  emit('update:modelValue', masterNodeList.value[0].node)
}
</script>

<template>
  <el-select
    v-model="node"
    style="width: 220px"
    :placeholder="t('nodeList.placeholder')"
    v-if="nodeList.length > 0">
    <el-option v-for="item in nodeList" :key="item.node" :value="item.node">
      <el-tag effect="dark" :type="item.isMaster ? 'primary' : 'info'">
        {{ item.node }} ({{ item.shortLabel }})
      </el-tag>
    </el-option>
  </el-select>
</template>
