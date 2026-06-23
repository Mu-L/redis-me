<script setup lang="ts">
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useStorage } from '@vueuse/core'
import { sortBy } from 'lodash'
import { minimatch } from 'minimatch'
import { computed, inject, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type { RedisDB, RedisKey_Deserialize, ScanCursor } from '@/types/tauri-specta'
import { clearKeyTypeCacheForConn } from '@/utils/key-type-cache'
import {
  bus,
  CONN_REFRESH,
  INFO_REFRESH,
  KEY_DELETE,
  KEY_REFRESH,
  KEY_TYPE_LIST,
  meConfirm,
  meCommands,
  meCopy,
  meDeleteKey,
  meKeyShort,
  meOk,
  mePrompt,
  sleep,
} from '@/utils/util'
import FieldAdd from '@/views/ext/FieldAdd.vue'
import TTLSet from '@/views/ext/TTLSet.vue'
import KeyImport from '@/views/key/KeyImport.vue'
import KeyRename from '@/views/key/KeyRename.vue'

import KeyBatch from './key/KeyBatch.vue'
import KeyMemory from './key/KeyMemory.vue'
import KeyTree from './key/KeyTree.vue'

interface ImportExportProgressPayload {
  id: string
  okCount: number
  errCount: number
  ignoreCount: number
  totalCount: number
  finished: boolean
}

const { t } = useI18n()
const share = inject(shareProvideKey)!
const canEdit = computed(() => !share.readonly)

async function refresh(): Promise<void> {
  if (!share.conn) return
  await syncDbToVisibleList()
  initReset()
  await scanKey()
}
onMounted(async () => {
  await refreshDbList()
  await refresh()
})

function initReset(): void {
  keyType.value = 'ALL'
  exact.value = false
  keyword.value = ''
  keyList.value = []
  share.redisKey = null
}

const keyType = ref('ALL')
const keyTypeTag = computed(() => {
  const v = keyType.value
  if (v === 'ALL') return { value: 'ALL' as const, type: 'info' as const }
  return KEY_TYPE_LIST.find(k => k.value === v) ?? { value: v, type: 'info' as const }
})
function chooseKeyType(keyTypeSelected: string): void {
  keyType.value = keyTypeSelected
  keyword.value = ''
  void scanKey(false, false)
}

const exact = ref(false)
const keyword = ref('')
const loading = ref(false)
const loadFolder = ref(false)
const scanCancelled = ref(false) // 扫描是否被取消

function cancelScanning() {
  scanCancelled.value = true
}

// 搜索历史记录
const SEARCH_HISTORY_KEY = 'redis-me:search-history'
const searchHistory = useStorage<string[]>(SEARCH_HISTORY_KEY, [])
const showHistory = ref(false)
let historyHideTimer: ReturnType<typeof setTimeout> | null = null

// 过滤后的搜索历史（输入时实时过滤）
const filteredSearchHistory = computed(() => {
  const k = keyword.value.toLowerCase().trim()
  if (!k) return searchHistory.value
  return searchHistory.value.filter(h => h.toLowerCase().includes(k))
})

function addSearchHistory(query: string) {
  if (!query || query === '*' || loadFolder.value) return
  const trimmed = query.trim()
  if (!trimmed) return
  searchHistory.value = [trimmed, ...searchHistory.value.filter(h => h !== trimmed)].slice(0, 10)
}

function removeSearchHistory(item: string) {
  searchHistory.value = searchHistory.value.filter(h => h !== item)
}

function clearSearchHistory() {
  searchHistory.value = []
}

function selectHistory(item: string) {
  keyword.value = item
  showHistory.value = false
  void scanKey(false, false)
}

function handleInputFocus() {
  showHistory.value = true
}

function handleInputBlur() {
  historyHideTimer = setTimeout(() => {
    showHistory.value = false
  }, 150)
}

function handleHistoryMouseDown() {
  if (historyHideTimer) {
    clearTimeout(historyHideTimer)
    historyHideTimer = null
  }
}

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
const cursor = ref<ScanCursor | null>(null)

const keyList = ref<RedisKey_Deserialize[]>([])
const filterKeyList = computed(() => {
  const key = keyword.value.trim()
  if (!key) return keyList.value
  // 使用 minimatch 做 Redis 风格的 glob 匹配：
  // - nobrace: true  禁用 {a,b} 扩展（Redis 不支持 brace expansion）
  // - noglobstar: true  将 ** 视为两个 *（Redis 没有多级目录递归概念）
  // - noext: true  禁用 +(a|b) 等 extglob（Redis 不支持）
  // - nocase: true  忽略大小写，与 Redis 默认行为一致
  return keyList.value.filter(k =>
    // 此处用match，而不是key。是为了过滤时还是包含比较好
    minimatch(k.key, match.value, { nobrace: true, noglobstar: true, noext: true, nocase: true }),
  )
})

// 搜索自动加载的停止阈值：使用设置中的 keyScanCount
const SCAN_FETCH_COUNT = computed(() => meTauri.settings.keyScanCount as number)

// 扫描键
async function scanKey(useCursor = false, loadAll = false): Promise<void> {
  if (loading.value || !share.conn) return

  loading.value = true
  scanCancelled.value = false // 每次扫描都重置取消标志
  try {
    if (!useCursor) {
      addSearchHistory(keyword.value)
      cursor.value = null
    }

    const firstScanKeys = await scanKeyCore(useCursor)

    // loadAll=false 时自动继续加载（达到阈值停止）
    if (!loadAll) {
      await scanKeyAuto(firstScanKeys)
    } else {
      await scanKeyAll()
    }
  } finally {
    loading.value = false
  }
}

// 核心：执行一次 SCAN 请求，返回新扫描的 key 数量
async function scanKeyCore(useCursor = false): Promise<number> {
  const params = {
    match: match.value,
    type: keyType.value === 'ALL' ? '' : keyType.value.toLowerCase(),
    cursor: cursor.value,
  }

  // 延迟一下，方便观察加载过程（不要删除，未来还是测试验证）
  // await new Promise(r => setTimeout(r, 5000))

  const data = await meCommands.scan(share.conn!.id, params)
  cursor.value = data.cursor

  // useCursor=false 时替换列表（新搜索），useCursor=true 时追加结果（加载更多）
  const newKeyList = useCursor ? [...keyList.value, ...data.keyList] : data.keyList
  keyList.value = sortBy(newKeyList, ['key'])
  return data.keyList.length
}

// 自动加载：递归执行直到满足停止条件（async/await 不会栈溢出）
async function scanKeyAuto(fetchedCount: number = 0): Promise<void> {
  if (!cursor.value || cursor.value.finished) return
  if (scanCancelled.value) return
  if (fetchedCount >= SCAN_FETCH_COUNT.value) return

  const newKeys = await scanKeyCore(true)
  await scanKeyAuto(fetchedCount + newKeys)
}

// 加载全部：递归执行直到扫描完成（async/await 不会栈溢出）
async function scanKeyAll(): Promise<void> {
  if (!cursor.value || cursor.value.finished) return
  if (scanCancelled.value) return

  await scanKeyCore(true)
  await scanKeyAll() // 继续递归
}

onMounted(() => {
  bus.on(KEY_DELETE, deleteKey)
  bus.on(CONN_REFRESH, refresh)
})
onUnmounted(() => {
  bus.off(KEY_DELETE, deleteKey)
  bus.off(CONN_REFRESH, refresh)
})

function deleteKey(redisKey: RedisKey_Deserialize): void {
  keyList.value = keyList.value.filter(rk => rk.bytes !== redisKey.bytes)
  share.redisKey = null
}

const dbList = ref<RedisDB[]>([])

/** 当前 db 不在可见列表时切到第一项，并同步 Redis SELECT */
async function syncDbToVisibleList(): Promise<boolean> {
  if (!share.conn || dbList.value.length === 0) return false
  const prevDb = share.conn.db
  if (dbList.value.some(d => d.db === prevDb)) return false
  share.conn.db = dbList.value[0].db
  await meCommands.selectDb(share.conn.id, share.conn.db)
  return true
}

async function refreshDbList(): Promise<boolean> {
  if (!share.conn) return false
  let list = await meCommands.dbList(share.conn!.id)
  // meta.dbShowLimit：下拉只显示 db0 .. db(N-1)，未设则不限制
  const limit = share.conn.meta?.dbShowLimit
  if (typeof limit === 'number' && limit > 0) {
    list = list.filter(d => d.db < limit)
  }
  dbList.value = list
  return syncDbToVisibleList()
}

async function onDbShowLimitChange(val: number | undefined | null): Promise<void> {
  if (!share.conn) return
  share.conn.meta ??= {}
  if (typeof val === 'number' && val > 0) {
    share.conn.meta.dbShowLimit = val
  } else {
    delete share.conn.meta.dbShowLimit
  }
  const dbChanged = await refreshDbList()
  if (dbChanged) await refresh()
}

async function selectDB(): Promise<void> {
  if (!share.conn) return
  await meCommands.selectDb(share.conn!.id, share.conn.db)
  await refresh()
}

const keyPrefix = ref('')

// 选中键
function chooseKey(redisKey: RedisKey_Deserialize): void {
  keyPrefix.value = redisKey.key + '-copy'
  share.redisKey = redisKey
  share.tabName = 'value'
  bus.emit(KEY_REFRESH)
}

function chooseFolder(folder: string): void {
  keyPrefix.value = folder + ':'
}

function contextKey(command: string, redisKey: RedisKey_Deserialize): void {
  if (!share.conn) return
  if (command === 'refreshKey') {
    void scanKey(false, false)
  } else if (command === 'reloadKey') {
    chooseKey(redisKey)
  } else if (command === 'addKey') {
    keyPrefix.value = redisKey.key + '-copy'
    addKey()
  } else if (command === 'copyKey') {
    meCopy(redisKey.key)
  } else if (command === 'deleteKey') {
    meDeleteKey(share.conn!.id, redisKey)
  } else if (command === 'renameKey') {
    keyRenameRef.value?.open({ redisKey })
  } else if (command === 'checkedMode') {
    enterCheckedMode()
  } else if (command === 'exitCheckedMode') {
    exitCheckedMode()
  } else {
    meOk(`TODO: ${command}`)
  }
}

function contextFolder(command: string, folder: string): void {
  if (!share.conn) return
  if (command === 'refreshKey') {
    void scanKey(false, false)
  } else if (command === 'addKey') {
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
  } else if (command === 'checkedMode') {
    enterCheckedMode()
  } else if (command === 'exitCheckedMode') {
    exitCheckedMode()
  } else {
    meOk(`TODO: ${command}`)
  }
}

const keyRenameRef = useTemplateRef<InstanceType<typeof KeyRename>>('keyRenameRef')

const fieldAddRef = useTemplateRef<InstanceType<typeof FieldAdd>>('fieldAddRef')

function addKey(): void {
  fieldAddRef.value?.open({ mode: 'key', key: { key: keyPrefix.value, bytes: '' } })
}

const keyTreeRef = useTemplateRef<InstanceType<typeof KeyTree>>('keyTreeRef')
function addKeyOk(redisKey: RedisKey_Deserialize): void {
  keyList.value.unshift(redisKey)
  chooseKey(redisKey)
  nextTick(() => {
    keyTreeRef.value?.setCurrentKey(redisKey)
  })
  bus.emit(INFO_REFRESH)
}

const keyBatchRef = useTemplateRef<InstanceType<typeof KeyBatch>>('keyBatchRef')
function deleteFolder(folder: string): void {
  const matchExpr = folder === '*' ? '*' : folder + ':*'
  keyBatchRef.value?.open({ match: matchExpr, keyList: [] }, 'delete')
}
function exportFolder(folder: string): void {
  const matchExpr = folder === '*' ? '*' : folder + ':*'
  keyBatchRef.value?.open({ match: matchExpr, keyList: [] }, 'export')
}

function batchKeyOk(mode: string): void {
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

const keyImportRef = useTemplateRef<InstanceType<typeof KeyImport>>('keyImportRef')
function importData(isCmdFile: boolean = false): void {
  keyImportRef.value?.open(isCmdFile)
}
function importStart(): void {
  share.exportImportingPercentage = 0
  share.exportImporting = true
  share.exportImportingTip = t('keyMain.importing')
  tauriListen('import')
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let unlisten: UnlistenFn | null = null
async function tauriListen(eventName: 'export' | 'import'): Promise<void> {
  unlisten = await listen<ImportExportProgressPayload>(eventName, event => {
    const payload = event.payload
    if (!share.conn || payload.id !== share.conn!.id) return
    share.exportImportingPercentage = Math.round(
      ((payload.okCount + payload.errCount + payload.ignoreCount) / payload.totalCount) * 100,
    )

    if (payload.finished) {
      tauriUnlisten()
      share.exportImportingPercentage = 100
      share.exportImporting = false
      meOk(
        t(`keyMain.${eventName}Result`, payload as unknown as Record<string, unknown>),
        true,
        t(`keyMain.${eventName}Done`),
      )

      // 导入完成后刷新键列表与连接信息
      if (eventName === 'import') {
        void scanKey(false, false)
        bus.emit(INFO_REFRESH)
      }
    }
  })
}

function tauriUnlisten(): void {
  if (unlisten) {
    unlisten()
    unlisten = null
  }
}
onUnmounted(() => tauriUnlisten())
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const keyMemoryRef = useTemplateRef<InstanceType<typeof KeyMemory>>('keyMemoryRef')
function keyMemory(folder: string): void {
  keyMemoryRef.value?.open({ match: folder + ':*' })
}

// 键显示类型: tree/list; 树形列表排序方式: 字母排序/数量排序
const keyShowTree = computed({
  get() {
    return meTauri.settings.keyShow === 'tree'
  },
  set(newValue: boolean) {
    meTauri.settings.keyShow = newValue ? 'tree' : 'list'
  },
})

const sortByCount = computed({
  get() {
    return meTauri.settings.keySort === 'count'
  },
  set(newValue: boolean) {
    meTauri.settings.keySort = newValue ? 'count' : 'alphabet'
  },
})
async function handleCommand(command: string): Promise<void> {
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

function flushDb(): void {
  if (!share.conn) return
  meConfirm(t('keyMain.flushDbConfirm'), async () => {
    await meCommands.flushDb(share.conn!.id)
    clearKeyTypeCacheForConn(share.conn!.id)
    meOk(t('keyMain.flushDbOk'))
    bus.emit(CONN_REFRESH)
    bus.emit(INFO_REFRESH)
  })
}

async function mockData(): Promise<void> {
  if (!share.conn) return
  mePrompt(
    t('keyHeader.mockHint'),
    {
      inputValue: '100',
      inputType: 'number',
      inputValidator: value => {
        const n = Number(value)
        if (n < 1 || n > 10000) {
          return t('keyHeader.mockValidator')
        }
        return true
      },
    },
    async ({ value }) => {
      let total = Number(value)
      share.exportImportingPercentage = 0
      share.exportImporting = true
      share.exportImportingTip = t('keyHeader.mocking')

      try {
        let remaining = total
        while (remaining > 0) {
          const count = Math.min(remaining, 10)
          await meCommands.mockData(share.conn!.id, count)
          remaining -= count
          share.exportImportingPercentage = Math.round(((total - remaining) / total) * 100)
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
const checkedKeyList = ref<RedisKey_Deserialize[]>([])

function toggleChecked(): void {
  showCheckbox.value = !showCheckbox.value
  checkedKeyList.value = []
}

function enterCheckedMode(): void {
  if (showCheckbox.value) return
  showCheckbox.value = true
  checkedKeyList.value = []
}

function exitCheckedMode(): void {
  if (!showCheckbox.value) return
  showCheckbox.value = false
  checkedKeyList.value = []
}

function checkChange(redisKeys: RedisKey_Deserialize[]): void {
  checkedKeyList.value = redisKeys
}

// 多选后的批量操作
const checkedDisabled = computed(() => checkedKeyList.value.length === 0 || share.exportImporting)
const checkedBtnClass = computed(() => (checkedDisabled.value ? ['icon-disabled'] : ['icon-btn']))
function exportChecked() {
  keyBatchRef.value?.open({ match: '', keyList: checkedKeyList.value }, 'export')
}

const ttlSetRef = useTemplateRef<InstanceType<typeof TTLSet>>('ttlSetRef')
function ttlChecked(): void {
  ttlSetRef.value?.open({ keyList: checkedKeyList.value })
}

function deleteChecked(): void {
  keyBatchRef.value?.open({ match: '', keyList: checkedKeyList.value }, 'delete')
}

function editDbName(db: number): void {
  if (!share.conn) return
  mePrompt(
    t('keyMain.editDbName', { index: db }),
    {
      inputValue: String(share.conn.meta?.['db' + db] ?? ''),
      inputPlaceholder: t('keyMain.editDbNamePlaceholder'),
    },
    ({ value }) => {
      share.conn!.meta ??= {}
      share.conn!.meta['db' + db] = value
    },
  )
}
</script>

<template>
  <div class="key-main">
    <div class="key-header">
      <el-input
        v-model="keyword"
        :readonly="loading"
        :placeholder="t('keyMain.keyword')"
        @keyup.enter="scanKey(false, false)"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        clearable>
        <template #prepend>
          <el-dropdown placement="bottom-start" @command="chooseKeyType">
            <el-tag
              :type="keyTypeTag.type"
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
          <el-tooltip :content="t('keyMain.exactSearch')" placement="bottom" raw-content>
            <el-checkbox size="small" v-model="exact" style="margin-left: 10px" />
          </el-tooltip>
        </template>
        <template #append>
          <el-button-group>
            <me-button
              :info="loading ? t('keyMain.scanning') : t('keyMain.refreshKey')"
              @click="scanKey(false, false)"
              :icon="loading ? 'el-icon-loading' : 'el-icon-search'"
              :loading="loading"
              placement="bottom" />
            <me-button
              :info="loading ? t('keyMain.stopScan') : t('keyMain.addKey')"
              @click="loading ? cancelScanning() : addKey()"
              style="border-color: var(--el-button-border-color)"
              v-if="canEdit"
              :icon="loading ? 'me-icon-stop' : 'el-icon-plus'"
              placement="bottom" />
          </el-button-group>
        </template>
      </el-input>
    </div>

    <div class="key-list">
      <KeyTree
        ref="keyTreeRef"
        :show-checkbox="showCheckbox"
        :filter-key-list="filterKeyList"
        :redis-key="share.redisKey"
        :key-show-tree="keyShowTree"
        :sort-by-count="sortByCount"
        :color="share.color"
        :loading="loading"
        @chooseKey="chooseKey"
        @contextKey="contextKey"
        @chooseFolder="chooseFolder"
        @contextFolder="contextFolder"
        @checkChange="checkChange" />

      <!-- 搜索历史记录下拉  -->
      <div
        class="search-history-dropdown"
        v-if="showHistory && filteredSearchHistory.length > 0"
        @mousedown.prevent="handleHistoryMouseDown">
        <div
          v-for="(item, index) in filteredSearchHistory"
          :key="index"
          class="history-item"
          @click="selectHistory(item)">
          <span class="history-text">{{ item }}</span>
          <span class="history-delete" @click.stop="removeSearchHistory(item)">×</span>
        </div>
        <div class="history-clear" @click="clearSearchHistory">
          {{ t('keyMain.clearHistory') }}
        </div>
      </div>
    </div>

    <div class="key-footer">
      <!-- 左侧: 数据库|游标 -->
      <div class="me-flex" v-if="!showCheckbox && share.conn">
        <el-select
          v-model="share.conn.db"
          @change="selectDB"
          style="width: 120px"
          filterable
          v-if="!share.conn.cluster">
          <template #header>
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding: 4px 8px;
                font-size: 12px;
              ">
              <span>{{ t('keyMain.dbShowLimit') }}</span>
              <el-input-number
                :model-value="share.conn.meta?.dbShowLimit as number | undefined"
                :min="1"
                :controls="false"
                clearable
                size="small"
                style="width: 72px"
                @update:model-value="onDbShowLimitChange" />
            </div>
          </template>
          <!-- label for filterable -->
          <el-option
            v-for="item in dbList"
            :key="item.db"
            :value="item.db"
            :label="'db' + item.db + (share.conn?.meta?.['db' + item.db] || '')">
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
            class="icon-btn"
            @click="scanKey(true, false)" />
          <me-icon
            :name="t('keyMain.loadAll')"
            icon="me-icon-load-all"
            hint
            placement="top"
            class="icon-btn"
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
          class="icon-btn"
          @click="toggleChecked"
          placement="top"
          :name="t('keyMain.checkedMode')"
          hint />
        <el-dropdown placement="top-end" @command="handleCommand" style="margin: 5px">
          <me-icon icon="el-icon-more-filled" class="icon-btn" />
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
          class="icon-btn"
          placement="top" />
      </div>
    </div>

    <!-- 字段新增、批量删除键、目录内存分析 -->
    <FieldAdd ref="fieldAddRef" @success="addKeyOk" />
    <KeyBatch ref="keyBatchRef" @success="batchKeyOk" />
    <KeyImport ref="keyImportRef" @success="importStart" />
    <KeyMemory ref="keyMemoryRef" />
    <TTLSet ref="ttlSetRef" />
    <KeyRename ref="keyRenameRef" />
  </div>
</template>

<style scoped lang="scss">
.key-main {
  //border: 2px solid red;
  flex-grow: 1;
  position: relative;

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

    // :deep(.el-button) {
    //   padding: 8px 12px;
    // }

    // loading 图标旋转动画
    :deep(.el-button .is-loading) {
      animation: rotating 1s linear infinite !important;
      background-color: unset;
    }

    // loading时不添加背景色
    :deep(.el-button.is-loading:before) {
      background-color: unset;
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
    position: relative;

    height: 100%;
    padding: 5px;
    overflow: hidden; // 隐藏水平滚动条，仅显示竖直滚动条

    :deep(.el-link) {
      font-size: 12px;
    }

    .search-history-dropdown {
      position: absolute;
      // top: 100%;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 100;
      background-color: color-mix(in srgb, var(--el-bg-color) 70%, transparent);
      border: 1px solid var(--el-border-color);
      border-top: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      max-height: 300px;
      overflow-y: auto;

      .history-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
        color: var(--el-text-color-regular);

        &:hover {
          background-color: var(--el-color-info-light-8);
        }

        .history-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-delete {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: var(--el-text-color-secondary);
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;

          &:hover {
            color: var(--el-color-danger);
            background-color: var(--el-color-danger-light-9);
          }
        }
      }

      .history-clear {
        padding: 8px 12px;
        text-align: center;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        border-top: 1px solid var(--el-border-color-lighter);
        cursor: pointer;

        &:hover {
          color: var(--el-color-primary);
        }
      }
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

    :deep(.icon-btn) {
      font-size: 20px;
    }

    :deep(.icon-disabled) {
      font-size: 20px;
    }

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
