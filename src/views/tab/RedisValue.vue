<script setup>
import {
  bus,
  KEY_DELETE,
  KEY_REFRESH,
  meCopy,
  meDeleteKey, meErr, meHumanSeconds,
  meHumanSize,
  meInvoke,
  meOk,
  meRenameKey,
  meType
} from '@/utils/util.js'
import FieldAdd from '../ext/FieldAdd.vue'
import FieldSet from '../ext/FieldSet.vue'
import {useI18n} from 'vue-i18n'
import TTLSet from '@/views/ext/TTLSet.vue'

const { t } = useI18n()
// 刷新键
onMounted(() => bus.on(KEY_REFRESH, refreshKey))
onUnmounted(() => bus.off(KEY_REFRESH, refreshKey))

// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)
const canSave = computed(() => canEdit.value && (stringType.value || jsonType.value) )

// 值的显示方式
const viewTypeList = ['json', 'table']
const viewType = ref('json')
const hashKey = ref('')
const isPretty = ref(true)
const withHashKey = ref(false)
const tableKeyword = ref('')
const redisValue = ref(null)
const cursor = ref(null)     // 新增游标，支持list/hash/set/zset的扫描，避免一次性获取所有数据
const loading = ref(false)

// 计算属性

const hashType = computed(() => 'hash' === redisValue.value?.type)
const stringType = computed(() => 'string' === redisValue.value?.type)
const jsonType = computed(() => 'json' === redisValue.value?.type)
const streamType = computed(() => 'stream' === redisValue.value?.type)
const stringTypeOrWithHashKey = computed(() => 'string' === redisValue.value?.type || withHashKey.value)
const showValue = computed(() => {
  const obj = redisValue.value?.value
  if (obj === null || obj === undefined) return ''

  if (isPretty.value) {
    if (stringTypeOrWithHashKey.value) {
      const str = obj.toString()
      try {
        return str.startsWith('{') || str.startsWith('[') ? JSON.stringify(JSON.parse(str), null, 2) : str
      } catch (e) {
        return str
      }
    } else {
      return JSON.stringify(obj, null, 2)
    }
  } else {
    return 'hash' === redisValue.value?.type && !withHashKey.value
        || 'zset' === redisValue.value?.type // zset包含分数
        || 'json' === redisValue.value?.type
        || 'stream' === redisValue.value?.type
      ? JSON.stringify(obj) : obj.toString()
  }
})

// 键大小
const showSize = computed(() => meHumanSize(redisValue.value?.size))
// 加载更多(手动控制，而不是计算属性，避免cursor变化多次导致按钮闪现又丢失)
const showMore = ref(false)

// 表格数据
const dataList = computed(() => {
  const rv = redisValue.value
  if (rv === null || rv === undefined || rv.value === null || rv.value === undefined) return []

  let data = []

  if (rv.type === 'hash') {
    Object.entries(rv.value)
      .forEach(([key, value]) => data.push({key, value}))
  } else if (rv.type === 'list' || rv.type === 'set') {
    rv.value.forEach(value => data.push({value}))
  } else if (rv.type === 'zset' || rv.type === 'stream') {
    rv.value.forEach(value => data.push(value)) // 返回的直接是[{score: '', value: ''}]
  }
  return data
})

const filterDataList = computed(() => {
  const key = tableKeyword.value.toLowerCase()
  return dataList.value.filter(row => !key
    || row.key?.toLowerCase().indexOf(key) > -1
    || row.id?.toLowerCase().indexOf(key) > -1
    || row.value?.toLowerCase().indexOf(key) > -1
    || row.score?.toString().toLowerCase().indexOf(key) > -1,
  )
})

// 监听属性
watchEffect(() => {
  if (stringTypeOrWithHashKey.value || jsonType.value) {
    viewType.value = 'json'
  }
})

// TTL设置
let timer = null
onUnmounted(() => clearInterval(timer))
async function setTimer(seconds) {
  redisValue.value.ttl = seconds
  clearInterval(timer)
  if (redisValue.value.ttl > 0) {
    timer = setInterval(() => {
      if (redisValue.value.ttl > 0) {
        redisValue.value.ttl--
      }
    }, 1000)
  }
}

function resetParam(){
  tableKeyword.value = ''
  hashKey.value = ''
  withHashKey.value = false
}
async function refreshKey(reset = true, useCursor = false, loadAll = false) {
  fieldSetInit() // 关闭字段编辑

  if (reset) {
    resetParam()
  }

  if (!useCursor) {
    cursor.value = null
  }

  loading.value = true
  try {
    //redisValue.value = await meInvoke('get', {id: share.conn.id, key: share.redisKey, hashKey: hashKey.value})
    const param = {key: share.redisKey, hashKey: hashKey.value, count: 10, cursor: cursor.value, loadAll}
    const data = await meInvoke('field_scan', {id: share.conn.id, param})
    cursor.value = data.cursor
    withHashKey.value = !!hashKey.value;

    if (useCursor) {
      if (data.type === 'list' || data.type === 'set' || data.type === 'zset' || data.type === 'stream') {
        redisValue.value.value = redisValue.value.value.concat(data.value)
      } else if (data.type === 'hash') {
        redisValue.value.value = {...redisValue.value.value, ...data.value}
      } else {
        redisValue.value = data
      }
    } else {
      redisValue.value = data
    }

    await setTimer(redisValue.value.ttl)
    showMore.value = !(cursor.value?.finished)
  } finally {
    loading.value = false
  }
}

// 删除键
onMounted(() => bus.on(KEY_DELETE, deleteKey))
onUnmounted(() => bus.off(KEY_DELETE, deleteKey))

function deleteKey() {
  redisValue.value = null
}

function delKey() {
  meDeleteKey(share.conn.id, share.redisKey)
}

function renameKey(){
  meRenameKey(share.conn.id, share.redisKey)
}

// 保存值
async function setValue() {
  const params = {
    key: share.redisKey,
    value: redisValue.value.newValue || redisValue.value.value,
    ttl: redisValue.value.ttl,
    keyType: redisValue.value.type,
  }

  // json格式验证 ==> 前端暂不校验了，后端rust的校验可以精确提示第几行第几列错误
  await meInvoke('set', {id: share.conn.id, ...params});
  meOk(t('saveOk'))
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 更新TTL
const ttlSetRef = useTemplateRef('ttlSetRef')
function updateTTL() {
  if(!canEdit.value) return

  ttlSetRef.value?.open({
    ttl: redisValue.value.ttl,
  })
}

// 字段新增
const fieldAddRef = useTemplateRef('fieldAddRef')
function fieldAdd() {
  fieldAddRef.value?.open({
    mode: 'field',
    type: redisValue.value.type,
    ...share.redisKey,
  })
}

// 字段编辑
const fieldSetIndex = ref(-1)
const fieldSetRef = useTemplateRef('fieldSetRef')
function fieldSetInit() {
  fieldSetIndex.value = -1
  fieldSetRef.value?.close()
}
function fieldSet(row, index) {
  fieldSetIndex.value = index
  const params = {
    fieldKey: row.key || '',
    fieldValue: row.value,
    fieldScore: row.score || 0,
    srcFieldValue: row.value,
    type: redisValue.value.type,
    key: share.redisKey,
  }
  if (redisValue.value.type === 'list') {
    // 此处不要直接取索引，而是重新去计算下（因为表格可能被关键字过滤过）
    params.fieldIndex = redisValue.value.value.indexOf(row.value)
  } else {
    params.fieldIndex = -1
  }
  fieldSetRef.value.open(params)
}

function rowClassName({row, rowIndex}){
  return `table-row-index-${rowIndex}`; // 给每行加一个带有索引的class
}

function rowClick(row, column, event) {
  // 编辑字段值没有开启时，忽略行点击事件
  if (fieldSetIndex.value === -1) return

  // 从点击事件的当前元素（即 <tr>）获取 class
  const trElement = event.currentTarget;
  const classList = trElement.classList;
  for (let className of classList) {
    if (className.startsWith('table-row-index-')) {
      const rowIndex = parseInt(className.split('-')[3]); // 提取索引数字
      fieldSet(row, rowIndex)
      break;
    }
  }
}

// 字段删除
async function fieldDel(row) {
  const param = {fieldKey: row.key || '', fieldValue: row.value , key: share.redisKey, streamId: row.id || ''}
  if (redisValue.value.type === 'list') {
    param.fieldIndex = redisValue.value.value.indexOf(row.value)
  } else {
    param.fieldIndex = -1  // 其他类型使用不到，但接口需传递
  }

  if (redisValue.value.type === 'stream') {
    param.fieldValue = '' // 后端接收需要是String
  }

  await meInvoke('field_del',{id: share.conn.id, param});
  meOk(t('deleteOk'))
  await refreshKey()
}
</script>

<template>
  <!-- 大部分Key都很快得到，element-loading-background设置为unset避免loading背景一闪而过，不友好  -->
  <div class="redis-value" v-loading="loading" element-loading-background="unset">
    <template v-if="share.redisKey && redisValue">
      <div class="key">
        <el-input type="text" v-model="share.redisKey.key" readonly style="flex: 1">
          <template #prepend>
            <el-text :type="meType(redisValue.type)">{{ redisValue.type.toUpperCase() }}</el-text>
          </template>
          <template #append>
            <me-button :info="t('copy')" icon="el-icon-document-copy" @click="meCopy(share.redisKey.key)" placement="top"/>
          </template>
        </el-input>

        <el-input type="text" :placeholder="t('redisValue.optional')"
                  clearable style="width: 200px; margin-left: 10px"
                  v-model="hashKey" v-if="redisValue.type === 'hash'"
                  @keyup.enter="refreshKey(false)">
          <template #prepend>{{ t('redisValue.hashKey') }}</template>
        </el-input>

        <div class="me-flex">
          <me-button icon="el-icon-timer" :info="canEdit ? t('redisValue.ttlHint') : t('redisValue.ttlHintReadonly')" placement="top" style="margin: 0 10px" @click="updateTTL">
            {{ redisValue.ttl === -1 ? t('redisValue.ttlForever') : meHumanSeconds(redisValue.ttl)}}
          </me-button>

          <el-button-group>
            <me-button :info="t('redisValue.refreshKey')" icon="el-icon-refresh" placement="top" @click="refreshKey(false)"/>
            <me-button :info="t('redisValue.renameKey')"  icon="el-icon-edit"    placement="top" @click="renameKey" v-if="canEdit"/>
            <me-button :info="t('redisValue.deleteKey')"  icon="el-icon-delete"  placement="top" @click="delKey"    v-if="canEdit" type="danger"/>
          </el-button-group>
        </div>
      </div>

      <div class="value">
        <!-- json显示 -->
        <template v-if="viewType === 'json'">
          <me-code :modelValue="showValue" @update:modelValue="(newValue) => redisValue.newValue=newValue" :read-only="!canSave"/>

          <div class="btn-rb" v-if="canSave">
            <me-button class="save" :info="t('save')" type="danger" icon="me-icon-save" @click="setValue" placement="top"/>
          </div>

          <div class="btn-rt">
            <el-button-group v-show="showMore">
              <me-button :info="t('redisValue.loadMore')" icon="me-icon-load-more"
                         @click="refreshKey(false, true, false)"
                         placement="top"/>
              <me-button :info="t('redisValue.loadAll')" icon="me-icon-load-all"
                         @click="refreshKey(false, true, true)"
                         placement="top"/>
            </el-button-group>

            <el-button-group>
              <el-button style="margin-left: 10px">Size: {{ showSize }}</el-button>
              <me-button :info="t('copy')" icon="el-icon-document-copy" @click="meCopy(showValue)" placement="bottom"/>
              <me-button :info="t('redisValue.prettyHint')"
                         placement="bottom-end"
                         icon="el-icon-magic-stick"
                         :type="isPretty ? 'info' : ''"
                         @click="isPretty = !isPretty"/>
            </el-button-group>
          </div>
        </template>

        <!-- 表格显示 -->
        <div class="me-flex" style="flex-direction: column; height: 100%" v-else>
          <div class="me-flex" style="width: 100%">
            <el-input v-model="tableKeyword" :placeholder="t('redisValue.tableKeyword')" clearable
                      style="width: 300px"/>

            <div>
              <el-button-group v-show="showMore">
                <me-button :info="t('redisValue.loadMore')" icon="me-icon-load-more"
                           @click="refreshKey(false, true, false)"
                           placement="top"/>
                <me-button :info="t('redisValue.loadAll')" icon="me-icon-load-all"
                           @click="refreshKey(false, true, true)"
                           placement="top"/>
              </el-button-group>
              <el-button icon="el-icon-plus" @click="fieldAdd" style="margin-left: 10px">{{ t('redisValue.insertRow') }}</el-button>
            </div>
          </div>
          <div class="table-view">
            <me-table :data="filterDataList" border stripe ref="table" height="100%"
                      :row-class-name="rowClassName" @row-click="rowClick">
              <el-table-column label="#" type="index" width="50" align="center" show-overflow-tooltip>
                <template #default="scope">
                  <div v-if="fieldSetIndex !== scope.$index">{{ scope.$index + 1 }}</div>
                  <me-icon v-else icon="el-icon-edit" :style="{color: share.color, display: 'block'}"></me-icon>
                </template>
              </el-table-column>

              <el-table-column :label="t('redisValue.id')"    prop="id"    show-overflow-tooltip v-if="redisValue.type === 'stream'"/>
              <el-table-column :label="t('redisValue.key')"   prop="key"   show-overflow-tooltip v-if="redisValue.type === 'hash'"/>
              <el-table-column :label="t('redisValue.value')" prop="value" show-overflow-tooltip>
                <template #default="scope">
                  {{streamType ? JSON.stringify(scope.row.value) : scope.row.value}}
                </template>
              </el-table-column>
              <el-table-column :label="t('redisValue.score')" prop="score" show-overflow-tooltip v-if="redisValue.type === 'zset'"/>

              <el-table-column :label="t('action')" :width="canEdit ? (streamType ? 66 : 100) : 60" fixed="right" align="center">
                <template #default="scope">
                  <div class="me-flex" :style="{justifyContent: canEdit ? 'space-between' : 'center'}">
                    <me-icon :info="t('copy')" icon="el-icon-document-copy" class="icon-btn"
                             @click.stop="meCopy(streamType ? JSON.stringify(scope.row.value) : scope.row.value) "/>
                    <me-icon :info="t('edit')" icon="el-icon-edit" class="icon-btn"
                             @click.stop="fieldSet(scope.row, scope.$index)" v-if="canEdit && !streamType"/>
                    <el-popconfirm :hide-after="0" :title="t('redisValue.deleteConfirm')"
                                   @confirm.stop="fieldDel(scope.row)" v-if="canEdit">
                      <template #reference>
                        <me-icon :info="t('delete')" icon="el-icon-delete" class="icon-btn"/>
                      </template>
                    </el-popconfirm>
                  </div>
                </template>
              </el-table-column>
            </me-table>
            <!-- 字段编辑 -->
            <FieldSet ref="fieldSetRef" @success="refreshKey" @closed="fieldSetInit" class="field-set"/>
          </div>
        </div>

        <!-- string类型不显示，带有hashKey不显示, 命中黑名单的hash类型不显示-->
        <div class="btn-rb" v-if="!(stringTypeOrWithHashKey || jsonType || hashType && showValue.startsWith('['))">
          <el-segmented v-model="viewType" :options="viewTypeList">
            <template #default="scope">
              <me-icon :name="t('redisValue.jsonView')" icon="me-icon-json" hint placement="top"
                       v-if="scope.item === 'json'"/>
              <me-icon :name="t('redisValue.tableView')" icon="me-icon-table" hint placement="top" v-else/>
            </template>
          </el-segmented>
        </div>
      </div>
    </template>
    <el-empty v-else :description="t('redisValue.noKeySelected')"></el-empty>

    <!-- 更新TTL, 字段新增 -->
    <TTLSet ref="ttlSetRef" @success="setTimer"/>
    <FieldAdd ref="fieldAddRef" @success="refreshKey"/>
  </div>
</template>

<style scoped lang="scss">
.redis-value {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  .key {
    :deep(.el-input-group__prepend) {
      padding: 0 16px;
    }
    :deep(.el-input-group__append) {
      padding: 0 18px;
    }

    display: flex;
    justify-content: space-between;
  }

  .value {
    margin-top: 10px;
    position: relative;
    flex-grow: 1;
    overflow: hidden;

    .btn-rt {
      //background-color: #272822;
      position: absolute;
      right: 0;
      top: 0;
    }

    .btn-rb {
      position: absolute;
      right: 0;
      bottom: 0;
      z-index: 10;  // 当表格数据较多时，可以显示在上方
    }

    .btn-lb {
      position: absolute;
      left: 40px ;
      bottom: 0;
    }

    .table-view {
      margin-top: 10px;
      flex-grow: 1;
      height: 0;
      width: 100%;
      position: relative;

      :deep(.el-table) {
        .field-set-row {
          --el-table-tr-bg-color: var(--el-color-warning-light-9);
        }

        .field-setting {
          cursor: pointer;
        }
      }

      .field-set {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 20;
        width: 60%;
        height: 100%;
      }
    }
  }
}
</style>
