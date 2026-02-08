<script setup>
import NodeList from '../ext/NodeList.vue'
import {meCopy, meInvoke} from '@/utils/util.js'
import MeIcon from '@/components/MeIcon.vue'
import {useI18n} from 'vue-i18n'
import {commandHelp} from '@/utils/cmd.js'

const { t } = useI18n()
// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)

// 待颜色的文本
function colorText(color, text, bold = false) {
  return bold ? `<span style="color: ${color}; font-weight: bold">${text}</span>` : `<span style="color: ${color}">${text}</span>`
}

const autoBroadcast = ref(true)
const node  = ref('')
const hint = computed(() => t('redisTerminal.hint'))
const prefix = computed(() => node.value ? node.value + '> ' : '$ ')
const welcome = computed(() => t('redisTerminal.welcome', {RedisME: colorText('var(--el-color-primary)', 'RedisME', true)}))

// 定制化执行命令
async function execCommand(command) {
  if (!canEdit.value) {
    return colorText('var(--el-color-warning)', t('redisTerminal.readonlyHint'))
  }

  try {
    const param = {command, node: node.value, autoBroadcast: autoBroadcast.value}
    const data = await meInvoke('execute_command', {id: share.conn.id, param}, false)
    autoCopyIfNeed(data)
    const html = data.split(/\r?\n/).join('<br/>')
    return colorText('var(--el-color-success)', html)
  } catch (e) {
    autoCopyIfNeed(e)
    return colorText('var(--el-color-error)', `(error) ${e}`)
  }
}

// 自动复制命令结果
const autoCopy = ref(false)
function autoCopyIfNeed(text) {
  if (autoCopy.value) {
    meCopy(text, null, false)
  }
}

// 命令提示的中英文实时切换
// 说明: vue-web-terminal的命令只能初始化1次, 后续更新无效。因此考虑销毁重建
const showCode = ref(true)
watch(commandHelp, () => {
  showCode.value = false
  nextTick(() => {
    showCode.value = true
  })
})
</script>

<template>
  <div class="redis-terminal">
    <me-xterm v-if="showCode" class="terminal" :exec-command="execCommand" :prefix :welcome :command-help="commandHelp"/>
    <div class="node me-flex" v-if="share.conn?.cluster">
      <me-icon icon="el-icon-question-filled" :info="hint" raw-content placement="top" :show-after="0"/>
      <el-checkbox v-model="autoBroadcast" :label="t('redisTerminal.autoBroadcast')" style="margin-left: 10px"/>
      <node-list v-model="node" clearable style="margin-left: 10px"/>
    </div>
    <div class="auto-copy">
      <el-tooltip :content="t('redisTerminal.autoCopyHint')" placement="top-end">
        <el-checkbox v-model="autoCopy"/>
      </el-tooltip>
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
    z-index: 10;
  }

  .auto-copy {
    position: absolute;
    right: 10px;
    bottom: 0;
  }
}
</style>
