<script setup>
import { sortBy } from 'lodash'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { meInvoke } from '@/utils/util.js'
const { t } = useI18n()

const share = inject('share')
const node = defineModel()
const emit = defineEmits(['update:modelValue'])

const { initNode } = defineProps({
  initNode: { type: Boolean, default: false },
})

const srcNodeList = ref([])
onMounted(async () => {
  if (share.conn?.cluster) {
    srcNodeList.value = await meInvoke('node_list', { id: share.conn.id })
  }
})

let masterIndex = 0
let masterLabelMap = new Map()
const nodeList = computed(() => {
  let tempList = srcNodeList.value
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

  // 其他节点
  /*
  myself：你正在连接的节点。
  master：节点是主节点。
  slave：节点是副本。
  fail?：节点处于 PFAIL 状态。对于你正在连接的节点来说不可达，但逻辑上仍然可达（未处于 FAIL 状态）。
  fail：节点处于 FAIL 状态。对于将 PFAIL 状态提升为 FAIL 的多个节点来说不可达。
  handshake：不受信任的节点，正在进行握手。
  noaddr：此节点没有已知地址。
  nofailover：副本不会尝试故障转移。
  noflags：没有任何标志
  */
  tempList.forEach(item => {
    if (!item.shortLabel) {
      item.shortLabel = item.flags?.slice(0, 1).toUpperCase() || 'F'
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
    v-if="share.conn?.cluster">
    <el-option v-for="item in nodeList" :key="item.node" :value="item.node">
      <el-text effect="dark" :type="item.isMaster ? 'primary' : 'info'">
        {{ item.node }} |
        <el-tooltip :content="'Slots: ' + item.slots" placement="top" :disabled="!item.isMaster">
          {{ item.shortLabel }}
        </el-tooltip>
      </el-text>
    </el-option>
  </el-select>
</template>
