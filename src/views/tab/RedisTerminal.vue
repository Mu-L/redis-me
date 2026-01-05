<script setup>
import NodeList from '../ext/NodeList.vue'
import {meInvoke} from '@/utils/util.js'
import MeIcon from '@/components/MeIcon.vue'
import {useI18n} from 'vue-i18n'
import {useDark} from '@vueuse/core'

const { t } = useI18n()
// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)

const isDark = useDark()
const color  = computed(() => isDark.value ? '32m' : '34m')

const autoBroadcast = ref(true)
const node  = ref('')
const hint = computed(() => t('redisTerminal.hint'))
const prefix = computed(() => node.value ? `\x1B[1;3;${color.value}${node.value}> \x1B[0m` : `\x1B[1;3;${color.value}$ \x1B[0m`)
const welcome = computed(() => t('redisTerminal.welcome', {RedisME: `\x1B[1;3;${color.value}RedisME\x1B[0m`}))

// 定制化执行命令
async function execCommand(command) {
  if (!canEdit.value) {
    return '\x1B[1;3;' + color.value + t('redisTerminal.readonlyHint') + '\x1B[0m'
  }

  try {
    const param = {
      command, node: node.value, autoBroadcast: autoBroadcast.value
    }
    const data = await meInvoke('execute_command', {id: share.conn.id, param}, false)
    const result = replaceEnter(data)
    return `\x1b[35;1m${result}\x1b[0m`
  } catch (e) {
    return `\x1b[31;1m(error) ${e}\x1b[0m`
  }
}

function replaceEnter(data) {
  if (data == null || data == undefined) {
    return ''
  } else if (Array.isArray(data)) {
    return data.map(d => replaceEnter(d)).join('\r\n')
  } else {
    return data?.split('\n').join('\r\n')
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
