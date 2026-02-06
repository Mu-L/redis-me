<script setup>
import {configTip as tips} from '@/utils/tip.js'
import {redisConfDict} from '@/utils/redis.js'
import NodeList from '../ext/NodeList.vue'
import {meInvoke, meOk} from '@/utils/util.js'
import {sortBy} from 'lodash'
import {useI18n} from 'vue-i18n'
import {BaseDirectory} from '@tauri-apps/api/path'
import {readTextFile} from '@tauri-apps/plugin-fs'

const { t } = useI18n()
// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)
const {initNode} = defineProps({
  initNode: {type: String, default: ''}
})

const node = ref(initNode)
const keyword = ref('')
const loading = ref(false)
const dataList = ref([])

// 文件格式的配置文件
// const configVersionList = Object.keys(redisConfText).reverse()
const configVersionList = ['Redis8.4', 'Redis7.4', 'Redis6.2', 'Redis5.0', 'Redis4.0']
const configVersion = ref('Redis8.4')  // 版本
const configRaw = ref('')

watchEffect(async () => {
  try {
    // configRaw.value = redisConfText[configVersion.value]
    configRaw.value = await readTextFile(`resources/conf/${configVersion.value}.conf`, {baseDir: BaseDirectory.Resource})
  } catch (e) {
    configRaw.value = t('redisConfig.noConfig')
  }
})

function handleCommand(command){
  configVersion.value = command
  nextTick(() => dialog.raw = true)
}

// Json格式的默认配置
const dictVersionList = Object.keys(redisConfDict).reverse()
const dictVersion = ref(dictVersionList[0])
const dictRaw = computed(() => redisConfDict[dictVersion.value])
const showTypeOptions = [
  {label: t('redisConfig.all'), value: 'All'},
  {label: t('redisConfig.diff'), value: 'Diff'},
]
const showType = ref('All')

const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  return dataList.value.filter(row =>
       (!key || row.param?.toLowerCase().indexOf(key) > -1
             || row.value?.toLowerCase().indexOf(key) > -1
             || tips.value[row.param]?.toLowerCase().indexOf(key) > -1
       )
    && (showType.value === 'All' || showType.value === 'Diff' && row.value !== dictRaw.value[row.param])
  )
})

// 合计列
function getSummaries() {
  return [t('redisConfig.total'), filterDataList.value.length + ' / ' + dataList.value.length, '']
}

async function apiConfigGet() {
  const data = await meInvoke('config_get', {id: share.conn.id, pattern: '*', node: node.value})
  const tableData = []
  Object.entries(data).forEach(([key, value]) => tableData.push({param: key, value}))
  dataList.value = sortBy(tableData, ['param'])
}

async function refresh() {
  loading.value = true
  try {
    await apiConfigGet()
  } finally {
    loading.value = false
  }
}
refresh()

// 官网默认配置参考
const dialog = reactive({
  raw: false
})

// 行样式展示
function calcRowStyle({row}) {
  return {'color': row.value === dictRaw.value[row.param] ? '' : share.color}
}


// 设置参数
const formRef = useTemplateRef('formRef')
const editLoading = ref(false)
const editShow = ref(false)
const form = reactive({
  param: '',
  value: '',
  autoBroadcast: true
})
const command = computed(() => `CONFIG SET ${form.param} ${form.value?.includes(' ') ? '"' + form.value + '"' : form.value}`)
async function editConfig(row) {
  form.param = row.param
  form.value = row.value
  await nextTick(() => {
    editShow.value = true
  })
}
async function configSet() {
  formRef.value.validate(async valid => {
    if (!valid) return

    editLoading.value = true
    try {
      const param = {command: command.value, node: form.autoBroadcast ? '' : node.value, autoBroadcast: form.autoBroadcast}
      await meInvoke('execute_command', {id: share.conn.id, param})
      meOk(t('saveOk'))
      await refresh()
      editShow.value = false
    } finally {
      editLoading.value = false
    }
  })
}

const rules = computed(() => ({
  value: [ {required: true, message: t('redisConfig.valueRequired')}]
}))
</script>

<template>
  <div class="redis-config">
    <div class="me-flex header">
      <div>
        <div class="me-flex">
          <node-list v-model="node" style="margin-right: 10px" @change="refresh"/>
          <el-dropdown @command="handleCommand">
            <el-button plain icon="el-icon-notebook" type="info">{{ t('redisConfig.reference') }}</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="item" v-for="item in configVersionList">{{item}}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="me-flex">
        <el-segmented v-model="showType" :options="showTypeOptions"></el-segmented>
        <el-select v-model="dictVersion" style="width: 120px; margin: 0 10px">
          <el-option v-for="item in dictVersionList" :key="item" :label="item" :value="item"/>
        </el-select>
        <el-input  v-model="keyword" :placeholder="t('redisConfig.keyword')" style="width: 250px; margin-right: 10px" clearable/>
        <el-button icon="el-icon-search" @click="refresh" type="primary" :loading="loading"/>
      </div>
    </div>

    <el-table :data="filterDataList" ref="table"
              style="margin-top: 10px"
              v-loading="loading"
              :row-style="calcRowStyle"
              show-summary :summary-method="getSummaries"
              border stripe height="100%">
      <el-table-column :label="t('redisConfig.param')" prop="param" sortable show-overflow-tooltip/>
      <el-table-column :label="t('redisConfig.value')" prop="value" show-overflow-tooltip/>
      <el-table-column :label="dictVersion + ' ' + t('redisConfig.defaultConfig')" prop="value" show-overflow-tooltip>
        <template #default="scope">
          {{dictRaw[scope.row.param]}}
        </template>
      </el-table-column>
      <el-table-column :label="t('redisConfig.tip')" show-overflow-tooltip>
        <template #default="scope">
          <span style="color: var(--el-color-info)">{{tips[scope.row.param]}}</span>
        </template>
      </el-table-column>

      <el-table-column :label="t('action')" width="80" align="center" fixed="right" v-if="canEdit">
        <template #default="scope">
          <me-icon :info="t('redisConfig.configSet')" icon="el-icon-edit" class="icon-btn"
                   @click="editConfig(scope.row)" style="justify-content: center"/>
        </template>
      </el-table-column>
    </el-table>

    <me-dialog icon="me-icon-redis" :title="`${configVersion} ${t('redisConfig.defaultConfig')}`" v-model="dialog.raw" width="60vw">
      <me-code :modelValue="configRaw" mode="properties" read-only />
    </me-dialog>

    <el-dialog :title="t('redisConfig.configSet')" v-model="editShow" align-center>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item :label="t('redisConfig.param')">
          <el-input v-model="form.param" disabled/>
        </el-form-item>
        <el-form-item :label="t('redisConfig.value')" prop="value">
          <div class="me-flex" style="width: 100%">
            <el-input v-model="form.value" :placeholder="t('redisConfig.value')" clearable style="flex: 1"/>
            <el-tooltip :content="t('redisConfig.autoBroadcastTip')" placement="top-end" :show-after="500">
              <el-checkbox v-model="form.autoBroadcast" :label="t('redisConfig.autoBroadcast')"
                           style="margin-left: 20px" v-if="share.nodeList.length > 0"/>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="t('redisConfig.command')">
          <el-text type="primary">{{command}}</el-text>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editShow=false" >{{ t('cancel') }}</el-button>
        <el-button type="primary" :loading="editLoading" @click="configSet">{{ t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.redis-config {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  .header {
    :deep(.el-input-group__prepend) {
      padding: 0 14px;
    }
  }

  .table {
    margin-top: 10px;
    flex-grow: 1;
    height: 0;
  }
}
</style>
