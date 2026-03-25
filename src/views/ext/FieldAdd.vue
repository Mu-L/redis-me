<script setup>
import { cloneDeep } from 'lodash'
import {KEY_TYPE_LIST, meInvoke, meOk, meJsonParse, meJsonNormal, meTtlSeconds, meType} from '@/utils/util.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['success', 'closed'])
defineExpose({ open })
function open(data) {
  visible.value = true
  Object.assign(form.value, cloneDeep(toRaw(initForm.value)))
  Object.assign(form.value, data)
}

// 共享数据
const share = inject('share')

// 表单数据
const visible = ref(false)
const isSaving = ref(false)
const initForm = computed(() => ({
  mode: 'key', // key-新增键, field-新增字段
  key: '',
  type: 'string',
  ttl: -1,
  value: '',

  streamId: '*', // stream格式的id, 默认为*，表示由redis生成

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
    },
  ],
}))
const form = ref(cloneDeep(toRaw(initForm.value)))
const stringOrJsonType = computed(() => form.value.type === 'string' || form.value.type === 'json')

const rules = computed(() => ({
  key: [{ required: true, message: t('fieldAdd.keyRequired') }],
  type: [{ required: true, message: t('fieldAdd.typeRequired') }],
  ttl: [
    { required: true, message: t('fieldAdd.ttlRequired') },
    {
      validator: (rule, value, callback) => {
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
      validator: (rule, value, callback) => {
        if (form.value.type === 'json') {
          try {
            meJsonParse(value) // json合法性校验
          } catch (e) {
            callback(new Error(t('fieldAdd.jsonValidator')))
          }
        }
        callback()
      },
    },
  ],
  fieldValueList: [
    {
      validator: (rule, value, callback) => {
        if (form.value.type === 'hash' || form.value.type === 'stream') {
          const count = form.value.fieldValueList.filter(
            (d) => d.fieldKey === '' || d.fieldValue === '',
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
          const count = form.value.fieldValueList.filter((d) => d.fieldValue === '').length
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
      validator: (rule, value, callback) => {
        if (form.value.type === 'stream') {
          if (value) return callback()
          callback(new Error(t('fieldAdd.streamIdRequired')))
        }
        callback()
      },
    },
  ],
}))

function deleteElement(index) {
  form.value.fieldValueList.splice(index, 1)
}

function newElement(index) {
  const newValue = {
    fieldKey: '',
    fieldValue: '',
    fieldScore: 0,
  }
  form.value.fieldValueList.splice(index + 1, 0, newValue)
}

// 提交数据
const ttlUnit = ref('second')
const formRef = useTemplateRef('formRef')
function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    isSaving.value = true
    try {
      // json输入支持json5格式, 此处转换为正常json字符串
      const value = form.value.type === 'json' ? meJsonNormal(form.value.value) : form.value.value
      const params = {
        id: share.conn.id,
        param: { ...form.value, value, ttl: meTtlSeconds(form.value.ttl, ttlUnit.value) },
      }
      await meInvoke('field_add', params)
      visible.value = false
      emit('success', { key: form.value.key, bytes: '' })
      meOk(t('addOk'))
    } finally {
      isSaving.value = false
    }
  })
}

const hint = computed(() => {
  if (form.value.type === 'hash') return t('fieldAdd.hashHint')
  if (form.value.type === 'zset') return t('fieldAdd.zsetHint')
  if (form.value.type === 'stream') return t('fieldAdd.streamHint')
  return ''
})

// me-code的值发生变化时进行自动验证
watch(
  () => form.value.value,
  () => {
    formRef?.value?.validate()
  },
)
</script>

<template>
  <el-dialog
    :title="form.mode === 'key' ? t('fieldAdd.newKey') : t('fieldAdd.newField')"
    v-model="visible"
    :width="600"
    @closed="emit('closed')"
    destroy-on-close
    close-on-press-escape
    close-on-click-modal
    draggable
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <!-- 键类型和TTL: 仅新建键时显示 -->
      <el-row :gutter="40" v-if="form.mode === 'key'">
        <el-col :span="12">
          <el-form-item :label="t('fieldAdd.type')" prop="type">
            <el-select v-model="form.type" style="width: 100%">
              <el-option
                v-for="item in KEY_TYPE_LIST"
                :label="item.value"
                :value="item.value.toLowerCase()"
              >
                <el-text :type="item.type">{{ item.value }}</el-text>
              </el-option>

              <template #label="{ label, value }">
                <el-text :type="meType(label)">{{ label }}</el-text>
              </template>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
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

      <!-- 键: 新建键可编辑, 新增字段时禁止编辑且前缀补充类型 -->
      <el-form-item :label="t('fieldAdd.key')" prop="key">
        <el-input type="text" v-model="form.key" :disabled="form.mode === 'field'">
          <template #prepend v-if="form.mode === 'field'">
            <el-text :type="meType(form.type)">{{ form.type.toUpperCase() }}</el-text>
          </template>
        </el-input>
      </el-form-item>

      <!-- 值: 新建键且类型为string或json时显示 -->
      <el-form-item
        :label="t('fieldAdd.value')"
        prop="value"
        v-if="form.mode === 'key' && stringOrJsonType"
      >
        <!-- <el-input type="textarea" :rows="6" v-model="form.value" clearable/>-->
        <me-code v-model="form.value" style="height: 150px; width: 100%" />
      </el-form-item>

      <!-- list类型的添加方式: rpush、lpush -->
      <el-form-item
        :label="t('fieldAdd.type')"
        v-if="form.mode === 'field' && form.type === 'list'"
      >
        <el-segmented v-model="form.listPushMethod" :options="form.listPushOptions" />
      </el-form-item>

      <!-- streamId: 仅stream类型显示 -->
      <el-form-item :label="t('fieldAdd.streamId')" prop="streamId" v-if="form.type === 'stream'">
        <el-input v-model="form.streamId" clearable />
      </el-form-item>

      <!-- key, value, score: 非string和json类型 -->
      <el-form-item
        :label="t('fieldAdd.element') + ' ' + hint"
        prop="fieldValueList"
        v-if="!stringOrJsonType"
      >
        <div
          v-for="(item, index) in form.fieldValueList"
          class="me-flex"
          style="margin-bottom: 10px; width: 100%"
          key="id"
        >
          <el-input
            type="text"
            v-model="item.fieldKey"
            :placeholder="form.type === 'hash' ? t('fieldAdd.hashKey') : t('fieldAdd.field')"
            style="margin-right: 10px"
            v-if="form.type === 'hash' || form.type === 'stream'"
            :validate-event="false"
          />
          <el-input
            type="text"
            v-model="item.fieldValue"
            :placeholder="t('fieldAdd.value')"
            style="margin-right: 10px"
            :validate-event="false"
          />
          <el-input-number
            :controls="false"
            v-model="item.fieldScore"
            style="margin-right: 10px"
            v-if="form.type === 'zset'"
            :validate-event="false"
          />
          <el-button
            icon="el-icon-delete"
            circle
            @click="deleteElement(index)"
            v-if="form.fieldValueList.length > 1"
          />
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
