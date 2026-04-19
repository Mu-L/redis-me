<script setup>
import { cloneDeep } from 'lodash'
import { useI18n } from 'vue-i18n'

import { meInvoke, meOk } from '@/utils/util.js'

const { t } = useI18n()
const emit = defineEmits(['success', 'closed'])
defineExpose({ open, close })

// 共享数据
const share = inject('share')

// 表单数据
const visible = ref(false)
const isSaving = ref(false)
const initForm = readonly({
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
  inputFormat: 'utf8'
})
const form = ref(cloneDeep(initForm))

function open(data) {
  visible.value = true
  Object.assign(form.value, cloneDeep(initForm))
  Object.assign(form.value, data)
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
  formRef.value.validate(async valid => {
    if (!valid) return

    isSaving.value = true
    try {
      await meInvoke('field_set', { id: share.conn.id, param: form.value })
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
