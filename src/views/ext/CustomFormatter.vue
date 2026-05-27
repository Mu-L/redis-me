<script setup lang="ts">
/** 自定义编解码 CRUD：由 RedisValue 数据编码下拉头部编辑入口打开；列表顺序即下拉展示顺序 */
import type { TableInstance } from 'element-plus'
import { Sortable, type SortableEvent } from 'sortablejs'
import { computed, nextTick, onBeforeUnmount, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  buildFormatterCommand,
  parseFormatterErrorDetail,
  testFormatter,
  type CustomFormatter,
} from '@/utils/custom-formatter'
import { meErr, meErrHtml, meOk } from '@/utils/util'

const visible = defineModel<boolean>({ default: false })

const { t } = useI18n()

const tableRef = useTemplateRef<TableInstance>('table')
const list = computed(() => window.meTauri.settings.customFormatters ?? [])

let sortable: Sortable | null = null

function destroySortable() {
  sortable?.destroy()
  sortable = null
}

/** 绑定 el-table tbody；顺序写入 settings.customFormatters */
function setupSortable() {
  destroySortable()
  const tbody = tableRef.value?.$el.querySelector(
    '.el-table__body-wrapper tbody',
  ) as HTMLElement | null
  if (!tbody) return
  sortable = Sortable.create(tbody, {
    handle: '.drag-handle',
    filter: '.row-actions',
    preventOnFilter: true,
    animation: 150,
    onEnd({ oldIndex, newIndex }: SortableEvent) {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      const arr = window.meTauri.settings.customFormatters
      if (!Array.isArray(arr)) return
      const [item] = arr.splice(oldIndex, 1)
      if (item) arr.splice(newIndex, 0, item)
    },
  })
}

watch(
  () => [visible.value, list.value.length] as const,
  ([open]) => {
    if (!open) {
      destroySortable()
      return
    }
    void nextTick(setupSortable)
  },
)

onBeforeUnmount(() => destroySortable())

const formVisible = ref(false)
const editIndex = ref(-1)
const testingDecode = ref(false)
const testingEncode = ref(false)
const form = reactive<CustomFormatter>({ name: '', command: '' })
// 解码：wire Base64（hello）；编码：编辑区 Hex 文本 68656c6c6f 的 UTF-8 Base64
const testDecodeSample = ref('aGVsbG8=')
const testEncodeSample = ref('Njg2NTZjNmM2Zg==')

const formValid = computed(() => form.name.trim() !== '' && form.command.trim() !== '')

function readForm(): CustomFormatter | null {
  const name = form.name.trim()
  const command = form.command.trim()
  if (!name || !command) return null
  return { name, command }
}

function openAdd() {
  editIndex.value = -1
  form.name = ''
  form.command = ''
  formVisible.value = true
}

function openEdit(row: CustomFormatter, index: number) {
  editIndex.value = index
  form.name = row.name
  form.command = row.command
  formVisible.value = true
}

function removeAt(index: number) {
  list.value.splice(index, 1)
}

function saveForm() {
  const name = form.name.trim()
  const command = form.command.trim()
  if (!name) {
    meErr(t('customFormatter.nameRequired'))
    return
  }
  if (!command) {
    meErr(t('customFormatter.emptyCommand'))
    return
  }
  const dup = list.value.findIndex((f, i) => f.name === name && i !== editIndex.value)
  if (dup >= 0) {
    meErr(t('customFormatter.duplicateName'))
    return
  }
  const item = { name, command }
  if (editIndex.value >= 0) {
    list.value[editIndex.value] = item
  } else {
    list.value.push(item)
  }
  formVisible.value = false
}

async function runTest(mode: 'decode' | 'encode') {
  const formatter = readForm()
  if (!formatter) {
    meErr(t('customFormatter.emptyCommand'))
    return
  }
  const sample = (mode === 'decode' ? testDecodeSample : testEncodeSample).value.trim()
  const loading = mode === 'decode' ? testingDecode : testingEncode
  loading.value = true
  try {
    const out = await testFormatter(formatter, mode, sample)
    const preview = buildFormatterCommand(formatter, mode, sample)
    meOk(
      t('customFormatter.testResult', { command: preview, input: sample, output: out }),
      true,
      t('customFormatter.testOk'),
      { dangerouslyUseHTMLString: true },
    )
  } catch (e) {
    const preview = buildFormatterCommand(formatter, mode, sample)
    const detail = parseFormatterErrorDetail(e instanceof Error ? e.message : String(e))
    meErrHtml(t('customFormatter.testErrorResult', { command: preview, input: sample, detail }))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('customFormatter.title')"
    width="560px"
    append-to-body
    destroy-on-close
    draggable>
    <div class="me-flex" style="justify-content: flex-end; margin-bottom: 12px">
      <el-button size="small" icon="el-icon-plus" @click="openAdd">{{
        t('customFormatter.add')
      }}</el-button>
    </div>

    <el-table ref="table" :data="list" row-key="name" empty-text="—" size="small">
      <el-table-column label="#" type="index" width="44" align="center" class-name="drag-handle" />
      <el-table-column
        :label="t('customFormatter.name')"
        prop="name"
        width="100"
        show-overflow-tooltip />
      <el-table-column :label="t('customFormatter.command')" prop="command" show-overflow-tooltip />
      <el-table-column width="100" align="center">
        <template #default="{ row, $index }">
          <div class="row-actions">
            <el-button link type="primary" icon="el-icon-edit" @click="openEdit(row, $index)" />
            <el-button link type="danger" icon="el-icon-delete" @click="removeAt($index)" />
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <el-dialog
    v-model="formVisible"
    :title="editIndex >= 0 ? t('customFormatter.edit') : t('customFormatter.add')"
    width="560px"
    append-to-body
    destroy-on-close
    draggable>
    <el-form label-position="top">
      <el-form-item :label="t('customFormatter.name')" required>
        <el-input v-model="form.name" :placeholder="t('customFormatter.namePlaceholder')" />
      </el-form-item>
      <el-form-item required class="custom-format-field">
        <template #label>
          <span class="field-label">
            {{ t('customFormatter.command') }}
            <me-icon
              icon="el-icon-question-filled"
              :info="t('customFormatter.commandHelp')"
              placement="top-start"
              raw-content
              :show-after="200" />
          </span>
        </template>
        <el-input v-model="form.command" :placeholder="t('customFormatter.commandPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('customFormatter.testDecodeSample')">
        <div class="test-row">
          <el-input
            v-model="testDecodeSample"
            :placeholder="t('customFormatter.testDecodeSamplePh')" />
          <el-button :loading="testingDecode" @click="runTest('decode')">{{
            t('customFormatter.testDecode')
          }}</el-button>
        </div>
      </el-form-item>
      <el-form-item :label="t('customFormatter.testEncodeSample')">
        <div class="test-row">
          <el-input
            v-model="testEncodeSample"
            :placeholder="t('customFormatter.testEncodeSamplePh')" />
          <el-button :loading="testingEncode" @click="runTest('encode')">{{
            t('customFormatter.testEncode')
          }}</el-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="formVisible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :disabled="!formValid" @click="saveForm">{{ t('ok') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
/* 命令标签与必填星号、? 保持同一行 */
.custom-format-field :deep(.el-form-item__label) {
  display: inline-flex;
  align-items: center;
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.test-row {
  display: flex;
  gap: 8px;
  width: 100%;

  :deep(.el-input) {
    flex: 1;
    min-width: 0;
  }
}

:deep(.drag-handle) {
  cursor: move;
}

:deep(.sortable-ghost) {
  background-color: var(--el-color-primary-light-8);
}
</style>
