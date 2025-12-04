<script setup>
import {capitalize, cloneDeep} from 'lodash'
import {meInvoke, meOk} from '@/utils/util.js'
import {useI18n} from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['success', 'closed'])
defineExpose({open})
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
  mode: 'key',  // key-新增键, field-新增字段
  key: '',
  type: 'string',
  ttl: -1,
  value: '',

  listPushMethod: 'rpush',
  listPushOptions: [
    {label: t('fieldAdd.append'), value: 'rpush'},
    {label: t('fieldAdd.prepend'), value: 'lpush'}
  ],
  fieldValueList: [
    {
      fieldKey: '',
      fieldValue: '',
      fieldScore: 0,
    }
  ]
}))
const form = ref(cloneDeep(toRaw(initForm.value)))

const rules = computed(() => ({
  key: [{required: true, message: t('fieldAdd.keyRequired')}],
  type: [{required: true, message: t('fieldAdd.typeRequired')}],
  ttl: [{required: true, message: t('fieldAdd.ttlRequired')},
    {
      validator: (rule, value, callback) => {
        if (!(form.value.ttl == -1 || form.value.ttl > 0)) {
          callback(new Error(t('fieldAdd.ttlValidator')))
        }
        callback()
      }
    }
  ],
  value: [{required: true, message: t('fieldAdd.valueRequired')}],
  fieldValueList: [
    {
      validator: (rule, value, callback) => {
        if (form.value.type === 'hash') {
          const count = form.value.fieldValueList.filter(d => d.fieldKey === '' || d.fieldValue === '').length
          if (count > 0) {
            callback(new Error(t('fieldAdd.hashValidator')))
          }
        } else {
          const count = form.value.fieldValueList.filter(d => d.fieldValue === '').length
          if (count > 0) {
            callback(new Error(t('fieldAdd.valueRequired')))
          }
        }
        callback()
      }
    }]
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
const formRef = useTemplateRef('formRef')
function submit(){
  formRef.value.validate(async valid => {
    if (!valid) return

    isSaving.value = true
    try {
      await meInvoke('field_add',{id: share.conn.id, param: form.value})
      visible.value = false
      emit('success', {key: form.value.key, bytes: ''})
      meOk(t('addOk'))
    } finally {
      isSaving.value = false
    }
  })
}

const hint = computed(() => {
  if (form.value.type === 'hash') return t('fieldAdd.hashHint')
  if (form.value.type === 'zset') return t('fieldAdd.zsetHint')
  return ''
})
</script>

<template>
  <el-dialog :title="(form.mode === 'key' ? t('fieldAdd.newKey'): t('fieldAdd.newField'))"
             v-model="visible" :width="600" @closed="emit('closed')"
             destroy-on-close close-on-press-escape close-on-click-modal draggable>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="40" v-if="form.mode === 'key'">
        <el-col :span="12">
          <el-form-item :label="t('fieldAdd.type')" prop="type">
            <el-select v-model="form.type" style="width: 100%">
              <el-option label="String" value="string"/>
              <el-option label="Hash"   value="hash"/>
              <el-option label="List"   value="list"/>
              <el-option label="Set"    value="set"/>
              <el-option label="ZSet"   value="zset"/>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item :label="t('fieldAdd.ttl')" prop="ttl">
            <el-input v-model.number="form.ttl">
              <template #append>
                <el-tooltip :content="t('fieldAdd.negativeOneHint')" placement="top">
                  <div>{{form.ttl == -1 ? t('fieldAdd.permanent') : t('fieldAdd.second')}}</div>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="t('fieldAdd.key')" prop="key">
        <el-input type="text" v-model="form.key" :disabled="form.mode === 'field'">
          <template #prepend v-if="form.mode === 'field'">
            {{capitalize(form.type)}}
          </template>
        </el-input>
      </el-form-item>

      <el-form-item :label="t('fieldAdd.value')" prop="value" v-if="form.mode === 'key' && form.type === 'string'">
        <el-input type="textarea" :rows="6" v-model="form.value" clearable/>
      </el-form-item>

      <el-form-item :label="t('fieldAdd.type')" v-if="form.mode === 'field' && form.type === 'list'">
        <el-segmented v-model="form.listPushMethod" :options="form.listPushOptions"/>
      </el-form-item>

      <el-form-item :label="t('fieldAdd.element') + ' ' + hint" prop="fieldValueList" v-if="form.type !== 'string'">
        <div v-for="(item, index) in form.fieldValueList" class="me-flex" style="margin-bottom: 10px; width: 100%" key="id">
          <el-input type="text" v-model="item.fieldKey"   :placeholder="t('fieldAdd.hashKey')" style="margin-right: 10px" v-if="form.type === 'hash'" :validate-event="false"/>
          <el-input type="text" v-model="item.fieldValue" :placeholder="t('fieldAdd.value')"   style="margin-right: 10px" :validate-event="false"/>
          <el-input-number :controls="false" v-model="item.fieldScore"         style="margin-right: 10px" v-if="form.type === 'zset'" :validate-event="false"/>
          <el-button icon="el-icon-delete" circle @click="deleteElement(index)" v-if="form.fieldValueList.length > 1"/>
          <el-button icon="el-icon-plus"   circle @click="newElement(index)"/>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false" >{{t('cancel')}}</el-button>
      <el-button type="primary" :loading="isSaving" @click="submit()">{{t('save')}}</el-button>
    </template>
  </el-dialog>
</template>
