<script setup>

import {useI18n} from 'vue-i18n'
import {cloneDeep} from 'lodash'
import {meInvoke, meOk, meTtlSeconds} from '@/utils/util.js'

const { t } = useI18n()
const emit = defineEmits(['success', 'closed'])
defineExpose({open})
function open(data) {
  visible.value = true
  Object.assign(form.value, cloneDeep(initForm))
  form.value.ttl = data.ttl
}

// 共享数据
const share = inject('share')

// 表单数据
const visible = ref(false)
const loading = ref(false)
const initForm = readonly({
  ttl: '',
  ttlUnit: 'second'
})
const form = ref(cloneDeep(initForm))
const rules = computed(() => ({
  ttl: [{required: true, message: t('ttlSet.ttlRequired')},
    {
      validator: (rule, value, callback) => {
        if (!(form.value.ttl === -1 || form.value.ttl > 0)) {
          callback(new Error(t('ttlSet.ttlValidator')))
        }
        callback()
      }
    }
  ],}))
const formRef = useTemplateRef('formRef')
function submit() {
  formRef.value.validate(async valid => {
    if (!valid) return

    loading.value = true
    try {
      const seconds = meTtlSeconds(form.value.ttl, form.value.ttlUnit)
      await meInvoke('ttl', {id: share.conn.id, ttl: seconds, key: share.redisKey})
      meOk(t('ttlSet.ttlOk'))
      emit('success', seconds)
      visible.value = false
    } finally {
      loading.value = false
    }
  })
}

// 快速设置
function quickSet(ttl, ttlUnit) {
  form.value.ttl = ttl
  form.value.ttlUnit = ttlUnit
}
</script>

<template>
  <el-dialog :title="t('ttlSet.title')" v-model="visible" :width="500" @closed="emit('closed')">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="t('ttlSet.key')">
        <!-- 此处保留可编辑，使用更加方便 -->
        <el-input type="text" v-model="share.redisKey.key" disabled/>
      </el-form-item>

      <el-form-item :label="t('ttlSet.ttl')" prop="ttl">
        <el-input v-model.number="form.ttl" style="flex: 1">
          <template #append>
            <el-select v-model="form.ttlUnit" :style="{width: t('timeUnit.width') + 'px'}">
              <el-option :label="t('timeUnit.second', form.ttl)" value="second"/>
              <el-option :label="t('timeUnit.minute', form.ttl)" value="minute"/>
              <el-option :label="t('timeUnit.hour', form.ttl)"   value="hour"/>
              <el-option :label="t('timeUnit.day', form.ttl)"    value="day"/>
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item :label="t('ttlSet.quickSet')">
        <div class="me-flex" style="width: 100%">
          <el-button round type="primary" plain @click="quickSet(-1, 'second')"> {{t('ttlSet.quick01')}}</el-button>
          <el-button round type="success" plain @click="quickSet(10, 'second')">{{t('ttlSet.quick02')}}</el-button>
          <el-button round type="success" plain @click="quickSet(1, 'minute')">{{t('ttlSet.quick03')}}</el-button>
          <el-button round type="success" plain @click="quickSet(1, 'hour')">{{t('ttlSet.quick04')}}</el-button>
          <el-button round type="success" plain @click="quickSet(1, 'day')">{{t('ttlSet.quick05')}}</el-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false" >{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit">{{ t('save') }}</el-button>
    </template>
  </el-dialog>
</template>