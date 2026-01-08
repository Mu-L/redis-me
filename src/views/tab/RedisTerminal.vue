<script setup>
import NodeList from '../ext/NodeList.vue'
import {meInvoke} from '@/utils/util.js'
import MeIcon from '@/components/MeIcon.vue'
import {useI18n} from 'vue-i18n'

const { t } = useI18n()
// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)

const autoBroadcast = ref(true)
const node  = ref('')
const hint = computed(() => t('redisTerminal.hint'))
const prefix = computed(() => `<span style="color: var(--el-color-primary)">${node.value ? node.value + '> ' : '$ '}</span>`)
const welcome = computed(() => t('redisTerminal.welcome', {RedisME: `<span style="color: var(--el-color-primary)">RedisME</span>`}))

// 定制化执行命令
async function execCommand(command) {
  if (!canEdit.value) {
    return `<span style="color: var(--el-color-error)">${t('redisTerminal.readonlyHint')}</span>`
  }

  try {
    const param = {command, node: node.value, autoBroadcast: autoBroadcast.value}
    const data = await meInvoke('execute_command', {id: share.conn.id, param}, false)
    return `<span style="color: var(--el-color-success)">${data}</span`
  } catch (e) {
    return `<span style="color: var(--el-color-error)">(error) ${e}</span`
  }
}
</script>

<template>
  <div class="redis-terminal">
    <me-xterm class="terminal" :exec-command="execCommand" :prefix :welcome/>
    <div class="node me-flex" v-if="share.conn?.cluster">
      <me-icon icon="el-icon-question-filled" :info="hint" raw-content placement="top" :show-after="0"/>
      <el-checkbox v-model="autoBroadcast" :label="t('redisTerminal.autoBroadcast')" border style="margin-left: 10px"/>
      <node-list v-model="node" clearable style="margin-left: 10px"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-terminal {
  height: 100%;
  overflow: hidden;
  position: relative;

  .terminal {
    height: 100%;
  }

  :deep(.xterm) {
    padding: 10px;
  }

  .node {
    position: absolute;
    right: 0;
    top: 0;
  }
}
</style>
