<script setup lang="ts">
import { Sortable, type SortableEvent } from 'sortablejs'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { UiConn } from '@/types/me-interface'
import type { ConnGroupSection } from '@/utils/conn-group'
import { moveConnInGroup, moveConnToGroup } from '@/utils/conn-group'

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
const expanded = ref<Record<string, boolean>>({})

watch(
  () => props.sections,
  sections => {
    for (const sec of sections) {
      const k = sec.key || ''
      if (!(k in expanded.value)) expanded.value[k] = true
    }
  },
  { immediate: true },
)

function sectionTitle(key: string): string {
  return key || t('conn.ungrouped')
}

function toggle(key: string): void {
  expanded.value[key] = !expanded.value[key]
}

function isExpanded(key: string): boolean {
  return expanded.value[key] !== false
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

function setupDrag(): void {
  destroySortables()
  const root = listRef.value
  if (!root) return
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
    <div v-for="sec in sections" :key="sec.key || '__ungrouped__'" class="group-block">
      <div class="group-head" @click="toggle(sec.key)">
        <me-icon
          :icon="isExpanded(sec.key) ? 'el-icon-folder-opened' : 'el-icon-folder'"
          :name="sectionTitle(sec.key)" />
        <span class="group-count">({{ sec.conns.length }})</span>
        <span v-if="sec.key" class="folder-actions row-actions" @click.stop>
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
    padding: 8px 10px;
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  /* 与连接行一致：3 个图标位宽，文件夹仅占右侧 2 个（编辑、删除）与连接的编辑、删除对齐 */
  .row-actions {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    width: calc(3 * 1em + 16px);
  }

  .folder-actions {
    margin-left: auto;
  }

  .conn-list {
    padding: 0 0 4px 22px;
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

  .conn-actions {
    opacity: 0.35;
  }

  :deep(.sortable-ghost) {
    background-color: var(--el-color-primary-light-8);
  }
}
</style>
