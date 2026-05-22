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
  srcFieldValue: '', // set/zset 需要先删除原始值再新增新的值
  fieldIndex: 0,
  fieldKey: '',
  fieldValue: '',
  fieldScore: 0,
  fieldTtl: -1,
  valFmt: 'utf8',
}
const form = ref<FieldSetForm>(cloneDeep(initForm))
/** 打开时的原始字段值，关闭美化时用于查看 Redis 原始内容 */
const rawFieldValue = ref('')
/** 面板内美化开关，open 时与外部 isPretty 同步，可临时切换 */
const fieldPretty = ref(true)
const codeRemountKey = ref(0)

function open(data: Partial<FieldSetForm>) {
  visible.value = true
  Object.assign(form.value, cloneDeep(initForm))
  Object.assign(form.value, data)
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
        class="field-value-item"
        style="display: flex; flex-direction: column; flex: 1">
        <div class="field-code-wrap">
          <me-code :key="codeRemountKey" v-model="form.fieldValue" style="flex: 1" />
          <me-icon
            placement="top-start"
            :info="t('fieldSet.prettyHint')"
            class="icon-btn field-pretty-btn"
            :style="{ color: fieldPretty ? share.color : '' }"
            icon="el-icon-magic-stick"
            @click="togglePretty" />
        </div>
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

  .field-value-item {
    margin-bottom: 0;

    :deep(.el-form-item__content) {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
  }

  .field-code-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  .field-pretty-btn {
    position: absolute;
    right: 8px;
    bottom: 8px;
    z-index: 2;
    font-size: 18px;
    padding: 4px;
  }
}
</style>
