<script setup lang="ts">
/** RedisME 客户端命令执行日志；非模态弹窗，标题栏可拖动 */
import { listen } from '@tauri-apps/api/event'
import { computed, inject, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type { CommandLogEntry } from '@/types/tauri-specta'
import { meCommands, meConfirm, meOk } from '@/utils/util'

interface CommandLogEvent {
  id: string
  entry: CommandLogEntry
}

const visible = defineModel<boolean>({ default: false })

const { t } = useI18n()
const share = inject(shareProvideKey)!

const keyword = ref('')
const loading = ref(false)
const logs = ref<CommandLogEntry[]>([])
let unlisten: (() => void) | null = null

const seenMaxId = ref(0)
const highlightIds = ref(new Set<number>())
const highlightColor = computed(() => share.conn?.color || share.color || 'var(--el-color-primary)')

const DIALOG_CLASS = 'command-log-dialog'
const RESIZE_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const
type ResizeDir = (typeof RESIZE_DIRS)[number]
const MIN_W = 520
const MIN_H = 320
const LOG_LIMIT = 1000
const SLOW_MS = 10
const HIGHLIGHT_WINDOW_MS = 1000

function parseLogTime(timestamp: string): number {
  const ms = Date.parse(timestamp.replace(' ', 'T'))
  return Number.isFinite(ms) ? ms : 0
}

function resetHighlightState() {
  seenMaxId.value = 0
  highlightIds.value = new Set()
}

function markNewEntry(entry: CommandLogEntry) {
  if (entry.id <= seenMaxId.value) return
  seenMaxId.value = entry.id

  const latestMs = parseLogTime(entry.timestamp)
  const ids = new Set<number>()
  for (const row of logs.value) {
    const diff = latestMs - parseLogTime(row.timestamp)
    if (diff >= 0 && diff <= HIGHLIGHT_WINDOW_MS) {
      ids.add(row.id)
    }
  }
  highlightIds.value = ids
}

function stopListening() {
  unlisten?.()
  unlisten = null
}

async function startListening() {
  stopListening()
  unlisten = await listen<CommandLogEvent>('command-log', event => {
    if (event.payload.id !== share.conn?.id) return
    const entry = event.payload.entry
    if (entry.id <= seenMaxId.value) return
    logs.value.unshift(entry)
    if (logs.value.length > LOG_LIMIT) logs.value.length = LOG_LIMIT
    markNewEntry(entry)
  })
}

function getDialogEl(): HTMLElement | null {
  return document.querySelector(`.el-dialog.${DIALOG_CLASS}`)
}

function clampSize(w: number, h: number) {
  return {
    w: Math.min(Math.max(w, MIN_W), window.innerWidth * 0.96),
    h: Math.min(Math.max(h, MIN_H), window.innerHeight * 0.92),
  }
}

function pinDialog(el: HTMLElement) {
  if (el.dataset.commandLogPinned) return
  const rect = el.getBoundingClientRect()
  el.style.position = 'fixed'
  el.style.left = `${rect.left}px`
  el.style.top = `${rect.top}px`
  el.style.margin = '0'
  el.style.transform = 'none'
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  el.dataset.commandLogPinned = '1'
}

function removeResizeHandles(el: HTMLElement) {
  el.querySelectorAll('.command-log-resize-handle').forEach(node => node.remove())
}

function onResizeStart(e: MouseEvent, dir: ResizeDir) {
  e.preventDefault()
  e.stopPropagation()
  const el = getDialogEl()
  if (!el) return
  pinDialog(el)
  const rect = el.getBoundingClientRect()
  const start = {
    x: e.clientX,
    y: e.clientY,
    w: rect.width,
    h: rect.height,
    l: rect.left,
    t: rect.top,
  }

  const onMove = (ev: MouseEvent) => {
    let l = start.l
    let top = start.t
    let w = start.w
    let h = start.h
    const dx = ev.clientX - start.x
    const dy = ev.clientY - start.y

    if (dir.includes('e')) w = start.w + dx
    if (dir.includes('w')) {
      w = start.w - dx
      l = start.l + dx
    }
    if (dir.includes('s')) h = start.h + dy
    if (dir.includes('n')) {
      h = start.h - dy
      top = start.t + dy
    }

    const sized = clampSize(w, h)
    if (dir.includes('w')) l = start.l + start.w - sized.w
    if (dir.includes('n')) top = start.t + start.h - sized.h

    el.style.left = `${l}px`
    el.style.top = `${top}px`
    el.style.width = `${sized.w}px`
    el.style.height = `${sized.h}px`
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function setupResizeHandles() {
  const el = getDialogEl()
  if (!el) return
  removeResizeHandles(el)
  for (const dir of RESIZE_DIRS) {
    const handle = document.createElement('div')
    handle.className = `command-log-resize-handle command-log-resize-handle--${dir}`
    handle.addEventListener('mousedown', e => onResizeStart(e, dir))
    el.appendChild(handle)
  }
}

function onDragMouseDown(e: Event) {
  if (!(e instanceof MouseEvent)) return
  if (e.target instanceof HTMLElement && e.target.closest('.el-dialog__headerbtn')) return
  const el = getDialogEl()
  if (!el) return
  pinDialog(el)
  const start = {
    x: e.clientX,
    y: e.clientY,
    l: el.getBoundingClientRect().left,
    t: el.getBoundingClientRect().top,
  }

  const onMove = (ev: MouseEvent) => {
    el.style.left = `${start.l + ev.clientX - start.x}px`
    el.style.top = `${start.t + ev.clientY - start.y}px`
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function resetDialogShell() {
  const el = getDialogEl()
  if (!el) return
  removeResizeHandles(el)
  el.style.position = ''
  el.style.left = ''
  el.style.top = ''
  el.style.margin = ''
  el.style.transform = ''
  el.style.width = ''
  el.style.height = ''
  delete el.dataset.commandLogPinned
}

function onDialogOpened() {
  setupResizeHandles()
  getDialogEl()?.querySelector('.el-dialog__header')?.addEventListener('mousedown', onDragMouseDown)
}

function onDialogClosed() {
  getDialogEl()
    ?.querySelector('.el-dialog__header')
    ?.removeEventListener('mousedown', onDragMouseDown)
  resetDialogShell()
}

watch(visible, async val => {
  if (val) {
    keyword.value = ''
    resetHighlightState()
    await loadLogs()
    await startListening()
  } else {
    stopListening()
    resetHighlightState()
  }
})

watch(
  () => share.conn?.id,
  id => {
    if (!visible.value) return
    resetHighlightState()
    if (!id) {
      logs.value = []
      return
    }
    void loadLogs()
  },
)

onUnmounted(() => {
  stopListening()
  resetHighlightState()
  resetDialogShell()
})

const filterLogs = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return logs.value
  return logs.value.filter(row => {
    const text = `${row.fullCommand} ${row.command}`.toLowerCase()
    return text.includes(key)
  })
})

function rowClassName({ row }: { row: CommandLogEntry }) {
  return highlightIds.value.has(row.id) ? 'command-log-row--new' : ''
}

function rowStyle({ row }: { row: CommandLogEntry }) {
  if (!highlightIds.value.has(row.id)) return {}
  return { color: highlightColor.value }
}

async function loadLogs() {
  if (!share.conn?.id) {
    logs.value = []
    return
  }
  loading.value = true
  try {
    const entries = await meCommands.commandLogs(share.conn.id, LOG_LIMIT)
    logs.value = entries
    seenMaxId.value = entries.reduce((max, row) => Math.max(max, row.id), 0)
  } finally {
    loading.value = false
  }
}

function clearLogs() {
  meConfirm(t('commandLog.clearConfirm'), async () => {
    await meCommands.commandLogsClear(share.conn!.id)
    meOk(t('commandLog.clearOk'))
    resetHighlightState()
    logs.value = []
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :class="DIALOG_CLASS"
    :title="t('commandLog.title')"
    width="80vw"
    align-center
    :modal="false"
    :modal-penetrable="true"
    :lock-scroll="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
    append-to-body
    @opened="onDialogOpened"
    @closed="onDialogClosed">
    <me-table
      class="command-log-table"
      :data="filterLogs"
      export-name="command-log"
      height="100%"
      v-loading="loading"
      stripe
      border
      :empty-text="loading ? ' ' : t('commandLog.empty')"
      :row-class-name="rowClassName"
      :row-style="rowStyle">
      <el-table-column
        prop="timestamp"
        :label="t('commandLog.time')"
        width="200"
        class-name="col-nowrap"
        show-overflow-tooltip />
      <el-table-column prop="dbIndex" :label="t('commandLog.db')" width="56" align="center" />
      <el-table-column min-width="360">
        <template #header>
          <div class="command-log-header">
            <span class="command-log-header__label">{{ t('commandLog.command') }}</span>
            <div class="command-log-header__tools" @mousedown.stop>
              <me-button
                icon="el-icon-delete"
                :info="t('commandLog.clear')"
                :disabled="logs.length === 0"
                placement="top"
                @click="clearLogs" />
              <el-input
                v-model="keyword"
                :placeholder="t('commandLog.keyword')"
                class="command-log-header__search"
                clearable />
            </div>
          </div>
        </template>
        <template #default="{ row }">
          <div class="command-log-cmd-row">
            <span class="command-log-cmd" :title="row.fullCommand">{{ row.fullCommand }}</span>
            <span v-if="row.error" class="command-log-cmd__flag">
              <el-tooltip :content="row.error" placement="top" :show-after="300">
                <span aria-hidden="true">❎</span>
              </el-tooltip>
            </span>
            <span v-else-if="row.durationMs > SLOW_MS" class="command-log-cmd__flag">
              <el-tooltip
                :content="t('commandLog.slowHint', { ms: row.durationMs })"
                placement="top"
                :show-after="300">
                <span aria-hidden="true">⚠️</span>
              </el-tooltip>
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('commandLog.duration')"
        width="96"
        align="right"
        prop="durationMs" />
    </me-table>
  </el-dialog>
</template>

<!-- append-to-body：弹框样式写在组件内 -->
<style lang="scss">
.el-dialog.command-log-dialog {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 60vh;
  min-width: 520px;
  min-height: 320px;
  max-width: 96vw;
  max-height: 92vh;

  .el-dialog__header {
    cursor: move;
    margin-right: 0;
    padding-bottom: 8px;
  }

  .el-dialog__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-top: 8px;
  }

  .command-log-resize-handle {
    position: absolute;
    z-index: 30;

    &--n {
      top: 0;
      left: 10px;
      right: 10px;
      height: 6px;
      cursor: n-resize;
    }

    &--s {
      bottom: 0;
      left: 10px;
      right: 10px;
      height: 6px;
      cursor: s-resize;
    }

    &--e {
      right: 0;
      top: 10px;
      bottom: 10px;
      width: 6px;
      cursor: e-resize;
    }

    &--w {
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 6px;
      cursor: w-resize;
    }

    &--nw {
      top: 0;
      left: 0;
      width: 10px;
      height: 10px;
      cursor: nw-resize;
    }

    &--ne {
      top: 0;
      right: 0;
      width: 10px;
      height: 10px;
      cursor: ne-resize;
    }

    &--sw {
      bottom: 0;
      left: 0;
      width: 10px;
      height: 10px;
      cursor: sw-resize;
    }

    &--se {
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      cursor: se-resize;
    }
  }
}
</style>

<style scoped lang="scss">
.command-log-table {
  flex: 1;
  min-height: 0;
}

:deep(.command-log-header) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-weight: normal;
}

:deep(.command-log-header__label) {
  flex-shrink: 0;
  font-weight: bold;
}

:deep(.command-log-header__tools) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

:deep(.command-log-header__search) {
  width: 200px;
  max-width: 100%;
}

.command-log-cmd-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.command-log-cmd {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-log-cmd__flag {
  flex-shrink: 0;
  line-height: 1;
}

:deep(.col-nowrap .cell) {
  white-space: nowrap;
}

:deep(.command-log-row--new .cell) {
  color: inherit;
}
</style>
