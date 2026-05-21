<script setup lang="ts">
import { cloneDeep } from 'lodash'
import { computed, inject, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type { RedisFieldSet_Deserialize } from '@/types/tauri-specta'
import { meCommands, meFormatDisplayValue, meOk } from '@/utils/util'

/** 含 UI 用 type，提交时剔除 */
type FieldSetForm = RedisFieldSet_Deserialize & { type: string }

const props = withDefaults(
  defineProps<{
    /** 与 RedisValue 值区美化开关一致，仅 open 时格式化展示 */
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
  srcFieldValue: '', // set/zset 需要先删除原始值再新增新的值
  fieldIndex: 0,
  fieldKey: '',
  fieldValue: '',
  fieldScore: 0,
  fieldTtl: -1,
  valFmt: 'utf8',
}
const form = ref<FieldSetForm>(cloneDeep(initForm))

function open(data: Partial<FieldSetForm>) {
  visible.value = true
  Object.assign(form.value, cloneDeep(initForm))
  Object.assign(form.value, data)
  // srcFieldValue 保持原始值；fieldValue 按值区 isPretty 格式化后再编辑
  if (data.fieldValue !== undefined) {
    form.value.fieldValue = meFormatDisplayValue(String(data.fieldValue), props.pretty)
  }
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
      const { type: _type, ...param } = form.value
      await meCommands.fieldSet(share.conn!.id, param)
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
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      style="display: flex; flex-direction: column; height: 100%">
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
      <el-form-item
        :label="t('fieldSet.value')"
        prop="fieldValue"
        style="display: flex; flex-direction: column; flex: 1">
        <me-code v-model="form.fieldValue" style="flex: 1" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="cancel">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="isSaving" @click="submit">{{ t('save') }}</el-button>
    </template>
  </el-card>
</template>

<style scoped lang="scss">
.field-set {
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    padding: 20px 20px 0 20px; // 覆盖掉最外部的自定义样式
    flex-grow: 1; // 自动延伸
  }

  :deep(.el-card__footer) {
    border-top: none; // 去掉默认的顶部线条
    text-align: right; // 按钮右对齐
  }
}
</style>
