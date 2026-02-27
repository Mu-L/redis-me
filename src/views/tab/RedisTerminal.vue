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
const help = computed(() => t('redisTerminal.help'))
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

// 表格Redis命令的帮助手册显示
const visible = ref(false)
const keyword = ref('')
const group = ref('')
const groupList = computed(() => new Set(commandHelp.value.map(row => row.group)))
const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  return commandHelp.value.filter(row =>
       (!key || row.title.toLowerCase().indexOf(key) > -1)
    && (!group.value || row.group === group.value)
  )
})
</script>

<template>
  <div class="redis-terminal">
    <me-xterm v-if="showCode" class="terminal" :exec-command="execCommand" :prefix :welcome :command-help="commandHelp"/>

    <!-- 集群节点 -->
    <div class="node me-flex" v-if="share.conn?.cluster">
      <el-tooltip raw-content :content="hint" placement="top">
        <el-checkbox v-model="autoBroadcast" :label="t('redisTerminal.autoBroadcast')" style="margin-left: 10px"/>
      </el-tooltip>
      <node-list v-model="node" clearable style="margin-left: 10px"/>
    </div>

    <!-- 工具栏 -->
    <div class="tool me-flex">
      <el-tooltip :content="t('redisTerminal.autoCopyHint')" placement="left">
        <el-checkbox v-model="autoCopy"/>
      </el-tooltip>
      <me-icon class="icon-btn" icon="el-icon-document" :info="help" raw-content placement="top-end"
               @click="visible = true"
               :show-after="0" style="margin-left: 5px;font-size: 14px"/>
    </div>

    <!-- 命令表格 -->
    <me-dialog v-model="visible" icon="el-icon-document" title="Commands" width="80vw">
      <div style="height: 100%; display: flex; flex-direction: column">
        <div class="me-flex">
          <el-select v-model="group" style="width: 200px" placeholder="Group" clearable filterable>
            <el-option v-for="item in groupList" :key="item" :value="item">{{ item }}</el-option>
          </el-select>
          <el-input v-model="keyword" placeholder="command" style="width: 300px" clearable/>
        </div>

        <div style="margin-top: 10px; flex-grow: 1; height: 0">
          <el-table ref="table" :data="filterDataList" border stripe height="100%">
            <el-table-column label="group" prop="group" width="120" show-overflow-tooltip/>
            <el-table-column label="command" prop="key" width="150" show-overflow-tooltip/>
            <el-table-column label="usage" prop="usage" show-overflow-tooltip/>
            <el-table-column label="summary" prop="summary" show-overflow-tooltip/>
            <el-table-column label="since" prop="since" width="80" show-overflow-tooltip/>
          </el-table>
        </div>
      </div>
    </me-dialog>
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

  .tool {
    position: absolute;
    right: 10px;
    bottom: 0;
    z-index: 10;
  }

  .command-table {
    .table {
      margin-top: 10px;
      flex-grow: 1;
      height: 0;
    }
  }
}
</style>
