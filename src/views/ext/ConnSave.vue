<script setup>
import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { meInvoke, PREDEFINE_COLORS, meRandomString, meOk, meErr } from '@/utils/util.js'
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
  color: '#409eff',

  // 集群模式
  cluster: false,

  // SSL连接
  ssl: false,
  sslOption: {
    key: '',
    cert: '',
    ca: '',
  },

  // 哨兵模式
  sentinel: false,
  sentinelOption: {
    masterName: '',
    masterUsername: '',
    masterPassword: '',
  },

  // SSH隧道
  ssh: false,
  sshOption: {
    host: '',
    port: 22,
    loginType: 'pwd', // pwd 用户名/密码, pkfile 私钥文件
    username: '',
    password: '',
    pkfile: '', // 私钥文件
    passphrase: '', // 私钥密码
  },

  // 其他元信息补充: 复制连接时不保留
  meta: {
    // 数据库别名
    // db0: '会话登录'
    // 未来的其他扩展
  },
})

const rules = {
  host: [{ required: true, message: t('conn.nameRequired') }],
  port: [{ required: true, message: t('conn.portRequired') }],
  'sshOption.host': [
    {
      required: true,
      message: t('conn.sshOption.hostRequired'),
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (form.ssh && !value) {
          callback(new Error(t('conn.sshOption.hostRequired')))
        } else {
          callback()
        }
      },
    },
  ],
  'sshOption.port': [
    {
      required: true,
      message: t('conn.sshOption.portRequired'),
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (form.ssh && !value) {
          callback(new Error(t('conn.sshOption.portRequired')))
        } else {
          callback()
        }
      },
    },
  ],
  'sshOption.username': [
    {
      required: true,
      message: t('conn.sshOption.usernameRequired'),
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (form.ssh && !value) {
          callback(new Error(t('conn.sshOption.usernameRequired')))
        } else {
          callback()
        }
      },
    },
  ],
  'sshOption.password': [
    {
      required: true,
      message: t('conn.sshOption.passwordRequired'),
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (form.ssh && form.sshOption.loginType === 'pwd' && !value) {
          callback(new Error(t('conn.sshOption.passwordRequired')))
        } else {
          callback()
        }
      },
    },
  ],
  'sshOption.pkfile': [
    {
      required: true,
      message: t('conn.sshOption.pkfileRequired'),
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (form.ssh && form.sshOption.loginType === 'pkfile' && !value) {
          callback(new Error(t('conn.sshOption.pkfileRequired')))
        } else {
          callback()
        }
      },
    },
  ],
}

// 外部打开对话框
defineExpose({ open })
const visible = ref(false)
const mode = ref('add')
function open(modeValue, data) {
  visible.value = true
  mode.value = modeValue
  if (data) {
    const newData = cloneDeep(data)
    // 新增时给了数据，则是复制连接。id和name需要重置, meta信息不复制
    if (modeValue === 'add') {
      newData.id = nanoid()
      newData.name = data.name + '-' + t('copy')
      newData.meta = {}
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
      await meInvoke('test_conn', { conf: form })
      meOk(t('conn.testOk'))
    } finally {
      loading.value = false
    }
  })
}

// 哨兵模式获取master名称
const masters = ref([])
async function autoDiscover(alert = false) {
  try {
    masters.value = await meInvoke('masters', { conf: form }, false)
    if (!form.sentinelOption.masterName && masters.value.length > 0) {
      form.sentinelOption.masterName = masters.value[0].name
    }

    if (alert) {
      meOk(t('conn.autoDiscoverOk', { count: masters.value.length }))
    }
  } catch (e) {
    masters.value = []
    if (alert) {
      meErr(e, t('error'))
    }
  }
}

watch(
  () => form.sentinel,
  (newValue, _oldValue) => {
    if (newValue) {
      autoDiscover()
    }
  },
)

watch(
  () => form.sentinelOption.masterName,
  (newValue, _oldValue) => {
    if (newValue === undefined) {
      form.sentinelOption.masterName = ''
    }
  },
)
</script>

<template>
  <el-dialog
    :title="mode === 'add' ? t('conn.addConn') : t('conn.editConn')"
    @closed="emit('closed')"
    draggable
    v-model="visible"
    width="600"
    append-to-body
    destroy-on-close
    align-center>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="right" :label-width="t('conn.labelWidth')">
      <!-- 连接名称 -->
      <el-form-item :label="t('conn.name')" prop="name">
        <el-input v-model.trim="form.name" :placeholder="t('conn.nameHint')" clearable />
      </el-form-item>

      <!-- 主机、端口 -->
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item :label="t('conn.host')" prop="host">
            <el-input v-model.trim="form.host" placeholder="127.0.0.1" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('conn.port')" prop="port">
            <el-input-number
              :min="1"
              :max="65535"
              v-model="form.port"
              :controls="false"
              align="left"
              style="width: 100%"
              placeholder="6379" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 用户名、密码 -->
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item :label="t('conn.username')">
            <el-input v-model.trim="form.username" placeholder="ACL in Redis >= 6.0" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('conn.password')">
            <el-input
              type="password"
              v-model.trim="form.password"
              placeholder="password"
              clearable
              show-password />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 颜色、复选框 -->
      <el-row :gutter="24" justify="space-between">
        <el-col :span="5">
          <el-form-item :label="t('conn.color')">
            <el-color-picker v-model="form.color" :predefine="PREDEFINE_COLORS" />
          </el-form-item>
        </el-col>
        <el-col :span="19" style="padding-left: 0;">
          <el-checkbox v-model="form.ssh">SSH</el-checkbox>
          <el-checkbox v-model="form.ssl">SSL</el-checkbox>
          <el-checkbox v-model="form.readonly">
            <me-icon
              :name="t('conn.readonly')"
              icon="el-icon-question-filled"
              :info="t('conn.readonlyTip')"
              :icon-left="false" />
          </el-checkbox>
          <el-checkbox v-model="form.cluster">
            <me-icon
              :name="t('conn.cluster')"
              icon="el-icon-question-filled"
              :info="t('conn.clusterTip')"
              :icon-left="false" />
          </el-checkbox>
          <el-checkbox v-model="form.sentinel">
            <me-icon
              :name="t('conn.sentinel')"
              icon="el-icon-question-filled"
              :info="t('conn.sentinelTip')"
              :icon-left="false" />
          </el-checkbox>
        </el-col>
      </el-row>

      <!-- SSH隧道 -->
      <div v-show="form.ssh">
        <el-divider content-position="left">{{ t('conn.ssh') }}</el-divider>

        <!-- SSH主机、端口 -->
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item :label="t('conn.sshOption.host')" prop="sshOption.host">
              <el-input v-model.trim="form.sshOption.host" placeholder="SSH host" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('conn.sshOption.port')" prop="sshOption.port">
              <el-input-number
                :min="1"
                :max="65535"
                v-model="form.sshOption.port"
                :controls="false"
                align="left"
                style="width: 100%"
                placeholder="22" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 登录方式 -->
        <el-form-item :label="t('conn.loginType')">
          <el-segmented
            v-model="form.sshOption.loginType"
            :options="[
              { label: t('conn.sshOption.loginTypePwd'), value: 'pwd' },
              { label: t('conn.sshOption.loginTypePkfile'), value: 'pkfile' },
            ]" />
        </el-form-item>

        <!-- 密码模式 -->
        <template v-if="form.sshOption.loginType === 'pwd'">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item :label="t('conn.sshOption.username')" prop="sshOption.username">
                <el-input
                  v-model.trim="form.sshOption.username"
                  placeholder="SSH username"
                  clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('conn.sshOption.password')" prop="sshOption.password">
                <el-input
                  v-model.trim="form.sshOption.password"
                  type="password"
                  placeholder="SSH password"
                  clearable
                  show-password />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 私钥模式 -->
        <template v-if="form.sshOption.loginType === 'pkfile'">
          <el-form-item :label="t('conn.sshOption.username')" prop="sshOption.username">
            <el-input v-model.trim="form.sshOption.username" placeholder="SSH username" clearable />
          </el-form-item>
          <el-form-item :label="t('conn.sshOption.pkfile')" prop="sshOption.pkfile">
            <me-file-input
              v-model="form.sshOption.pkfile"
              :placeholder="t('conn.sshOption.pkfileHint')" />
          </el-form-item>
          <el-form-item :label="t('conn.sshOption.passphrase')">
            <el-input
              v-model.trim="form.sshOption.passphrase"
              type="password"
              placeholder="Passphrase (optional)"
              clearable
              show-password />
          </el-form-item>
        </template>
      </div>

      <!-- SSL加密 -->
      <div v-show="form.ssl">
        <el-divider content-position="left">{{ t('conn.ssl') }}</el-divider>
        <el-form-item :label="t('conn.cert')">
          <me-file-input v-model="form.sslOption.cert" :placeholder="t('conn.certHint')" />
        </el-form-item>
        <el-form-item :label="t('conn.key')">
          <me-file-input v-model="form.sslOption.key" :placeholder="t('conn.keyHint')" />
        </el-form-item>
        <el-form-item :label="t('conn.ca')">
          <me-file-input v-model="form.sslOption.ca" :placeholder="t('conn.caHint')" />
        </el-form-item>
      </div>

      <!-- 哨兵模式 -->
      <div v-show="form.sentinel">
        <el-divider content-position="left">{{ t('conn.sentinelConfig') }}</el-divider>
        <el-form-item :label="t('conn.masterName')" :label-width="t('conn.sentinelLabelWidth')">
          <div class="me-flex" style="width: 100%">
            <el-select
              v-model="form.sentinelOption.masterName"
              clearable
              filterable
              allow-create
              style="flex: 1"
              placeholder="mymaster">
              <el-option v-for="item in masters" :key="item.name" :value="item.name">
                <span style="float: left">{{ item.name }}</span>
                <span style="float: right; color: var(--el-text-color-secondary)">{{
                  item.ip + ':' + item.port
                }}</span>
              </el-option>
            </el-select>
            <el-button @click="autoDiscover(true)">{{ t('conn.autoDiscover') }}</el-button>
          </div>
        </el-form-item>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item
              :label="t('conn.masterUsername')"
              :label-width="t('conn.sentinelLabelWidth')">
              <el-input
                v-model.trim="form.sentinelOption.masterUsername"
                placeholder="username"
                clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="t('conn.masterPassword')"
              :label-width="t('conn.sentinelLabelWidth')">
              <el-input
                v-model.trim="form.sentinelOption.masterPassword"
                placeholder="password"
                type="password"
                clearable
                show-password />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
    <template #footer>
      <div class="me-flex">
        <el-button
          type="primary"
          style="margin-left: 20px"
          :loading="loading"
          :disabled="!(form.host && form.port)"
          @click="testConn"
          >{{ t('conn.testConn') }}</el-button
        >
        <div>
          <el-button @click="visible = false">{{ t('cancel') }}</el-button>
          <el-button type="primary" @click="submit">{{ t('ok') }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.el-checkbox) {
  margin-right: 20px;
}
</style>
