<script setup lang="ts">
import { open, save, type DialogFilter } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import dayjs from 'dayjs'
import type { TableInstance } from 'element-plus'
import { debounce } from 'lodash'
import { Sortable, type SortableEvent } from 'sortablejs'
import { computed, inject, nextTick, onMounted, reactive, ref, toRaw, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { appProvideKey, shareProvideKey, type UiConn } from '@/types/me-interface'
import { encodeRedisMeConnectionsToMec, mergeImportedConnList } from '@/utils/rdm'
import { meConfirm, meDownloadUpdate, meErr, meLog, meOk, PREDEFINE_COLORS } from '@/utils/util'
import ConnImport from '@/views/ext/ConnImport.vue'
import ConnSave from '@/views/ext/ConnSave.vue'

const { t } = useI18n()
const share = inject(shareProvideKey)!

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

const connRef = useTemplateRef<InstanceType<typeof ConnSave>>('conn')
const importRef = useTemplateRef<InstanceType<typeof ConnImport>>('import')
const dialog = reactive({
  conn: false,
  import: false,
})

function addConn(): void {
  dialog.conn = true
  void nextTick(() => connRef.value?.open('add'))
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
    if (index > -1) {
      share.connList.splice(index, 1)
    }
  })
}

const selectConn = debounce(async (conn: UiConn) => {
  share.conn = conn
}, 200)

function cellStyle({ row }: { row: UiConn }): Record<string, string> | undefined {
  if (row.color) return { color: row.color }
  return undefined
}

const table = useTemplateRef<TableInstance>('table')

function rowDrag(): void {
  const inst = table.value
  if (!inst) return
  const tbody = inst.$el.querySelector('.el-table__body-wrapper tbody')
  if (!tbody) return
  Sortable.create(tbody as HTMLElement, {
    handle: '.drag-handle',
    onEnd: ({ oldIndex, newIndex }: SortableEvent) => {
      if (oldIndex === undefined || newIndex === undefined) return
      const dragRow = share.connList.splice(oldIndex, 1)[0]
      share.connList.splice(newIndex, 0, dragRow)
    },
  })
}

onMounted(() => rowDrag())

const filters: DialogFilter[] = [{ name: '', extensions: ['mec'] }]

function handleCommand(command: string): void {
  if (command === 'export') {
    void exportConn()
  } else if (command === 'import') {
    dialog.import = true
    void nextTick(() => importRef.value?.open())
  }
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
  meLog('impConnList', impConnList)
  share.connList = mergeImportedConnList(share.connList, impConnList)
  meLog('newConnList', share.connList)
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
      </div>
      <div class="me-flex">
        <me-icon icon="me-icon-new" class="icon-new" @click="clickNew" v-if="app.update?.version" />
        <el-dropdown placement="bottom-start" @command="handleCommand" style="margin-right: 10px">
          <el-button>...</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export" :disabled="share.connList.length === 0">
                <me-icon :name="t('conn.export')" icon="me-icon-export" />
              </el-dropdown-item>
              <el-dropdown-item command="import">
                <me-icon :name="t('conn.import')" icon="me-icon-import" />
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-input
          v-model="keyword"
          :placeholder="t('conn.keyword')"
          style="width: 300px; margin-right: 10px"
          clearable />
      </div>
    </div>
    <el-table
      ref="table"
      :data="filterDataList"
      :cell-style="cellStyle"
      row-key="id"
      @row-dblclick="selectConn"
      border
      stripe
      height="100%">
      <el-table-column label="#" type="index" width="50" align="center" class-name="drag-handle" />
      <el-table-column :label="t('conn.color')" prop="color" width="64" align="center">
        <template #default="scope">
          <el-color-picker size="small" v-model="scope.row.color" :predefine="PREDEFINE_COLORS" />
        </template>
      </el-table-column>
      <el-table-column :label="t('conn.name')" prop="name" show-overflow-tooltip>
        <template #default="scope">
          <div style="display: flex">
            <el-link
              underline="never"
              type="primary"
              @click="selectConn(scope.row)"
              :style="{ '--el-link-text-color': scope.row.color }">
              <me-icon
                :icon="scope.row.cluster ? 'me-icon-cluster' : 'el-icon-monitor'"
                :name="scope.row.name" />
            </el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('conn.hostPort')" prop="host" width="200" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.host + ':' + scope.row.port }}
        </template>
      </el-table-column>
      <el-table-column :label="t('conn.otherProp')" width="200" show-overflow-tooltip>
        <template #default="scope">
          <el-checkbox disabled size="small" v-model="scope.row.readonly">{{
            t('conn.readonlyShort')
          }}</el-checkbox>
          <el-checkbox disabled size="small" v-model="scope.row.cluster">{{
            t('conn.cluster')
          }}</el-checkbox>
          <el-checkbox disabled size="small" v-model="scope.row.ssl">SSL</el-checkbox>
        </template>
      </el-table-column>
      <el-table-column :label="t('action')" width="100" fixed="right" align="center">
        <template #default="scope">
          <div class="me-flex">
            <me-icon
              :info="t('copy')"
              icon="el-icon-document-copy"
              class="icon-btn"
              @click="copyConn(scope.row)" />
            <me-icon
              :info="t('edit')"
              icon="el-icon-edit"
              class="icon-btn"
              @click="editConn(scope.row)" />
            <me-icon
              :info="t('delete')"
              icon="el-icon-delete"
              class="icon-btn"
              @click="deleteConn(scope.row)" />
          </div>
        </template>
      </el-table-column>
    </el-table>

    <ConnSave ref="conn" v-if="dialog.conn" @closed="dialog.conn = false" />
    <ConnImport
      ref="import"
      v-if="dialog.import"
      @import="onConnImported"
      @closed="dialog.import = false" />

    <!-- 应用升级时的下载进度显示 -->
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
  //border: 2px solid red;
  height: 100%;
  display: flex;
  flex-direction: column;

  .header {
    margin-bottom: 10px;

    //新版本图标提示
    .icon-new {
      margin: 0 10px;
      font-size: 30px;
      color: var(--el-color-danger);
      cursor: pointer;
    }
  }

  // 其他属性，默认右侧30px改为10px，降低宽度占用
  :deep(.el-checkbox) {
    margin-right: 10px;
  }

  // 拖拽进行连接的上下调整
  :deep(.drag-handle) {
    cursor: move;
  }

  :deep(.sortable-ghost) {
    background-color: var(--el-color-primary-light-8);
  }

  // 版本升级过程中显示下载进度
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
