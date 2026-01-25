<script setup>
import {cloneDeep} from 'lodash'
import {nanoid} from 'nanoid'
import {ref, useTemplateRef} from 'vue'
import {meInvoke, PREDEFINE_COLORS, meRandomString, meOk} from '@/utils/util.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const emit = defineEmits(['success', 'closed'])

// 表单和校验规则
const form = reactive({
  id: '',
  name: '',

  host: '127.0.0.1',
  port: 6379,
  username: '',
  password: '',
  db: 0,

  readonly: false,
  cluster: false,
  ssl: false,
  sslOption: {
    key: '',
    cert: '',
    ca: ''
  },

  color: '#409eff',

  // 哨兵模式补充
  sentinel: false,
  masterName: '',
  masterUsername: '',
  masterPassword: '',
})

const rules = {
  host: [{required: true, message: t('conn.nameRequired')}],
  port: [{required: true, message: t('conn.portRequired')}]
}

// 外部打开对话框
defineExpose({open})
const visible = ref(false)
const mode = ref('add')
function open(modeValue, data) {
  visible.value = true
  mode.value = modeValue
  if (data) {
    const newData = cloneDeep(data)
    // 新增时给了数据，则是复制连接。id和name需要重置
    if (modeValue === 'add') {
      newData.id = nanoid()
      newData.name = data.name + '-' + t('copy')
    }
    Object.assign(form, newData)
  }
}

// 提交表单
const share = inject('share')
const formRef = useTemplateRef('formRef')
function submit() {
  formRef.value.validate(valid => {
    if (!valid) return
    //emit('success', form.value, mode.value)
    if (mode.value === 'add') {
      form.id = nanoid()
      autoGenName()
      share.connList.push(form)
      meOk(t('addOk'))
      emit('success', form, mode.value)
    } else if (mode.value === 'edit') {
      autoGenName()
      const conn = share.connList.filter(c => c.id === form.id)[0]
      Object.assign(conn, cloneDeep(form))
      meOk(t('editOk'))
      emit('success', form, mode.value)
    }
    visible.value = false
  })
}

// 自动生成名称
function autoGenName() {
  if (!form.name) {
    form.name = form.host + ':' + form.port
  }

  if (share.connList.find(c => c.name === form.name && c.id !== form.id)) {
    form.name += ' (' + meRandomString(3) + ')'
  }
}

// 测试连接
const loading = ref(false)
function testConn() {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      await meInvoke('test_conn', {redisConn: form})
      meOk(t('conn.testOk'))
    } finally {
      loading.value = false
    }
  });
}
</script>

<template>
  <el-dialog :title="mode === 'add' ? t('conn.addConn') : t('conn.editConn')" @closed="emit('closed')"
             v-model="visible" width="600" append-to-body destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="right" label-width="60">
      <el-form-item :label="t('conn.name')" prop="name">
        <el-input v-model.trim="form.name" :placeholder="t('conn.nameHint')"/>
      </el-form-item>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item :label="t('conn.host')" prop="host">
            <el-input v-model.trim="form.host" placeholder="127.0.0.1"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('conn.port')" prop="port">
            <el-input-number :min="1" :max="65535" v-model="form.port"
                             :controls='false' align="left" style="width: 100%"
                             placeholder="6379"/>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item :label="t('conn.username')">
            <el-input v-model.trim="form.username" placeholder="ACL in Redis >= 6.0"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('conn.password')">
            <el-input type="password" v-model.trim="form.password" placeholder="password"/>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="5">
          <el-form-item :label="t('conn.color')">
            <el-color-picker v-model="form.color" :predefine="PREDEFINE_COLORS"/>
          </el-form-item>
        </el-col>
        <el-col :span="19">
          <el-checkbox v-model="form.readonly">{{t('conn.readonly')}}</el-checkbox>
          <el-checkbox v-model="form.cluster">{{t('conn.cluster')}}</el-checkbox>
          <el-checkbox v-model="form.sentinel">哨兵</el-checkbox>
          <el-checkbox v-model="form.ssl">SSL</el-checkbox>
        </el-col>
      </el-row>

      <div v-show="form.sentinel">
        <el-divider content-position="left">哨兵设置</el-divider>
        <el-form-item label="配置">
          <el-row>
            <el-col :span="7">
              <el-input v-model="form.masterName" placeholder="masterName"/>
            </el-col>
            <el-col :span="1"/>
            <el-col :span="7">
              <el-input v-model="form.masterUsername" placeholder="masterUsername"/>
            </el-col>
            <el-col :span="1"/>
            <el-col :span="7">
              <el-input v-model="form.masterPassword" placeholder="masterPassword"/>
            </el-col>
          </el-row>
        </el-form-item>
      </div>

      <div v-show="form.ssl">
        <el-divider content-position="left">{{t('conn.ssl')}}</el-divider>
        <el-form-item :label="t('conn.cert')">
          <me-file-input v-model="form.sslOption.cert" :placeholder="t('conn.certHint')"/>
        </el-form-item>
        <el-form-item :label="t('conn.key')">
          <me-file-input v-model="form.sslOption.key" :placeholder="t('conn.keyHint')"/>
        </el-form-item>
        <el-form-item :label="t('conn.ca')">
          <me-file-input v-model="form.sslOption.ca" :placeholder="t('conn.caHint')"/>
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="me-flex">
        <el-button type="primary" style="margin-left: 20px"
                   :loading="loading" :disabled="!(form.host && form.port)"
                   @click="testConn">{{t('conn.testConn')}}</el-button>
        <div>
          <el-button @click="visible = false">{{t('cancel')}}</el-button>
          <el-button type="primary" @click="submit">{{t('ok')}}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>