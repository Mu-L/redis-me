<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import MeIcon from '@/components/MeIcon.vue'
import { commandHelp, isReadonlyCommand } from '@/locales/cmd'
import { shareProvideKey } from '@/types/me-interface'
import { meCopy, meCommands, isZh } from '@/utils/util'

import NodeList from '../ext/NodeList.vue'

const { t } = useI18n()
// 共享数据
const share = inject(shareProvideKey)!
const canEdit = computed(() => !share.readonly)
/** 只读列表头：英文 Read-only 较宽，中文只读可窄一些 */
const readonlyColWidth = computed(() => (isZh.value ? 80 : 120))

// 待颜色的文本
function colorText(color: string, text: string, bold = false): string {
  return bold
    ? `<span style="color: ${color}; font-weight: bold">${text}</span>`
    : `<span style="color: ${color}">${text}</span>`
}

const autoBroadcast = ref(true)
const node = ref('')
const prefix = computed(() => (node.value ? node.value + '> ' : '$ '))
const welcome = computed(() =>
  t('redisTerminal.welcome', { RedisME: colorText(share.color, 'RedisME', true) }),
)

// 定制化执行命令
async function execCommand(command: string): Promise<string> {
  if (!canEdit.value && !isReadonlyCommand(command)) {
    return colorText('var(--el-color-warning)', t('redisTerminal.readonlyWriteHint'))
  }

  try {
    const param = { command, node: node.value, autoBroadcast: autoBroadcast.value }
    const data = await meCommands.executeCommand(share.conn!.id, param, false)
    autoCopyIfNeed(data)
    const html = data.split(/\r?\n/).join('<br/>')
    return colorText('var(--el-color-success)', html)
  } catch (e: unknown) {
    autoCopyIfNeed(e)
    return colorText('var(--el-color-error)', `(error) ${String(e)}`)
  }
}

// 自动复制命令结果
const autoCopy = ref(false)
function autoCopyIfNeed(text: unknown) {
  if (autoCopy.value) {
    meCopy(String(text), undefined, false)
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
  const key = keyword.value.toLowerCase().trim()
  return commandHelp.value.filter(row => {
    if (group.value && row.group !== group.value) return false
    if (!key) return true
    return row.title.toLowerCase().includes(key) || row.summary.toLowerCase().includes(key)
  })
})
function openCommandDialog() {
  keyword.value = ''
  group.value = ''
  visible.value = true
}

const keyShortVisible = ref(false)
function openKeyShortDialog() {
  keyShortVisible.value = true
}
</script>

<template>
  <div class="redis-terminal">
    <!-- 命令输入 -->
    <me-xterm
      v-if="showCode"
      class="terminal"
      :exec-command="execCommand"
      :prefix
      :welcome
      :command-help="commandHelp" />

    <!-- 集群节点 -->
    <div class="node me-flex" v-if="share.conn?.cluster">
      <el-tooltip raw-content :content="t('redisTerminal.broadcastHint')" placement="top">
        <el-checkbox
          v-model="autoBroadcast"
          :label="t('redisTerminal.autoBroadcast')"
          style="margin-left: 10px" />
      </el-tooltip>
      <node-list v-model="node" clearable style="margin-left: 10px" />
    </div>

    <!-- 工具栏 -->
    <div class="tool me-flex">
      <el-tooltip :content="t('redisTerminal.autoCopyHint')" placement="top-end">
        <el-checkbox v-model="autoCopy" />
      </el-tooltip>
      <me-icon
        class="icon-btn"
        icon="me-icon-keyshort"
        :info="t('redisTerminal.keyShortHint')"
        placement="top-end"
        @click="openKeyShortDialog"
        style="margin-left: 10px; font-size: 20px" />
      <me-icon
        class="icon-btn"
        icon="el-icon-help"
        :info="t('redisTerminal.commandHint')"
        placement="top-end"
        @click="openCommandDialog"
        style="margin-left: 5px" />
    </div>

    <!-- 快捷键提示 -->
    <el-dialog
      v-model="keyShortVisible"
      width="400"
      align-center
      draggable
      :show-close="false"
      style="--el-dialog-bg-color: unset; box-shadow: unset">
      <el-text type="warning" size="large" v-html="t('redisTerminal.keyShortMore')"> </el-text>
    </el-dialog>

    <!-- 命令表格 -->
    <me-dialog
      v-model="visible"
      icon="el-icon-document"
      :title="t('redisTerminal.commandTitle')"
      width="80vw">
      <div style="height: 100%; display: flex; flex-direction: column">
        <div class="me-flex">
          <div class="me-flex">
            <el-select
              v-model="group"
              style="width: 200px"
              :placeholder="t('redisTerminal.group')"
              clearable
              filterable>
              <el-option v-for="item in groupList" :key="item" :value="item">{{ item }}</el-option>
            </el-select>
            <me-website to="command" />
          </div>
          <el-input
            v-model="keyword"
            :placeholder="t('redisTerminal.keywordHint')"
            style="width: 300px"
            clearable />
        </div>

        <div style="margin-top: 10px; flex-grow: 1; height: 0">
          <me-table
            ref="table"
            :data="filterDataList"
            border
            stripe
            height="100%"
            :default-sort="{ prop: 'key', order: 'ascending' }">
            <el-table-column
              :label="t('redisTerminal.group')"
              prop="group"
              width="120"
              show-overflow-tooltip
              sortable />
            <el-table-column
              :label="t('redisTerminal.command')"
              prop="key"
              width="150"
              show-overflow-tooltip
              sortable />
            <el-table-column :label="t('redisTerminal.usage')" prop="usage" show-overflow-tooltip />
            <el-table-column
              :label="t('redisTerminal.summary')"
              prop="summary"
              show-overflow-tooltip />
            <el-table-column
              :label="t('redisTerminal.since')"
              prop="since"
              width="100"
              show-overflow-tooltip
              sortable />
            <el-table-column
              :label="t('redisTerminal.readonly')"
              prop="readonly"
              :width="readonlyColWidth"
              align="center"
              sortable>
              <template #default="{ row }">
                {{ row.readonly ? t('redisTerminal.readonlyYes') : t('redisTerminal.readonlyNo') }}
              </template>
            </el-table-column>
          </me-table>
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
}
</style>
