<script setup>
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { enrichClusterNodes, meInvoke } from '@/utils/util.js'
const { t } = useI18n()

const share = inject('share')
const node = defineModel()
const emit = defineEmits(['update:modelValue'])

const { initNode } = defineProps({
  initNode: { type: Boolean, default: false },
})

const srcNodeList = ref([])

onMounted(async () => {
  if (!share.conn?.cluster) {
    return
  }
  srcNodeList.value = (await meInvoke('node_list', { id: share.conn.id })) || []
  if (initNode) {
    const firstMaster = enrichClusterNodes(srcNodeList.value).find(item => item.isMaster)
    if (firstMaster) {
      emit('update:modelValue', firstMaster.node)
    }
  }
})

const nodeList = computed(() => {
  const enriched = enrichClusterNodes(srcNodeList.value)
  enriched.forEach(item => {
    if (item.isMaster && item.slots) {
      item.slotsTooltip = t('nodeList.slotsTooltip', { slots: item.slots })
    } else if (item.isSlave && item.masterSlots) {
      item.slotsTooltip = t('nodeList.slotsReplicaTooltip', { slots: item.masterSlots })
    } else {
      item.slotsTooltip = ''
    }
  })
  return enriched
})
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
        <el-tooltip :content="item.slotsTooltip" placement="top" :disabled="!item.slotsTooltip">
          {{ item.shortLabel }}
        </el-tooltip>
      </el-text>
    </el-option>
  </el-select>
</template>
