<script setup lang="ts">
import { Sortable, type SortableEvent } from 'sortablejs'
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { UiConn } from '@/types/me-interface'
import type { ConnGroupSection } from '@/utils/conn-group'
import { applyConnGroupOrder, moveConnInGroup, moveConnToGroup } from '@/utils/conn-group'
import { PREDEFINE_COLORS } from '@/utils/util'

const props = defineProps<{
  sections: ConnGroupSection[]
  connGroups: string[]
  connList: UiConn[]
}>()

const emit = defineEmits<{
  select: [conn: UiConn]
  copy: [conn: UiConn]
  edit: [conn: UiConn]
  delete: [conn: UiConn]
  renameFolder: [name: string]
  deleteFolder: [name: string]
}>()

const { t } = useI18n()
const listRef = useTemplateRef<HTMLElement>('listRef')

function expandedStore(): Record<string, boolean> {
  return meTauri.settings.connGroupExpanded as Record<string, boolean>
}

watch(
  () => props.sections,
  sections => {
    const store = expandedStore()
    for (const sec of sections) {
      const k = sec.key || ''
      if (!(k in store)) store[k] = true
    }
  },
  { immediate: true },
)

function sectionTitle(key: string): string {
  return key || t('conn.ungrouped')
}

function toggle(key: string): void {
  const store = expandedStore()
  const k = key || ''
  store[k] = !isExpanded(key)
}

function isExpanded(key: string): boolean {
  const k = key || ''
  const store = expandedStore()
  if (!(k in store)) return true
  return store[k] !== false
}

function connStyle(conn: UiConn): Record<string, string> | undefined {
  if (conn.color) return { color: conn.color }
  return undefined
}

let sortables: Sortable[] = []

function destroySortables(): void {
  for (const s of sortables) s.destroy()
  sortables = []
}

function findConn(id: string | null): UiConn | undefined {
  if (!id) return undefined
  return props.connList.find(c => c.id === id)
}

function readSortableFolderOrder(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>('.group-block--sortable')]
    .map(el => el.dataset.groupKey ?? '')
    .filter(Boolean)
}

function setupDrag(): void {
  destroySortables()
  const root = listRef.value
  if (!root) return

  sortables.push(
    Sortable.create(root, {
      draggable: '.group-block--sortable',
      handle: '.group-head',
      filter: '.folder-actions',
      preventOnFilter: true,
      animation: 150,
      onEnd: () => {
        applyConnGroupOrder(props.connList, props.connGroups, readSortableFolderOrder(root))
      },
    }),
  )

  root.querySelectorAll<HTMLElement>('.conn-list').forEach(listEl => {
    const groupKey = listEl.dataset.groupKey ?? ''
    sortables.push(
      Sortable.create(listEl, {
        draggable: '.conn-row',
        filter: '.conn-actions',
        preventOnFilter: true,
        group: 'conn-groups',
        onEnd: (evt: SortableEvent) => {
          const { oldIndex, newIndex, from, to, item } = evt
          if (oldIndex === undefined || newIndex === undefined) return
          const conn = findConn(item.dataset.id ?? null)
          if (!conn) return
          const toKey = (to as HTMLElement).dataset.groupKey ?? ''
          if (from === to) {
            moveConnInGroup(props.connList, props.connGroups, groupKey, oldIndex, newIndex)
          } else {
            moveConnToGroup(props.connList, props.connGroups, conn, toKey, newIndex)
          }
        },
      }),
    )
  })
}

onMounted(() => void nextTick(setupDrag))
onBeforeUnmount(() => destroySortables())
watch(
  () => props.sections,
  () => void nextTick(setupDrag),
  { deep: true },
)
</script>

<template>
  <div ref="listRef" class="conn-group-list">
    <div
      v-for="sec in sections"
      :key="sec.key || '__default__'"
      class="group-block"
      :class="{ 'group-block--sortable': !!sec.key }"
      :data-group-key="sec.key">
      <div class="group-head" @click="toggle(sec.key)">
        <me-icon
          :icon="isExpanded(sec.key) ? 'el-icon-folder-opened' : 'el-icon-folder'"
          :name="sectionTitle(sec.key)" />
        <span class="group-count">({{ sec.conns.length }})</span>
        <span v-if="sec.key" class="folder-actions row-actions" @click.stop>
          <span class="action-slot" />
          <span class="action-slot" />
          <me-icon
            :info="t('conn.renameFolder')"
            icon="el-icon-edit"
            class="icon-btn"
            @click="emit('renameFolder', sec.key)" />
          <me-icon
            :info="t('conn.deleteFolder')"
            icon="el-icon-delete"
            class="icon-btn"
            @click="emit('deleteFolder', sec.key)" />
        </span>
      </div>
      <div v-show="isExpanded(sec.key)" class="conn-list" :data-group-key="sec.key">
        <div
          v-for="conn in sec.conns"
          :key="conn.id"
          class="conn-row"
          :data-id="conn.id"
          :style="connStyle(conn)"
          @dblclick="emit('select', conn)">
          <me-icon
            :icon="conn.cluster ? 'me-icon-cluster' : 'el-icon-monitor'"
            :name="conn.name"
            class="conn-name"
            @click="emit('select', conn)" />
          <span class="conn-host">{{ conn.host }}:{{ conn.port }}</span>
          <span class="conn-actions row-actions" @click.stop>
            <el-color-picker
              size="small"
              v-model="conn.color"
              :predefine="PREDEFINE_COLORS"
              @click.stop />
            <me-icon
              :info="t('copy')"
              icon="el-icon-document-copy"
              class="icon-btn"
              @click="emit('copy', conn)" />
            <me-icon
              :info="t('edit')"
              icon="el-icon-edit"
              class="icon-btn"
              @click="emit('edit', conn)" />
            <me-icon
              :info="t('delete')"
              icon="el-icon-delete"
              class="icon-btn"
              @click="emit('delete', conn)" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.conn-group-list {
  font-size: 14px;

  .group-head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px 8px 0;
    cursor: pointer;
    border-radius: 4px;
    opacity: 0.8;
    // color: var(--el-text-color-secondary);

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .group-block--sortable .group-head {
    cursor: grab;
  }

  .group-block--sortable.sortable-chosen .group-head {
    cursor: grabbing;
  }

  /* 颜色 | 复制 | 编辑 | 删除 — 文件夹空两格后与连接的编辑、删除对齐 */
  .row-actions {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: 28px repeat(3, 1em);
    gap: 8px;
    align-items: center;
    justify-items: center;
  }

  .folder-actions {
    margin-left: auto;
  }

  .conn-list {
    padding: 0 0 4px 10px;
  }

  .conn-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: grab;

    &:hover {
      background: var(--el-fill-color-light);

      .conn-actions {
        opacity: 1;
      }
    }

    &.sortable-chosen {
      cursor: grabbing;
      background: var(--el-fill-color-light);
    }
  }

  .conn-name {
    flex: 1;
    min-width: 0;
    cursor: pointer;

    :deep(.icon-main) {
      overflow: hidden;
    }
  }

  .conn-host {
    flex-shrink: 0;
    margin-left: auto;
    margin-right: 12px;
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
    color: var(--el-color-info);
  }

  .folder-actions {
    opacity: 0;
  }

  .conn-actions {
    opacity: 0.35;
  }

  .group-head:hover .folder-actions {
    opacity: 1;
  }

  :deep(.sortable-ghost) {
    background-color: var(--el-color-primary-light-8);
  }
}
</style>
