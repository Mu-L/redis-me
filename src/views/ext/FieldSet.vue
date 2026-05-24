<script setup lang="ts">
import { cloneDeep } from 'lodash'
import { computed, inject, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type { RedisFieldSet_Deserialize } from '@/types/tauri-specta'
import { meViewToWire, type ViewBytesFormat } from '@/utils/bytes-format'
import { meCommands, meCopy, meFormatDisplayValue, meOk } from '@/utils/util'

/** 含 UI 用 type / viewValFmt / wireFieldKey，提交时剔除 */
type FieldSetForm = RedisFieldSet_Deserialize & {
  type: string
  viewValFmt?: ViewBytesFormat
  wireFieldKey?: string
}

const props = withDefaults(
  defineProps<{
    /** 与 RedisValue 值区美化开关一致，open 时同步为初始状态 */
    pretty?: boolean
  }>(),
  { pretty: true },
)

const { t } = useI18n()
const emit = defineEmits(['success', 'closed'])
defineExpose({ open, close })

// 共享数据（本组件仅在已选连接后的键区使用，conn 视为必有）
const share = inject(shareProvideKey)!

// 表单数据
const visible = ref(false)
const isSaving = ref(false)
const initForm: FieldSetForm = {
  key: {
    key: '',
    bytes: '',
  },
  type: 'string',
  srcFieldValue: '', // set/zset 删除原成员用的 wire 值
  fieldIndex: 0,
  fieldKey: '',
  fieldValue: '',
  fieldScore: 0,
  fieldTtl: -1,
  valFmt: 'utf8',
}
const form = ref<FieldSetForm>(cloneDeep(initForm))
const viewValFmt = ref<ViewBytesFormat>('utf8')
/** 打开时的展示用字段值，关闭美化时用于查看原始 wire 文本 */
const rawFieldValue = ref('')
/** 面板内美化开关，open 时与外部 isPretty 同步，可临时切换 */
const fieldPretty = ref(true)
const codeRemountKey = ref(0)

function open(data: Partial<FieldSetForm>) {
  visible.value = true
  Object.assign(form.value, cloneDeep(initForm))
  Object.assign(form.value, data)
  viewValFmt.value = data.viewValFmt ?? 'utf8'
  rawFieldValue.value = String(data.fieldValue ?? '')
  fieldPretty.value = props.pretty
  form.value.fieldValue = meFormatDisplayValue(rawFieldValue.value, fieldPretty.value)
}

function togglePretty() {
  fieldPretty.value = !fieldPretty.value
  if (fieldPretty.value) {
    const source =
      form.value.fieldValue === rawFieldValue.value ? rawFieldValue.value : form.value.fieldValue
    form.value.fieldValue = meFormatDisplayValue(source, true)
  } else {
    form.value.fieldValue = rawFieldValue.value
  }
  codeRemountKey.value++
}

function close() {
  visible.value = false
}

const rules = computed(() => ({
  fieldValue: [{ required: true, message: t('fieldSet.fieldValueRequired') }],
  fieldScore: [{ required: true, message: t('fieldSet.fieldScoreRequired') }],
}))

// 取消
function cancel() {
  visible.value = false
  emit('closed')
}

// 提交
const formRef = useTemplateRef('formRef')
function submit() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    isSaving.value = true
    try {
      const { type: _type, viewValFmt: _viewValFmt, wireFieldKey, ...rest } = form.value
      const fmt = viewValFmt.value
      await meCommands.fieldSet(share.conn!.id, {
        ...rest,
        fieldKey:
          form.value.type === 'hash' && wireFieldKey
            ? wireFieldKey
            : meViewToWire(form.value.fieldKey, fmt),
        fieldValue: meViewToWire(form.value.fieldValue, fmt),
      })
      visible.value = false
      emit('success')
      meOk(t('editOk'))
    } finally {
      isSaving.value = false
    }
  })
}
</script>

<template>
  <el-card :header="t('fieldSet.editField')" v-show="visible" class="field-set">
    <el-form ref="formRef" class="field-set-form" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="t('fieldSet.hashKey')" v-if="form.type === 'hash'">
        <el-input v-model="form.fieldKey" disabled />
      </el-form-item>
      <el-form-item
        :label="t('fieldSet.fieldTtl')"
        v-if="form.type === 'hash' && share.capabilities?.hashFieldTtl">
        <el-input-number
          v-model="form.fieldTtl"
          :min="-1"
          :controls="false"
          style="width: 100%"
          align="left" />
      </el-form-item>
      <el-form-item :label="t('fieldSet.index')" v-if="form.type === 'list'">
        <el-input v-model="form.fieldIndex" disabled />
      </el-form-item>
      <el-form-item :label="t('fieldSet.score')" prop="fieldScore" v-if="form.type === 'zset'">
        <el-input-number
          :controls="false"
          v-model="form.fieldScore"
          align="left"
          style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('fieldSet.value')" prop="fieldValue" class="field-value-item">
        <me-code :key="codeRemountKey" v-model="form.fieldValue" class="field-code-editor" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="field-set-footer me-flex">
        <div class="field-set-footer-left">
          <me-icon
            placement="top-start"
            :info="t('fieldSet.prettyHint')"
            class="icon-btn"
            :style="{ opacity: fieldPretty ? 1 : 0.2 }"
            icon="el-icon-magic-stick"
            @click="togglePretty" />
          <me-icon
            placement="top-start"
            :info="t('copy')"
            class="icon-btn"
            style="font-size: 18px; margin-left: 5px"
            icon="el-icon-document-copy"
            @click="meCopy(form.fieldValue)" />
        </div>
        <div>
          <el-button @click="cancel">{{ t('cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submit">{{ t('save') }}</el-button>
        </div>
      </div>
    </template>
  </el-card>
</template>

<style scoped lang="scss">
.field-set {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 20px 20px 0 20px; // 覆盖掉最外部的自定义样式
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.el-card__footer) {
    border-top: none; // 去掉默认的顶部线条
    flex-shrink: 0;
  }

  .field-set-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
  }

  .field-set-footer {
    align-items: center;
  }

  .field-set-footer-left {
    display: flex;
    align-items: center;
    font-size: 20px; // 与值区 value-footer 图标大小一致
  }

  .field-value-item {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-bottom: 0;
    min-width: 0;
    min-height: 0;
    width: 100%;

    :deep(.el-form-item__content) {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      min-width: 0;
      width: 100%;
      overflow: hidden;
    }
  }

  .field-code-editor {
    flex: 1;
    width: 100%;
    max-width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;

    :deep(.cm-editor) {
      width: 100%;
      max-width: 100%;
      height: 100%;
    }

    :deep(.cm-scroller) {
      overflow: auto;
    }
  }
}
</style>
