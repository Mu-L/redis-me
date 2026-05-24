<script setup lang="ts">
/** 自定义编解码 CRUD：由 RedisValue 数据编码下拉头部编辑入口打开 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  buildFormatterCommand,
  testFormatter,
  type CustomFormatter,
} from '@/utils/custom-formatter'
import { meErr, meOk } from '@/utils/util'

const visible = defineModel<boolean>({ default: false })

const { t } = useI18n()

const list = computed(() => window.meTauri.settings.customFormatters ?? [])

const formVisible = ref(false)
const editIndex = ref(-1)
const testing = ref(false)
const form = reactive<CustomFormatter>({ name: '', command: '' })
const testSample = ref('aGVsbG8=') // "hello"

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
  const sample = testSample.value.trim()
  testing.value = true
  try {
    const out = await testFormatter(formatter, mode, sample)
    const preview = buildFormatterCommand(formatter, mode, sample)
    meOk(`${t('customFormatter.testOk')}\n\n${preview}\n\n---\n${out}`, true)
  } catch (e) {
    meErr(e instanceof Error ? e.message : String(e))
  } finally {
    testing.value = false
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

    <el-table :data="list" empty-text="—" size="small">
      <el-table-column :label="t('customFormatter.name')" prop="name" width="140" />
      <el-table-column :label="t('customFormatter.command')" prop="command" show-overflow-tooltip />
      <el-table-column width="100" align="center">
        <template #default="{ row, $index }">
          <el-button link type="primary" icon="el-icon-edit" @click="openEdit(row, $index)" />
          <el-button link type="danger" icon="el-icon-delete" @click="removeAt($index)" />
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
      <el-form-item :label="t('customFormatter.testSample')">
        <el-input v-model="testSample" />
      </el-form-item>
      <el-form-item>
        <el-button :loading="testing" @click="runTest('decode')">{{
          t('customFormatter.testDecode')
        }}</el-button>
        <el-button :loading="testing" @click="runTest('encode')">{{
          t('customFormatter.testEncode')
        }}</el-button>
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
</style>
