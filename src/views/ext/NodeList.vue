<script setup>
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const share = inject('share')
const node = defineModel()
const emit = defineEmits(['update:modelValue'])

const { initNode } = defineProps({
  initNode: { type: Boolean, default: false },
})
const firstMaster = computed(() => share.nodeList.find(item => item.isMaster))

onMounted(() => {
  if (!share.conn?.cluster) return
  if (initNode && firstMaster.value) {
    emit('update:modelValue', firstMaster.node)
  }
})
</script>

<template>
  <el-select
    v-model="node"
    style="width: 220px"
    :placeholder="t('nodeList.placeholder')"
    v-if="share.conn?.cluster">
    <el-option v-for="item in share.nodeList" :key="item.node" :value="item.node">
      <el-text effect="dark" :type="item.isMaster ? 'primary' : 'info'">
        {{ item.node }} |
        <el-tooltip :content="item.slotsTooltip" placement="top" :disabled="!item.slotsTooltip">
          {{ item.shortLabel }}
        </el-tooltip>
      </el-text>
    </el-option>
  </el-select>
</template>
