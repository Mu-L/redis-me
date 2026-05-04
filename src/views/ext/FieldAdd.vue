<script setup lang="ts">
import type { FormItemRule } from 'element-plus'
import { cloneDeep } from 'lodash'
import { computed, inject, ref, toRaw, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type { DisplayFormat, RedisFieldAdd, RedisKey_Deserialize } from '@/types/tauri-specta'
import {
  KEY_TYPE_LIST,
  DISPLAY_FORMAT,
  meCommands,
  meOk,
  meJsonParse,
  meJsonNormal,
  meTtlSeconds,
  meType,
} from '@/utils/util'

const { t } = useI18n()
const emit = defineEmits(['success', 'closed'])
defineExpose({ open })
function open(data: Partial<RedisFieldAdd & RedisKey_Deserialize>) {
  visible.value = true
  Object.assign(form.value, cloneDeep(toRaw(initForm.value)))
  Object.assign(form.value, data)
}

// 共享数据
const share = inject(shareProvideKey)!

// 表单数据
const visible = ref(false)
const isSaving = ref(false)
const initForm = computed(() => ({
  mode: 'key', // key-新增键，field-新增字段
  key: '',
  type: 'string',
  ttl: -1,
  value: '',

  streamId: '*', // stream 格式的 id, 默认为*，表示由 redis 生成

  listPushMethod: 'rpush',
  listPushOptions: [
    { label: t('fieldAdd.append'), value: 'rpush' },
    { label: t('fieldAdd.prepend'), value: 'lpush' },
  ],
  fieldValueList: [
    {
      fieldKey: '',
      fieldValue: '',
      fieldScore: 0,
      fieldTtl: -1,
    },
  ],
  inputFormat: 'utf8' as const,
}))
const form = ref(cloneDeep(toRaw(initForm.value)))

const stringOrJsonType = computed(() => form.value.type === 'string' || form.value.type === 'json')
const streamOrJsonType = computed(() => form.value.type === 'stream' || form.value.type === 'json')

const rules = computed(() => ({
  key: [{ required: true, message: t('fieldAdd.keyRequired') }],
  type: [{ required: true, message: t('fieldAdd.typeRequired') }],
  ttl: [
    { required: true, message: t('fieldAdd.ttlRequired') },
    {
      validator: (
        _rule: FormItemRule,
        value: unknown,
        callback: (error?: string | Error) => void,
      ) => {
        if (!(form.value.ttl === -1 || form.value.ttl > 0)) {
          callback(new Error(t('fieldAdd.ttlValidator')))
        }
        callback()
      },
    },
  ],
  value: [
    { required: true, message: t('fieldAdd.valueRequired') },
    {
      validator: (
        _rule: FormItemRule,
        value: unknown,
        callback: (error?: string | Error) => void,
      ) => {
        if (form.value.type === 'json') {
          try {
            meJsonParse(String(value)) // json 输入支持 json5 格式，此处转换为正常 json 字符串
          } catch {
            callback(new Error(t('fieldAdd.jsonValidator')))
          }
        }
        callback()
      },
    },
  ],
  fieldValueList: [
    {
      validator: (
        _rule: FormItemRule,
        _value: unknown,
        callback: (error?: string | Error) => void,
      ) => {
        if (form.value.type === 'hash' || form.value.type === 'stream') {
          const count = form.value.fieldValueList.filter(
            d => d.fieldKey === '' || d.fieldValue === '',
          ).length
          if (count > 0) {
            callback(
              new Error(
                form.value.type === 'hash'
                  ? t('fieldAdd.hashValidator')
                  : t('fieldAdd.streamValidator'),
              ),
            )
          }
        } else {
          const count = form.value.fieldValueList.filter(d => d.fieldValue === '').length
          if (count > 0) {
            callback(new Error(t('fieldAdd.valueRequired')))
          }
        }
        callback()
      },
    },
  ],
  streamId: [
    {
      validator: (
        _rule: FormItemRule,
        value: unknown,
        callback: (error?: string | Error) => void,
      ) => {
        if (form.value.type === 'stream') {
          if (value) return callback()
          callback(new Error(t('fieldAdd.streamIdRequired')))
        }
        callback()
      },
    },
  ],
}))

function deleteElement(index: number) {
  form.value.fieldValueList.splice(index, 1)
}

function newElement(index: number) {
  const newValue = {
    fieldKey: '',
    fieldValue: '',
    fieldScore: 0,
    fieldTtl: -1,
  }
  form.value.fieldValueList.splice(index + 1, 0, newValue)
}

// 提交数据
const ttlUnit = ref('second')
const formRef = useTemplateRef('formRef')
function submit() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    isSaving.value = true
    try {
      // json 输入支持 json5 格式，此处转换为正常 json 字符串
      const value = form.value.type === 'json' ? meJsonNormal(form.value.value) : form.value.value
      form.value.fieldValueList.forEach(item => {
        if (item.fieldTtl === null) item.fieldTtl = -1
      })

      const redisKey = await meCommands.fieldAdd(share.conn!.id, {
        ...form.value,
        value,
        ttl: meTtlSeconds(form.value.ttl, ttlUnit.value),
        fieldValueList: form.value.fieldValueList,
        inputFormat: form.value.inputFormat as DisplayFormat,
      })
      visible.value = false
      emit('success', redisKey)
      meOk(t('addOk'))
    } finally {
      isSaving.value = false
    }
  })
}

const hint = computed(() => {
  if (form.value.type === 'hash')
    return share.capabilities?.hashFieldTtl ? t('fieldAdd.hashHintTtl') : t('fieldAdd.hashHint')
  if (form.value.type === 'zset') return t('fieldAdd.zsetHint')
  if (form.value.type === 'stream') return t('fieldAdd.streamHint')
  return ''
})

// me-code 的值发生变化时进行自动验证
watch(
  () => form.value.value,
  () => {
    formRef?.value?.validate()
  },
)

// json和stream类型不支持编码
function handleKeyTypeChange() {
  if (streamOrJsonType.value) {
    form.value.inputFormat = 'utf8'
  }
}
</script>

<template>
  <el-dialog
    :title="form.mode === 'key' ? t('fieldAdd.newKey') : t('fieldAdd.newField')"
    v-model="visible"
    :width="666"
    @closed="emit('closed')"
    destroy-on-close
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    draggable>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <!-- 键类型、输入格式和 TTL: 仅新建键时显示 -->
      <el-row :gutter="20" v-if="form.mode === 'key'">
        <el-col :span="8">
          <el-form-item :label="t('fieldAdd.type')" prop="type">
            <el-select v-model="form.type" style="width: 100%" @change="handleKeyTypeChange">
              <el-option
                v-for="item in KEY_TYPE_LIST"
                :label="item.value"
                :value="item.value.toLowerCase()">
                <el-text :type="item.type">{{ item.value }}</el-text>
              </el-option>

              <template #label="{ label, value }">
                <el-text :type="meType(label)">{{ label }}</el-text>
              </template>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item :label="t('fieldAdd.inputFormat')" prop="inputFormat">
            <el-select v-model="form.inputFormat" style="width: 100%" :disabled="streamOrJsonType">
              <el-option v-for="item in DISPLAY_FORMAT" :label="item" :value="item.toLowerCase()" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item :label="t('fieldAdd.ttl')" prop="ttl">
            <el-input v-model.number="form.ttl" style="flex: 1">
              <template #append>
                <el-select v-model="ttlUnit" :style="{ width: t('timeUnit.width') + 'px' }">
                  <el-option :label="t('timeUnit.second', form.ttl)" value="second" />
                  <el-option :label="t('timeUnit.minute', form.ttl)" value="minute" />
                  <el-option :label="t('timeUnit.hour', form.ttl)" value="hour" />
                  <el-option :label="t('timeUnit.day', form.ttl)" value="day" />
                </el-select>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 键：新建键可编辑，新增字段时禁止编辑且前缀补充类型 -->
      <el-row :gutter="20">
        <el-col :span="form.mode === 'key' ? 24 : 16">
          <el-form-item :label="t('fieldAdd.key')" prop="key">
            <el-input type="text" v-model="form.key" :disabled="form.mode === 'field'">
              <template #prepend v-if="form.mode === 'field'">
                <el-text :type="meType(form.type)">{{ form.type.toUpperCase() }}</el-text>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="form.mode !== 'key'">
          <el-form-item :label="t('fieldAdd.inputFormat')" prop="inputFormat">
            <el-select v-model="form.inputFormat" style="width: 100%" disabled>
              <el-option v-for="item in DISPLAY_FORMAT" :label="item" :value="item.toLowerCase()" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 值：新建键且类型为 string 或 json 时显示 -->
      <el-form-item
        :label="t('fieldAdd.value')"
        prop="value"
        v-if="form.mode === 'key' && stringOrJsonType">
        <me-code v-model="form.value" style="height: 150px; width: 100%" />
      </el-form-item>

      <!-- list 类型的添加方式：rpush、lpush -->
      <el-form-item
        :label="t('fieldAdd.type')"
        v-if="form.mode === 'field' && form.type === 'list'">
        <el-segmented v-model="form.listPushMethod" :options="form.listPushOptions" />
      </el-form-item>

      <!-- streamId: 仅 stream 类型显示 -->
      <el-form-item :label="t('fieldAdd.streamId')" prop="streamId" v-if="form.type === 'stream'">
        <el-input v-model="form.streamId" clearable />
      </el-form-item>

      <!-- key, value, score: 非 string 和 json 类型 -->
      <el-form-item
        :label="t('fieldAdd.element') + ' ' + hint"
        prop="fieldValueList"
        v-if="!stringOrJsonType">
        <div
          v-for="(item, index) in form.fieldValueList"
          class="me-flex"
          style="margin-bottom: 10px; width: 100%"
          key="id">
          <el-input
            type="text"
            v-model="item.fieldKey"
            :placeholder="form.type === 'hash' ? t('fieldAdd.hashKey') : t('fieldAdd.field')"
            style="margin-right: 10px"
            v-if="form.type === 'hash' || form.type === 'stream'"
            :validate-event="false" />
          <el-input
            type="text"
            v-model="item.fieldValue"
            :placeholder="t('fieldAdd.value')"
            style="margin-right: 10px"
            :validate-event="false" />
          <el-input-number
            :controls="false"
            v-model="item.fieldScore"
            style="margin-right: 10px"
            v-if="form.type === 'zset'"
            :validate-event="false" />
          <el-input-number
            v-if="form.type === 'hash' && share.capabilities?.hashFieldTtl"
            v-model="item.fieldTtl"
            :min="-1"
            :controls="false"
            :placeholder="t('fieldAdd.fieldTtl')"
            style="margin-right: 10px; width: 250px"
            :validate-event="false" />
          <el-button
            icon="el-icon-delete"
            circle
            @click="deleteElement(index)"
            v-if="form.fieldValueList.length > 1" />
          <el-button icon="el-icon-plus" circle @click="newElement(index)" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="isSaving" @click="submit()">{{ t('save') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.el-input-group__prepend) {
  padding: 0 16px;
}
</style>
