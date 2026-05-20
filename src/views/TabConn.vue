<script setup lang="ts">
import { save, type DialogFilter } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import { Sortable, type SortableEvent } from 'sortablejs'
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  useTemplateRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { appProvideKey, shareProvideKey, type UiConn } from '@/types/me-interface'
import {
  buildConnGroupSections,
  mergeConnGroupsFromList,
  normalizeGroupName,
  removeConnGroup,
  renameConnGroup,
} from '@/utils/conn-group'
import { encodeRedisMeConnectionsToMec, mergeImportedConnList } from '@/utils/rdm'
import {
  meConfirm,
  meDownloadUpdate,
  meErr,
  meOk,
  mePrompt,
  meWarn,
  openNewWindow,
} from '@/utils/util'
import ConnEmpty, { type ConnEmptyShortcut } from '@/views/conn/ConnEmpty.vue'
import ConnGroup from '@/views/conn/ConnGroup.vue'
import ConnImport from '@/views/conn/ConnImport.vue'
import ConnSave from '@/views/conn/ConnSave.vue'
import ConnTable from '@/views/conn/ConnTable.vue'
import Setting from '@/views/ext/Setting.vue'

const { t } = useI18n()
const share = inject(shareProvideKey)!

/** 分组名有序列表（持久化）；空数组时自动初始化 */
const connGroups = computed(() => {
  const list = meTauri.settings.connGroups
  if (!Array.isArray(list)) {
    meTauri.settings.connGroups = []
    return meTauri.settings.connGroups
  }
  return list
})

/** 平铺 ConnTable / 分组 ConnGroup，由 settings.connShow 切换 */
const connShowGroup = computed({
  get: () => meTauri.settings.connShow === 'group',
  set: (v: boolean) => {
    meTauri.settings.connShow = v ? 'group' : 'flat'
  },
})

const keyword = ref('')
const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  return share.connList.filter(
    row =>
      !key ||
      row.name?.toLowerCase().indexOf(key) > -1 ||
      row.host?.toLowerCase().indexOf(key) > -1,
  )
})

/** 分组视图数据源：按 connGroups 顺序拆 section，并应用 keyword 筛选 */
const groupSections = computed(() =>
  buildConnGroupSections(share.connList, connGroups.value, keyword.value),
)

const connRef = useTemplateRef<InstanceType<typeof ConnSave>>('conn')
const importRef = useTemplateRef<InstanceType<typeof ConnImport>>('import')
const flatTableRef = useTemplateRef<InstanceType<typeof ConnTable>>('flatTableRef')
const dialog = reactive({ conn: false, import: false, setting: false })

const connListEmpty = computed(() => share.connList.length === 0)

/** 空状态快捷键列表（展示与 TabConn 全局热键一致） */
const emptyShortcuts = computed((): ConnEmptyShortcut[] => [
  { action: 'add', label: t('conn.add'), keys: ['mod', 'N'] },
  { action: 'import', label: t('conn.import'), keys: ['mod', 'I'] },
  { action: 'newWindow', label: t('conn.emptyNewWindow'), keys: ['mod', 'shift', 'W'] },
  { action: 'setting', label: t('conn.emptyAppSetting'), keys: ['mod', 'shift', 'S'] },
])

function addConn(): void {
  dialog.conn = true
  void nextTick(() => connRef.value?.open('add'))
}

function openImport(): void {
  dialog.import = true
  void nextTick(() => importRef.value?.open())
}

function openSetting(): void {
  dialog.setting = true
}

function onEmptyAction(action: string): void {
  if (action === 'add') addConn()
  else if (action === 'import') openImport()
  else if (action === 'newWindow') void openNewWindow()
  else if (action === 'setting') openSetting()
}

function isConnHotkeyBlocked(e: KeyboardEvent): boolean {
  const target = e.target
  return (
    target instanceof HTMLElement && !!target.closest('input, textarea, [contenteditable="true"]')
  )
}

/** 连接页全局快捷键（输入框内不触发；标点键用 e.code，避免 Ctrl 按下后 e.key 异常） */
function onConnHotkey(e: KeyboardEvent): void {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || isConnHotkeyBlocked(e)) return

  if (!e.shiftKey && (e.code === 'KeyN' || e.key === 'n' || e.key === 'N')) {
    e.preventDefault()
    addConn()
    return
  }
  if (!e.shiftKey && (e.code === 'KeyI' || e.key === 'i' || e.key === 'I')) {
    e.preventDefault()
    openImport()
    return
  }
  if (e.shiftKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    openSetting()
    return
  }
  if (e.shiftKey && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W')) {
    e.preventDefault()
    void openNewWindow()
  }
}

function copyConn(conn: UiConn): void {
  dialog.conn = true
  void nextTick(() => connRef.value?.open('add', conn))
}

function editConn(conn: UiConn): void {
  dialog.conn = true
  void nextTick(() => connRef.value?.open('edit', conn))
}

function deleteConn(conn: UiConn): void {
  meConfirm(t('conn.deleteConn', { name: conn.name }), () => {
    const index = share.connList.indexOf(conn)
    if (index > -1) share.connList.splice(index, 1)
  })
}

const selectConn = debounce(async (conn: UiConn) => {
  share.conn = conn
}, 200)

let sortables: Sortable[] = []

function destroySortables(): void {
  for (const s of sortables) s.destroy()
  sortables = []
}

function setupFlatDrag(): void {
  const tbody = flatTableRef.value?.getTbody()
  if (!tbody) return
  sortables.push(
    Sortable.create(tbody, {
      handle: '.drag-handle',
      onEnd: ({ oldIndex, newIndex }: SortableEvent) => {
        if (oldIndex === undefined || newIndex === undefined) return
        const list = filterDataList.value
        const dragRow = list[oldIndex]
        const target = list[newIndex]
        if (!dragRow || !target) return
        const from = share.connList.indexOf(dragRow)
        const to = share.connList.indexOf(target)
        if (from < 0 || to < 0) return
        const [item] = share.connList.splice(from, 1)
        if (item) share.connList.splice(to, 0, item)
      },
    }),
  )
}

function refreshFlatSortable(): void {
  if (connShowGroup.value) return
  destroySortables()
  void nextTick(() => setupFlatDrag())
}

onMounted(() => {
  window.addEventListener('keydown', onConnHotkey, true)
  refreshFlatSortable()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onConnHotkey, true)
  destroySortables()
})
watch([connShowGroup, filterDataList], () => refreshFlatSortable())

const filters: DialogFilter[] = [{ name: '', extensions: ['mec'] }]
const isDev = import.meta.env.DEV

function handleCommand(command: string): void {
  if (command === 'export') void exportConn()
  else if (command === 'import') openImport()
  else if (command === 'connShowFlat') connShowGroup.value = false
  else if (command === 'connShowGroup') connShowGroup.value = true
  else if (command === 'clear' && isDev) clearAllConnections()
}

function promptFolderName(title: string, inputValue: string, onOk: (name: string) => void): void {
  mePrompt(
    title,
    {
      inputValue,
      inputValidator: v => !!normalizeGroupName(v) || t('conn.folderNameRequired'),
    },
    ({ value }) => {
      const name = normalizeGroupName(value)
      if (name) onOk(name)
    },
  )
}

// —— 分组文件夹 CRUD（仅分组模式下显示） ——

function addFolder(): void {
  promptFolderName(t('conn.newFolder'), '', name => {
    if (connGroups.value.some(g => normalizeGroupName(g) === name)) {
      meWarn(t('conn.folderExists'))
      return
    }
    connGroups.value.push(name)
    meOk(t('addOk'))
  })
}

function renameFolder(name: string): void {
  promptFolderName(t('conn.renameFolder'), name, newName => {
    if (newName === name) return
    if (connGroups.value.some(g => normalizeGroupName(g) === newName)) {
      meWarn(t('conn.folderExists'))
      return
    }
    if (
      renameConnGroup(
        share.connList,
        connGroups.value,
        name,
        newName,
        meTauri.settings.connGroupExpanded as Record<string, boolean>,
      )
    ) {
      meOk(t('conn.renameFolderOk'))
    }
  })
}

function deleteFolder(name: string): void {
  meConfirm(t('conn.deleteFolderConfirm', { name }), () => {
    removeConnGroup(
      share.connList,
      connGroups.value,
      name,
      meTauri.settings.connGroupExpanded as Record<string, boolean>,
    )
    meOk(t('conn.deleteFolderOk'))
  })
}

function clearAllConnections(): void {
  meConfirm(t('conn.clearConnectionsConfirm'), () => {
    share.connList.splice(0, share.connList.length)
    share.conn = null
    // 清空连接时一并重置分组名列表与折叠状态
    connGroups.value.splice(0, connGroups.value.length)
    const expanded = meTauri.settings.connGroupExpanded as Record<string, boolean>
    for (const k of Object.keys(expanded)) delete expanded[k]
    meOk(t('conn.clearConnectionsOk'))
  })
}

async function exportConn(): Promise<void> {
  const fileName = 'redis-me-connections_' + dayjs().format('YYYYMMDDHHmmss') + '.mec'
  const path = await save({ filters, defaultPath: fileName })
  if (path) {
    try {
      await writeTextFile(path, encodeRedisMeConnectionsToMec(share.connList))
      meOk(t('conn.exportOk'))
    } catch (e: unknown) {
      meErr(e instanceof Error ? e : String(e), t('conn.exportErr'))
    }
  }
}

function onConnImported(impConnList: UiConn[]): void {
  share.connList = mergeImportedConnList(share.connList, impConnList)
  // 导入文件中的分组名写入 connGroups，避免分组视图缺块
  mergeConnGroupsFromList(share.connList, connGroups.value)
  meOk(t('conn.importOk'))
}

const app = inject(appProvideKey)!
function clickNew(): void {
  const u = app.update
  if (!u) return
  void meDownloadUpdate(false, toRaw(u), app)
}
</script>

<template>
  <div class="redis-conn">
    <div class="me-flex header">
      <div class="me-flex">
        <el-button icon="el-icon-plus" type="primary" @click="addConn">{{
          t('conn.add')
        }}</el-button>
        <el-button v-if="connShowGroup" icon="el-icon-folder-add" @click="addFolder">{{
          t('conn.newFolder')
        }}</el-button>
      </div>
      <div class="me-flex">
        <me-icon icon="me-icon-new" class="icon-new" @click="clickNew" v-if="app.update?.version" />
        <el-dropdown placement="bottom-start" @command="handleCommand" style="margin-right: 10px">
          <el-button>...</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="connShowGroup" command="connShowFlat">
                <me-icon :name="t('conn.showFlat')" icon="me-icon-list" />
              </el-dropdown-item>
              <el-dropdown-item v-if="!connShowGroup" command="connShowGroup">
                <me-icon :name="t('conn.showGroup')" icon="el-icon-folder" />
              </el-dropdown-item>
              <el-dropdown-item command="export" divided :disabled="share.connList.length === 0">
                <me-icon :name="t('conn.export')" icon="me-icon-export" />
              </el-dropdown-item>
              <el-dropdown-item command="import">
                <me-icon :name="t('conn.import')" icon="me-icon-import" />
              </el-dropdown-item>
              <el-dropdown-item
                v-if="isDev"
                command="clear"
                divided
                :disabled="share.connList.length === 0">
                <me-icon :name="t('conn.clearConnections')" icon="el-icon-delete" />
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-input
          v-model="keyword"
          :placeholder="t('conn.keyword')"
          style="width: 300px"
          clearable />
      </div>
    </div>

    <ConnEmpty
      v-if="connListEmpty"
      class="conn-empty-wrap"
      :shortcuts="emptyShortcuts"
      @action="onEmptyAction" />

    <ConnTable
      v-else-if="!connShowGroup"
      ref="flatTableRef"
      class="conn-table-wrap"
      :data="filterDataList"
      @select="selectConn"
      @copy="copyConn"
      @edit="editConn"
      @delete="deleteConn" />

    <ConnGroup
      v-else
      class="group-list"
      :sections="groupSections"
      :conn-groups="connGroups"
      :conn-list="share.connList"
      @select="selectConn"
      @copy="copyConn"
      @edit="editConn"
      @delete="deleteConn"
      @rename-folder="renameFolder"
      @delete-folder="deleteFolder" />

    <ConnSave ref="conn" v-if="dialog.conn" @closed="dialog.conn = false" />
    <ConnImport
      ref="import"
      v-if="dialog.import"
      @import="onConnImported"
      @closed="dialog.import = false" />

    <el-dialog
      v-model="dialog.setting"
      width="600"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      align-center
      draggable>
      <template #header>
        <me-icon icon="el-icon-setting" :name="t('setting.title')" />
      </template>
      <Setting />
    </el-dialog>

    <el-progress
      class="downloading"
      type="dashboard"
      :percentage="app.downloadPercentage"
      v-if="app.downloading">
      <template #default="{ percentage }">
        <div class="percentage-value">{{ percentage }}%</div>
        <div class="percentage-label">{{ t('conn.downloading') }}</div>
      </template>
    </el-progress>
  </div>
</template>

<style scoped lang="scss">
.redis-conn {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 5px;

  .header {
    margin-bottom: 10px;

    .icon-new {
      margin: 0 10px;
      font-size: 30px;
      color: var(--el-color-danger);
      cursor: pointer;
    }
  }

  .conn-empty-wrap,
  .conn-table-wrap,
  .group-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  :deep(.el-checkbox) {
    margin-right: 10px;
  }

  :deep(.drag-handle) {
    cursor: move;
  }

  :deep(.sortable-ghost) {
    background-color: var(--el-color-primary-light-8);
  }

  .downloading {
    position: absolute;
    right: 20px;
    bottom: 0;
    z-index: 100;

    .percentage-value {
      font-size: 28px;
      color: var(--el-color-primary);
    }

    .percentage-label {
      margin-top: 10px;
      font-size: 14px;
    }
  }
}
</style>
