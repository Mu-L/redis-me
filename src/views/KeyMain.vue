<script setup>
import { listen } from '@tauri-apps/api/event'
import { sortBy } from 'lodash'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  bus,
  CONN_REFRESH,
  INFO_REFRESH,
  KEY_DELETE,
  KEY_REFRESH,
  KEY_TYPE_LIST,
  meConfirm,
  meCopy,
  meDeleteKey,
  meInvoke,
  meKeyShort,
  meOk,
  mePrompt,
  meRenameKey,
  sleep,
} from '@/utils/util.js'
import FieldAdd from '@/views/ext/FieldAdd.vue'
import TTLSet from '@/views/ext/TTLSet.vue'
import KeyImport from '@/views/key/KeyImport.vue'

import KeyBatch from './key/KeyBatch.vue'
import KeyMemory from './key/KeyMemory.vue'
import KeyTree from './key/KeyTree.vue'

const { t } = useI18n()
// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)

// 监听刷新事件
async function refresh() {
  initReset()
  await scanKey()
}
onMounted(() => refresh())

// 刷新时条件初始化
function initReset() {
  keyType.value = 'ALL'
  exact.value = false
  keyword.value = ''
  keyList.value = []
  share.redisKey = null
}

// 键类型
const keyType = ref('ALL') // 键类型
function chooseKeyType(keyTypeSelected) {
  keyType.value = keyTypeSelected
  keyword.value = ''
  scanKey(false, false)
}

// 查询框: SCAN cursor [MATCH pattern] [COUNT count] [TYPE type]
const exact = ref(false) // 是否精确查询
const keyword = ref('') // 关键字
const loading = ref(false) // 扫描键过程中loading
const loadFolder = ref(false) // 文件夹的右键：仅加载该目录的特殊处理
const match = computed(() => {
  // 仅扫描该目录，直接返回
  if (loadFolder.value) return keyword.value + ':*'

  // 精确查询直接返回；空白则返回*；否则判断前后是否需要添加*
  if (exact.value) return keyword.value
  if (!keyword.value) return '*'
  if (keyword.value.startsWith('*') && keyword.value.endsWith('*')) return keyword.value
  if (keyword.value.startsWith('*')) return keyword.value + '*'
  if (keyword.value.endsWith('*')) return '*' + keyword.value
  return '*' + keyword.value + '*'
})
const cursor = ref(null) // 扫描的游标

// 扫描键
const keyList = ref([]) // 键列表
const filterKeyList = computed(() => {
  const key = keyword.value.toLowerCase()
  return keyList.value.filter(k => k.key.toLowerCase().indexOf(key) > -1)
})

async function scanKey(useCursor = false, loadAll = false) {
  // 避免重复调用
  if (loading.value) return

  loading.value = true
  try {
    if (!useCursor) {
      cursor.value = null
      keyList.value = []
    }

    const params = {
      match: match.value,
      count: meTauri.settings.keyScanCount,
      type: keyType.value === 'ALL' ? '' : keyType.value.toLowerCase(),
      loadAll: loadAll,
      cursor: cursor.value,
    }
    const data = await meInvoke('scan', { id: share.conn.id, param: params })
    cursor.value = data.cursor

    // 排序下, 虽然后端排序更快，但多次扫描的结果还是需要前端排序
    const newKeyList = [...keyList.value, ...data.keyList]
    keyList.value = sortBy(newKeyList, ['key'])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  bus.on(KEY_DELETE, deleteKey)
  bus.on(CONN_REFRESH, refresh)
})
onUnmounted(() => {
  bus.off(KEY_DELETE, deleteKey)
  bus.off(CONN_REFRESH, refresh)
})

function deleteKey(redisKey) {
  keyList.value = keyList.value.filter(rk => rk.bytes !== redisKey.bytes)
  share.redisKey = null
  bus.emit(INFO_REFRESH)
}

// 数据库列表
const dbList = ref([])
async function refreshDbList() {
  dbList.value = await meInvoke('db_list', { id: share.conn.id })

  // 超出范围后台连接忽略（即连接db0），前端也改为0
  if (share.conn.db >= dbList.value.length) {
    share.conn.db = 0
  }
}
refreshDbList()

async function selectDB() {
  await meInvoke('select_db', { id: share.conn.id, db: share.conn.db })
  await refresh() // RedisInfo的键数量需要更新下
}

const keyPrefix = ref('')

// 选中键
function chooseKey(redisKey) {
  keyPrefix.value = redisKey.key + '-copy'
  share.redisKey = redisKey
  share.tabName = 'value'
  bus.emit(KEY_REFRESH)
}

// 选中文件夹
function chooseFolder(folder) {
  keyPrefix.value = folder + ':'
}

// 键右键
function contextKey(command, redisKey) {
  if (command === 'addKey') {
    keyPrefix.value = redisKey.key + '-copy'
    addKey()
  } else if (command === 'refreshKey') {
    chooseKey(redisKey)
  } else if (command === 'copyKey') {
    meCopy(redisKey.key)
  } else if (command === 'deleteKey') {
    meDeleteKey(share.conn.id, redisKey)
  } else if (command === 'renameKey') {
    meRenameKey(share.conn.id, redisKey)
  } else {
    meOk(`TODO: ${command}`)
  }
}

// 文件夹右键
function contextFolder(command, folder) {
  if (command === 'addKey') {
    keyPrefix.value = folder + ':'
    addKey()
  } else if (command === 'copyFolder') {
    meCopy(folder)
  } else if (command === 'loadFolder') {
    loadFolder.value = true
    try {
      exact.value = false
      keyword.value = folder
      scanKey(false, false)
    } finally {
      loadFolder.value = false
    }
  } else if (command === 'memoryUsage') {
    keyMemory(folder)
  } else if (command === 'deleteFolder') {
    deleteFolder(folder)
  } else if (command === 'exportFolder') {
    exportFolder(folder)
  } else {
    meOk(`TODO: ${command}`)
  }
}

// 字段新增
const fieldAddRef = useTemplateRef('fieldAddRef')

function addKey() {
  fieldAddRef.value?.open({ mode: 'key', key: keyPrefix.value })
}

const keyTreeRef = useTemplateRef('keyTreeRef')
function addKeyOk(redisKey) {
  keyList.value.unshift(redisKey)
  chooseKey(redisKey)
  nextTick(() => {
    keyTreeRef.value.setCurrentKey(redisKey)
  })
  bus.emit(INFO_REFRESH)
}

// 批量导出键 和 批量删除键
const keyBatchRef = useTemplateRef('keyBatchRef')
function deleteFolder(folder) {
  const match = folder === '*' ? '*' : folder + ':*'
  keyBatchRef.value?.open({ match, keyList: [] }, 'delete')
}
function exportFolder(folder) {
  const match = folder === '*' ? '*' : folder + ':*'
  keyBatchRef.value?.open({ match, keyList: [] }, 'export')
}

function batchKeyOk(mode) {
  if (mode === 'delete') {
    scanKey(false, false)
    bus.emit(INFO_REFRESH)
  } else {
    share.exportImportingPercentage = 0
    share.exportImporting = true
    share.exportImportingTip = t('keyMain.exporting')
    tauriListen('export')
  }
}

// 导入数据
const keyImportRef = useTemplateRef('keyImportRef')
function importData(isCmdFile = false) {
  keyImportRef.value.open(isCmdFile)
}
function importStart() {
  share.exportImportingPercentage = 0
  share.exportImporting = true
  share.exportImportingTip = t('keyMain.importing')
  tauriListen('import')
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// 监听消息
let unlisten = null
async function tauriListen(eventName) {
  unlisten = await listen(eventName, event => {
    const payload = event.payload
    if (payload.id !== share.conn.id) return
    share.exportImportingPercentage = Math.round(
      ((payload.okCount + payload.errCount + payload.ignoreCount) / payload.totalCount) * 100,
    )

    if (payload.finished) {
      tauriUnlisten()
      share.exportImportingPercentage = 100
      share.exportImporting = false
      meOk(t(`keyMain.${eventName}Result`, payload), true, t(`keyMain.${eventName}Done`))

      // 导入完成后刷新连接
      if (eventName === 'import') {
        bus.emit(INFO_REFRESH)
      }
    }
  })
}

async function tauriUnlisten() {
  if (unlisten) {
    unlisten()
  }
}
onUnmounted(() => tauriUnlisten())
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// 内存分析
const keyMemoryRef = useTemplateRef('keyMemoryRef')
function keyMemory(folder) {
  keyMemoryRef.value?.open({ match: folder + ':*' })
}

// 键显示类型: tree/list; 树形列表排序方式: 字母排序/数量排序
const keyShowTree = computed({
  get() {
    return meTauri.settings.keyShow === 'tree'
  },
  set(newValue) {
    meTauri.settings.keyShow = newValue ? 'tree' : 'list'
  },
})

const sortByCount = computed({
  get() {
    return meTauri.settings.keySort === 'count'
  },
  set(newValue) {
    meTauri.settings.keySort = newValue ? 'count' : 'alphabet'
  },
})
// 更多选项按钮
async function handleCommand(command) {
  if (command === 'toggleKeyShow') {
    keyShowTree.value = !keyShowTree.value
  } else if (command === 'toggleKeySort') {
    sortByCount.value = !sortByCount.value
  } else if ('mockData' === command) {
    await mockData()
  } else if ('exportData' === command) {
    exportFolder('*')
  } else if ('importData' === command) {
    importData(false)
  } else if ('importCmd' === command) {
    importData(true)
  } else if ('batchDelete' === command) {
    deleteFolder('*')
  } else if ('flushDb' === command) {
    flushDb()
  }
}

// 清空数据库
function flushDb() {
  meConfirm(t('keyMain.flushDbConfirm'), async () => {
    await meInvoke('flush_db', { id: share.conn.id })
    meOk(t('keyMain.flushDbOk'))
    bus.emit(CONN_REFRESH)
    bus.emit(INFO_REFRESH)
  })
}

// 新增模拟数据
async function mockData() {
  mePrompt(
    t('keyHeader.mockHint'),
    {
      inputValue: 100,
      inputType: 'number',
      inputValidator: value => {
        if (value < 1 || value > 1000) {
          return t('keyHeader.mockValidator')
        }
      },
    },
    async ({ value }) => {
      let total = value
      share.exportImportingPercentage = 0
      share.exportImporting = true
      share.exportImportingTip = t('keyHeader.mocking')

      try {
        while (value > 0) {
          const count = Math.min(value, 10)
          await meInvoke('mock_data', { id: share.conn.id, count })
          value = value - count
          share.exportImportingPercentage = Math.round(((total - value) / total) * 100)
          await sleep(10) // 睡眠10ms以便其他动作可以获取到锁, 同时避免UI界面卡顿
        }
        meOk(t('keyHeader.mockOk'))
        bus.emit(CONN_REFRESH)
        bus.emit(INFO_REFRESH)
      } finally {
        share.exportImporting = false
      }
    },
  )
}

// 多选选择
const showCheckbox = ref(false)
const checkedKeyList = ref([])

function toggleChecked() {
  showCheckbox.value = !showCheckbox.value
  checkedKeyList.value = []
}

function checkChange(redisKeys) {
  checkedKeyList.value = redisKeys
}

// 多选后的批量操作
const checkedDisabled = computed(() => checkedKeyList.value.length === 0 || share.exportImporting)
const checkedBtnClass = computed(() =>
  checkedDisabled.value ? ['footer-btn'] : ['icon-btn', 'footer-btn'],
)
function exportChecked() {
  keyBatchRef.value?.open({ match: '', keyList: checkedKeyList.value }, 'export')
}

const ttlSetRef = useTemplateRef('ttlSetRef')
function ttlChecked() {
  ttlSetRef.value?.open({
    keyList: checkedKeyList.value,
  })
}

function deleteChecked() {
  keyBatchRef.value?.open({ match: '', keyList: checkedKeyList.value }, 'delete')
}

// 自定义数据库名称
function editDbName(db) {
  mePrompt(
    t('keyMain.editDbName', { index: db }),
    {
      inputValue: share.conn?.meta?.['db' + db] || '',
      inputPlaceholder: t('keyMain.editDbNamePlaceholder'),
    },
    ({ value }) => {
      share.conn.meta ??= {} // meta为空则赋值为空对象
      share.conn.meta['db' + db] = value
    },
  )
}
</script>

<template>
  <div class="key-main">
    <div class="key-header">
      <el-input
        v-model="keyword"
        :placeholder="t('keyMain.keyword')"
        @keyup.enter="scanKey(false, false)"
        clearable>
        <template #prepend>
          <el-dropdown placement="bottom-start" @command="chooseKeyType">
            <el-tag
              :type="keyType.type"
              effect="plain"
              style="
                width: 32px;
                height: 32px;
                font-weight: bold;
                border-bottom-right-radius: 0;
                border-top-right-radius: 0;
              ">
              {{ meKeyShort(keyType, 'A') }}
            </el-tag>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="ALL">
                  <el-tag
                    type="info"
                    :effect="'ALL' === keyType ? 'plain' : 'dark'"
                    style="width: 26px"
                    hit>
                    A
                  </el-tag>
                  <el-text style="margin-left: 6px" type="info">ALL</el-text>
                </el-dropdown-item>
                <el-dropdown-item v-for="item in KEY_TYPE_LIST" :command="item.value">
                  <el-tag
                    :type="item.type"
                    :effect="item.value === keyType ? 'plain' : 'dark'"
                    style="width: 26px"
                    hit>
                    {{ meKeyShort(item.value) }}
                  </el-tag>
                  <el-text style="margin-left: 6px">{{ item.value }}</el-text>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-tooltip :content="t('keyMain.exactSearch')" placement="bottom">
            <el-checkbox size="small" v-model="exact" style="margin-left: 10px" />
          </el-tooltip>
        </template>
        <template #append>
          <el-button-group>
            <me-button
              :info="t('keyMain.refreshKey')"
              @click="scanKey(false, false)"
              icon="el-icon-search"
              placement="bottom" />
            <me-button
              :info="t('keyMain.addKey')"
              @click="addKey"
              style="border-color: var(--el-button-border-color)"
              v-if="canEdit"
              icon="el-icon-plus"
              placement="bottom" />
          </el-button-group>
        </template>
      </el-input>
    </div>

    <div class="key-list" v-loading="loading">
      <KeyTree
        ref="keyTreeRef"
        :show-checkbox="showCheckbox"
        :filter-key-list="filterKeyList"
        :redis-key="share.redisKey"
        :key-show-tree="keyShowTree"
        :sort-by-count="sortByCount"
        :color="share.color"
        @chooseKey="chooseKey"
        @contextKey="contextKey"
        @chooseFolder="chooseFolder"
        @contextFolder="contextFolder"
        @checkChange="checkChange" />
    </div>

    <div class="key-footer">
      <!-- 左侧: 数据库|游标 -->
      <div class="me-flex" v-if="!showCheckbox">
        <el-select
          v-model="share.conn.db"
          @change="selectDB"
          style="width: 120px"
          filterable
          v-if="!share.conn.cluster">
          <!-- label for filterable -->
          <el-option v-for="item in dbList" :key="item.db" :value="item.db"
                     :label="'db' + item.db + share.conn?.meta?.['db' + item.db] || ''">
            <div class="me-flex" style="align-items: center">
              <div>{{ `db${item.db} (${share.dbSizeMap['db' + item.db] || 0})` }}</div>
              <div style="display: flex">
                <el-text type="info" style="margin: 0 10px">{{
                  share.conn?.meta?.['db' + item.db]
                }}</el-text>
                <me-icon icon="el-icon-edit" class="icon-btn" @click.stop="editDbName(item.db)" />
              </div>
            </div>
          </el-option>
          <template #label>
            {{ `db${share.conn.db} (${share.dbSizeMap['db' + share.conn.db] || 0})` }}
          </template>
        </el-select>
        <div class="me-flex" style="width: 45px; margin: 0 5px" v-if="!cursor?.finished">
          <me-icon
            :name="t('keyMain.loadMore')"
            icon="me-icon-load-more"
            hint
            placement="top"
            class="icon-btn footer-btn"
            @click="scanKey(true, false)" />
          <me-icon
            :name="t('keyMain.loadAll')"
            icon="me-icon-load-all"
            hint
            placement="top"
            class="icon-btn footer-btn"
            @click="scanKey(true, true)" />
        </div>
      </div>

      <!-- 左侧: 导出|TTL|删除 （多选时显示） -->
      <div class="me-flex" v-else style="width: 70px; margin-left: 10px">
        <el-link underline="never" :disabled="checkedDisabled" @click="exportChecked">
          <me-icon
            :name="t('keyMain.exportChecked')"
            icon="me-icon-export"
            hint
            :class="checkedBtnClass"
            placement="top" />
        </el-link>
        <el-link underline="never" :disabled="checkedDisabled" @click="ttlChecked" v-if="canEdit">
          <me-icon
            :name="t('keyMain.ttlChecked')"
            icon="el-icon-timer"
            hint
            :class="checkedBtnClass"
            placement="top" />
        </el-link>
        <el-link
          underline="never"
          :disabled="checkedDisabled"
          @click="deleteChecked"
          v-if="canEdit">
          <me-icon
            :name="t('keyMain.deleteChecked')"
            icon="el-icon-delete"
            hint
            :class="checkedBtnClass"
            placement="top" />
        </el-link>
      </div>

      <!-- 中间: 选中/过滤, 过滤/总数 -->
      <div class="center">
        <el-text class="tip" size="large" type="primary">
          <span v-if="showCheckbox">{{ checkedKeyList.length }} / {{ filterKeyList.length }}</span>
          <span v-else>{{ filterKeyList.length }} / {{ keyList.length }}</span>
        </el-text>
      </div>

      <!-- 右侧: 多选|扩展 -->
      <div class="me-flex" v-if="!showCheckbox">
        <me-icon
          icon="me-icon-checked"
          class="icon-btn footer-btn"
          @click="toggleChecked"
          placement="top"
          :name="t('keyMain.checkedMode')"
          hint
          style="font-size: 24px" />
        <el-dropdown placement="top-end" @command="handleCommand" style="margin: 5px">
          <me-icon icon="el-icon-more-filled" class="icon-btn footer-btn" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exportData">
                <me-icon :name="t('keyMain.exportData')" icon="me-icon-export" />
              </el-dropdown-item>
              <el-dropdown-item command="importData" v-if="canEdit">
                <me-icon :name="t('keyMain.importData')" icon="me-icon-import" />
              </el-dropdown-item>
              <el-dropdown-item command="importCmd" v-if="canEdit">
                <me-icon :name="t('keyMain.importCmd')" icon="me-icon-import" />
              </el-dropdown-item>
              <el-dropdown-item command="mockData" v-if="canEdit">
                <me-icon :name="t('keyMain.mockData')" icon="el-icon-coffee-cup" />
              </el-dropdown-item>

              <el-dropdown-item command="batchDelete" v-if="canEdit" divided>
                <me-icon :name="t('keyMain.batchDelete')" icon="el-icon-delete" />
              </el-dropdown-item>
              <el-dropdown-item command="flushDb" v-if="canEdit">
                <me-icon :name="t('keyMain.flushDb')" icon="el-icon-delete-filled" />
              </el-dropdown-item>

              <el-dropdown-item command="toggleKeyShow" divided>
                <me-icon
                  :name="keyShowTree ? t('keyMain.listView') : t('keyMain.treeView')"
                  :icon="keyShowTree ? 'me-icon-list' : 'me-icon-tree'"></me-icon>
              </el-dropdown-item>
              <el-dropdown-item command="toggleKeySort" v-if="keyShowTree">
                <me-icon
                  :name="sortByCount ? t('keyMain.sortByAlphabet') : t('keyMain.sortByCount')"
                  icon="me-icon-alphabet"></me-icon>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 右侧: 关闭多选 （多选时显示） -->
      <div class="me-flex" v-else style="width: 30px">
        <me-icon
          :name="t('keyMain.exitCheckedMode')"
          icon="el-icon-circle-close"
          @click="toggleChecked"
          hint
          class="icon-btn footer-btn"
          placement="top" />
      </div>
    </div>

    <!-- 字段新增、批量删除键、目录内存分析 -->
    <FieldAdd ref="fieldAddRef" @success="addKeyOk" />
    <KeyBatch ref="keyBatchRef" @success="batchKeyOk" />
    <KeyImport ref="keyImportRef" @success="importStart" />
    <KeyMemory ref="keyMemoryRef" />
    <TTLSet ref="ttlSetRef" />
  </div>
</template>

<style scoped lang="scss">
.key-main {
  //border: 2px solid red;
  flex-grow: 1;

  .empty {
    height: 100%;
    border: 1px solid var(--el-border-color);
  }

  .key-header {
    :deep(.el-tag) {
      border-color: var(--el-border-color);
    }

    // 复选框显示尽量为方形
    :deep(.el-input-group__prepend) {
      padding: 0 10px 0 0;
    }

    // 查询和新增key不收缩，避免调整侧边栏宽度时变为两行
    :deep(.el-input-group__append) {
      flex-shrink: 0;
    }
  }

  // 滚动条显示在键的区域，而不是整个左侧区域
  // 原理：需要指定下高度。此处指定为0，弹性扩展
  height: 0;

  margin-top: 10px;
  display: flex;
  flex-direction: column;

  .key-list {
    flex-grow: 1;
    border: 1px solid var(--el-border-color);
    border-top: none;
    border-bottom: none;

    height: 100%;
    padding: 5px;
    overflow: hidden; // 隐藏水平滚动条，仅显示竖直滚动条

    :deep(.el-link) {
      font-size: 12px;
    }
  }

  .key-footer {
    height: 30px;
    border: 1px solid var(--el-border-color);
    border-top: none;

    //margin-top: 5px;
    //padding-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    :deep(.el-select__wrapper) {
      min-height: 0;
      height: 30px;
      padding: 4px 4px 4px 10px;
      //border-bottom-left-radius: 0;
      //box-shadow: 0 0 0 1px var(--el-border-color);
    }

    .tip {
      white-space: nowrap;
    }

    .footer-btn {
      font-size: 20px;
    }

    :deep(.el-select-dropdown__item) {
      padding: 0 20px 0 20px;
    }
  }

  /* 选中的键 */
  :deep(.choose-key) {
    background-color: var(--el-color-info-light-8);
  }
}
</style>
