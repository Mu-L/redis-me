<script setup lang="ts">
import dayjs from 'dayjs'
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watchEffect,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type {
  BytesFormat,
  FieldScanResult,
  RedisFieldDel_Deserialize,
  RedisKey_Deserialize,
  ScanCursor,
  XInfoGroup,
} from '@/types/tauri-specta'
import {
  bus,
  BYTES_FORMAT,
  EXT_FORMAT,
  KEY_DELETE,
  KEY_REFRESH,
  meCommands,
  meCopy,
  meDeleteKey,
  meHumanSeconds,
  meHumanSize,
  meJsonFormat,
  meJsonNormal,
  meOk,
  meType,
} from '@/utils/util'
import TableGroup from '@/views/ext/TableGroup.vue'
import TTLSet from '@/views/ext/TTLSet.vue'
import KeyRename from '@/views/key/KeyRename.vue'

import FieldAdd from '../ext/FieldAdd.vue'
import FieldSet from '../ext/FieldSet.vue'

const { t } = useI18n()

type FieldScanViewState = FieldScanResult & { newValue: string }

function toViewState(data: FieldScanResult): FieldScanViewState {
  return { ...data, newValue: '' }
}

/** fieldScan 的 `value` 在 Specta 中为 serde 联合类型，表格/拼接按行数组处理 */
function fieldValueRows(v: unknown): unknown[] {
  return v as unknown[]
}

const onKeyRefreshBus = () => {
  bytesFormat.value = 'utf8'
  void refreshKey()
}

// 刷新键（mitt 载荷为 undefined，与 refreshKey 多参签名分离）
onMounted(() => bus.on(KEY_REFRESH, onKeyRefreshBus))
onUnmounted(() => bus.off(KEY_REFRESH, onKeyRefreshBus))

// 共享数据
const share = inject(shareProvideKey)!
const canEdit = computed(() => !share.readonly)
const canSave = computed(() => canEdit.value && (stringType.value || jsonType.value))

// 值的显示方式
const viewTypeList = ['json', 'table']
const viewType = ref('json')
const hashKey = ref('')
const isPretty = ref(true)
const withHashKey = ref(false)
const tableKeyword = ref('')
const redisValue = ref<FieldScanViewState | null>(null)
const cursor = ref<ScanCursor | null>(null) // 新增游标，支持list/hash/set/zset的扫描，避免一次性获取所有数据
const loading = ref(false)
const suppressCodeUpdate = ref(false)
/** 每次 fieldScan 成功后递增，用于强制 me-code 与服务器内容同步（未保存编辑时 modelValue 字符串可能与上次相同，子组件 watch 不触发） */
const valueEditorRemountKey = ref(0)

/** 值表格行（fieldScan 各类型字段混合） */
type ValueTableRow = Record<string, unknown> & {
  key?: string
  value?: unknown
  id?: string
  score?: number
  ttl?: number
}

// 处理CodeMirror的更新事件
function onCodeUpdate(newValue: string) {
  if (suppressCodeUpdate.value || !redisValue.value) return
  redisValue.value.newValue = newValue
}

// 刷新值的扩展参数
const meta = ref({
  maxId: '',
  minId: '',
})

// 计算属性
const hashType = computed(() => 'hash' === redisValue.value?.type)
const stringType = computed(() => 'string' === redisValue.value?.type)
const jsonType = computed(() => 'json' === redisValue.value?.type)
const streamType = computed(() => 'stream' === redisValue.value?.type)
const stringTypeOrWithHashKey = computed(
  () => 'string' === redisValue.value?.type || withHashKey.value,
)

const formatOptions = computed(() => {
  const base = BYTES_FORMAT.map(item => ({
    label: item,
    value: item.toLowerCase() as BytesFormat,
    disabled: false,
  }))
  const ext = EXT_FORMAT.map(label => ({
    label,
    value: label.toLowerCase() as BytesFormat,
    disabled: !stringType.value,
  }))
  return [...base, ...ext]
})
const showValue = computed(() => {
  const obj = redisValue.value?.value
  if (obj === null || obj === undefined) return ''

  if (isPretty.value) {
    if (stringTypeOrWithHashKey.value) {
      const str = streamType.value ? JSON.stringify(obj) : obj.toString()
      try {
        return str.startsWith('{') || str.startsWith('[')
          ? meJsonFormat(str) // 格式化支持非标json
          : str
      } catch {
        return str
      }
    } else {
      return JSON.stringify(obj, null, 2)
    }
  } else {
    return ('hash' === redisValue.value?.type && !withHashKey.value) ||
      'zset' === redisValue.value?.type || // zset包含分数
      'json' === redisValue.value?.type ||
      'stream' === redisValue.value?.type
      ? JSON.stringify(obj)
      : obj.toString()
  }
})

// 加载更多(手动控制，而不是计算属性，避免cursor变化多次导致按钮闪现又丢失)
const showMore = ref(false)

// 表格数据
const dataList = computed(() => {
  const rv = redisValue.value
  if (rv === null || rv === undefined || rv.value === null || rv.value === undefined) return []

  const data: ValueTableRow[] = []

  if (rv.type === 'list' || rv.type === 'set') {
    fieldValueRows(rv.value).forEach(value => data.push({ value }))
  } else if (rv.type === 'zset' || rv.type === 'stream' || rv.type === 'hash') {
    fieldValueRows(rv.value).forEach(value => data.push(value as ValueTableRow)) // 返回的直接是[{score: '', value: ''}]
  }
  return data
})

const filterDataList = computed(() => {
  const key = tableKeyword.value.toLowerCase()
  return dataList.value.filter(row => {
    if (!key) return true
    if ((row.key?.toLowerCase() ?? '').indexOf(key) > -1) return true
    if ((row.id?.toLowerCase() ?? '').indexOf(key) > -1) return true
    const cell = streamType.value ? JSON.stringify(row.value) : String(row.value ?? '')
    if (cell.toLowerCase().indexOf(key) > -1) return true
    if ((row.score?.toString() ?? '').toLowerCase().indexOf(key) > -1) return true
    return false
  })
})

// 监听属性
watchEffect(() => {
  if (stringTypeOrWithHashKey.value || jsonType.value) {
    viewType.value = 'json'
  }
})

// TTL设置
let timer: ReturnType<typeof setInterval> | null = null
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
async function setTimer(seconds: number) {
  const rv = redisValue.value
  if (!rv) return
  rv.ttl = seconds
  if (timer !== null) clearInterval(timer)
  timer = null
  if (rv.ttl > 0) {
    timer = setInterval(() => {
      const cur = redisValue.value
      if (cur && cur.ttl > 0) {
        cur.ttl--
      }
    }, 1000)
  }
}

function resetParam() {
  tableKeyword.value = ''
  hashKey.value = ''
  withHashKey.value = false
}
async function refreshKey(
  reset: boolean = true,
  useCursor: boolean = false,
  loadAll: boolean = false,
) {
  fieldSetInit() // 关闭字段编辑
  suppressCodeUpdate.value = true

  if (reset) {
    resetParam()
  }

  if (!useCursor) {
    cursor.value = null // 不使用游标时重置游标
  }

  loading.value = true
  try {
    const param = {
      key: share.redisKey!,
      hashKey: hashKey.value,
      count: meTauri.settings.fieldScanCount ?? 10,
      cursor: cursor.value,
      loadAll,
      meta: meta.value,
      bytesFormat: bytesFormat.value as BytesFormat,
    }

    const data = await meCommands.fieldScan(share.conn!.id, param)
    cursor.value = data.cursor
    withHashKey.value = !!hashKey.value

    if (useCursor) {
      const prev = redisValue.value
      if (
        prev &&
        (data.type === 'list' ||
          data.type === 'set' ||
          data.type === 'zset' ||
          data.type === 'hash' ||
          data.type === 'stream')
      ) {
        const a = fieldValueRows(prev.value)
        const b = fieldValueRows(data.value)
        const merged: unknown[] = [...a, ...b]
        ;(prev as { value: unknown }).value = merged
      } else {
        redisValue.value = toViewState(data)
      }
    } else {
      redisValue.value = toViewState(data)
    }

    showMore.value = !cursor.value?.finished
    const rvDone = redisValue.value
    if (rvDone) await setTimer(rvDone.ttl)
  } finally {
    loading.value = false
    if (redisValue.value) {
      redisValue.value.newValue = ''
    }
    suppressCodeUpdate.value = false
    valueEditorRemountKey.value++

    await nextTick(() => {
      if (jsonType.value) {
        bytesFormat.value = 'utf8'
      }
    })
  }
}

// 删除键
onMounted(() => bus.on(KEY_DELETE, deleteKey))
onUnmounted(() => bus.off(KEY_DELETE, deleteKey))

function deleteKey(_payload?: RedisKey_Deserialize) {
  redisValue.value = null
}

function delKey() {
  meDeleteKey(share.conn!.id, share.redisKey!)
}

const keyRenameRef = useTemplateRef<InstanceType<typeof KeyRename>>('keyRenameRef')
function renameKey() {
  if (!share.redisKey) return
  keyRenameRef.value?.open({ redisKey: share.redisKey })
}

// 保存值
async function setValue() {
  const rv = redisValue.value
  if (!rv) return
  let value = rv.newValue

  // json格式验证 ==> 前端暂不校验了，后端rust的校验可以精确提示第几行第几列错误
  try {
    if (jsonType.value || (stringType.value && bytesFormat.value === 'msgpack')) {
      value = meJsonNormal(value) // JSON / MsgPack 编辑区：支持 JSON5，落盘为严格 JSON
    }
  } catch {}

  const param = {
    key: share.redisKey!,
    value,
    ttl: rv.ttl,
    keyType: rv.type,
    inputFormat: bytesFormat.value,
  }
  await meCommands.set(share.conn!.id, param)
  meOk(t('saveOk'))
  await refreshKey()
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 更新TTL
const ttlSetRef = useTemplateRef('ttlSetRef')
function updateTTL() {
  if (!canEdit.value) return
  const rv = redisValue.value
  if (!rv) return

  ttlSetRef.value?.open({
    ttl: rv.ttl,
  })
}

// 字段新增
const fieldAddRef = useTemplateRef('fieldAddRef')
function fieldAdd() {
  const rv = redisValue.value
  if (!rv) return
  fieldAddRef.value?.open({
    mode: 'field',
    type: rv.type,
    valFmt: valueFmtForField(),
    key: { ...share.redisKey! },
  })
}

// 字段编辑
const fieldSetIndex = ref(-1)
const fieldSetRef = useTemplateRef('fieldSetRef')
function fieldSetInit() {
  fieldSetIndex.value = -1
  fieldSetRef.value?.close()
}
function fieldSet(row: ValueTableRow, index: number) {
  const rv = redisValue.value
  if (!rv) return
  fieldSetIndex.value = index
  const rowValStr = String(row.value ?? '')
  const params = {
    fieldKey: row.key || '',
    fieldValue: rowValStr,
    fieldScore: row.score || 0,
    fieldTtl: row.ttl ?? -1,
    srcFieldValue: rowValStr,
    type: rv.type,
    key: share.redisKey!,
    valFmt: valueFmtForField(),
    fieldIndex: -1,
  }
  if (rv.type === 'list') {
    // 此处不要直接取索引，而是重新去计算下（因为表格可能被关键字过滤过）
    params.fieldIndex = fieldValueRows(rv.value).indexOf(row.value)
  }
  fieldSetRef.value?.open(params)
}

function rowClassName({ row, rowIndex }: { row: ValueTableRow; rowIndex: number }) {
  return `table-row-index-${rowIndex}` // 给每行加一个带有索引的class
}

function rowClick(row: ValueTableRow, _column: unknown, event: MouseEvent) {
  // 编辑字段值没有开启时，忽略行点击事件
  if (fieldSetIndex.value === -1) return

  // 从点击事件的当前元素（即 <tr>）获取 class
  const trElement = event.currentTarget as HTMLElement | null
  if (!trElement) return
  const classList = trElement.classList
  for (let className of classList) {
    if (className.startsWith('table-row-index-')) {
      const rowIndex = Number.parseInt(className.split('-')[3]!, 10) // 提取索引数字
      fieldSet(row, rowIndex)
      break
    }
  }
}

// 字段删除
async function fieldDel(row: ValueTableRow) {
  const rv = redisValue.value
  if (!rv) return
  const param: RedisFieldDel_Deserialize = {
    fieldKey: row.key || '',
    fieldValue: String(row.value ?? ''),
    key: share.redisKey!,
    streamId: row.id || '',
    fieldIndex: -1,
  }
  if (rv.type === 'list') {
    param.fieldIndex = fieldValueRows(rv.value).indexOf(row.value)
  }

  if (rv.type === 'stream') {
    param.fieldValue = '' // 后端接收需要是String
  }

  await meCommands.fieldDel(share.conn!.id, param)
  meOk(t('deleteOk'))
  await refreshKey()
}

// Stream的ID转换为字符串时间
function streamIdToDate(id: string) {
  try {
    const timestamp = Number.parseInt(id.split('-')[0]!, 10)
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
  } catch {
    return 'format err'
  }
}

// Stream显示Groups
const groupDataList = ref<XInfoGroup[]>([])
const tableGroupVisible = ref(false)
async function showGroups() {
  groupDataList.value = await meCommands.xinfoGroups(share.conn!.id, share.redisKey!)
  tableGroupVisible.value = true
}

// 内存占用和条目
const textMemory = computed(() => {
  const sz = redisValue.value?.size
  return sz != null && sz > 0 ? t('redisValue.textMemory') + meHumanSize(sz) : ''
})
const textLength = computed(() => {
  const rv = redisValue.value
  if (!rv) return ''
  if (jsonType.value || (streamType.value && withHashKey.value)) return ''
  return stringTypeOrWithHashKey.value
    ? t('redisValue.textLength') + rv.length
    : t('redisValue.textEntries') +
        filterDataList.value.length +
        ' / ' +
        fieldValueRows(rv.value).length
})

// 查看此键所在节点
async function showSlot() {
  const data = await meCommands.keySlot(share.conn!.id, share.redisKey!)
  meOk(String(data), true, t('redisValue.slotTitle'))
}

// 查看此键所在节点
async function showLocation() {
  const data = await meCommands.keyNode(share.conn!.id, share.redisKey!)
  const msg = data.map(item => item.node + ' | ' + item.flags.toUpperCase()).join('<br>')
  meOk(msg, true, t('redisValue.locationTitle'), { dangerouslyUseHTMLString: true })
}

// 值显示方式: BYTES_FORMAT + EXT_FORMAT；EXT_FORMAT 项仅在 STRING 键上可选
const bytesFormat = ref<BytesFormat>('utf8')

/** 字段弹窗不用 MsgPack（仅整串 STRING 详情支持） */
function valueFmtForField(): BytesFormat {
  return bytesFormat.value === 'msgpack' ? 'utf8' : bytesFormat.value
}
// 键显示方式
const showKey = computed(() => {
  const rk = share.redisKey
  if (!rk) return ''
  // if (bytesFormat.value === 'utf8') return rk.key
  // return meFormatBytes(rk.bytes, bytesFormat.value)
  // 键显示暂时不跟随字节格式变化
  return rk.key
})

// 快捷键
const keyShortVisible = ref(false)
function openKeyShortDialog() {
  keyShortVisible.value = true
}
</script>

<template>
  <!-- 大部分Key都很快得到，element-loading-background设置为unset避免loading背景一闪而过，不友好  -->
  <div class="redis-value" v-loading="loading" element-loading-background="unset">
    <template v-if="share.redisKey && redisValue">
      <!-- 上方键 -->
      <div class="value-header">
        <!-- 键名称 -->
        <el-input type="text" v-model="showKey" readonly style="flex: 1">
          <template #prepend>
            <el-text :type="meType(redisValue.type)">{{ redisValue.type.toUpperCase() }}</el-text>
          </template>
          <template #append>
            <me-button
              :info="t('copy')"
              icon="el-icon-document-copy"
              @click="meCopy(showKey)"
              placement="top" />
          </template>
        </el-input>

        <!-- 哈希键 / StreamId -->
        <el-input
          type="text"
          :placeholder="t('redisValue.optional')"
          clearable
          style="width: 200px; margin-left: 10px"
          v-model="hashKey"
          v-if="hashType || streamType"
          @keyup.enter="refreshKey(false)">
          <template #prepend>{{
            streamType ? t('redisValue.streamId') : t('redisValue.hashKey')
          }}</template>
        </el-input>

        <!-- TTL, 刷新/编辑/删除 -->
        <div class="me-flex">
          <me-button
            icon="el-icon-timer"
            :info="canEdit ? t('redisValue.ttlHint') : t('redisValue.ttlHintReadonly')"
            placement="top"
            style="margin: 0 10px"
            @click="updateTTL">
            {{
              redisValue.ttl === -1 ? t('redisValue.ttlForever') : meHumanSeconds(redisValue.ttl)
            }}
          </me-button>

          <el-button-group>
            <me-button
              :info="t('redisValue.refreshKey')"
              icon="el-icon-refresh"
              placement="top"
              @click="refreshKey(false)" />
            <me-button
              :info="t('redisValue.renameKey')"
              icon="el-icon-edit"
              placement="top"
              @click="renameKey"
              v-if="canEdit" />
            <me-button
              :info="t('redisValue.deleteKey')"
              icon="el-icon-delete"
              placement="top"
              @click="delKey"
              v-if="canEdit" />
          </el-button-group>
        </div>
      </div>

      <!-- 中间值 -->
      <div class="value-main">
        <!-- json显示 -->
        <me-code
          v-if="viewType === 'json'"
          :key="valueEditorRemountKey"
          :modelValue="showValue"
          :mode="
            stringTypeOrWithHashKey && bytesFormat !== 'utf8' && bytesFormat !== 'msgpack'
              ? 'ignore'
              : 'json'
          "
          @update:modelValue="onCodeUpdate"
          :read-only="!canSave" />

        <!-- 表格显示 -->
        <div class="me-flex" style="flex-direction: column; height: 100%" v-else>
          <div class="me-flex" style="width: 100%">
            <!-- 左侧模糊筛选 -->
            <div>
              <el-input
                v-model="tableKeyword"
                :placeholder="t('redisValue.tableKeyword')"
                clearable
                :style="{ width: streamType ? '180px' : '300px' }" />
            </div>

            <div v-if="streamType">
              <el-input
                @keyup.enter="refreshKey(true)"
                v-model.trim="meta.maxId"
                placeholder="MaxId"
                clearable
                style="width: 180px" />
              <el-input
                @keyup.enter="refreshKey(true)"
                v-model.trim="meta.minId"
                placeholder="MinId"
                clearable
                style="width: 180px; margin-left: 10px" />
            </div>

            <!-- 右侧更多+插入行 -->
            <div>
              <el-button
                icon="el-icon-grid"
                @click="showGroups"
                style="margin-left: 10px"
                v-if="streamType">
                Groups
              </el-button>
              <el-button icon="el-icon-plus" @click="fieldAdd" style="margin-left: 10px">{{
                t('redisValue.insertRow')
              }}</el-button>
            </div>
          </div>
          <div class="table-view">
            <me-table
              layout="sizes, prev, pager, next, jumper"
              :data="filterDataList"
              border
              stripe
              ref="table"
              height="100%"
              :row-class-name="rowClassName"
              @row-click="rowClick">
              <el-table-column
                label="#"
                type="index"
                width="50"
                align="center"
                show-overflow-tooltip>
                <template #default="scope">
                  <div v-if="fieldSetIndex !== scope.$index">{{ scope.$index + 1 }}</div>
                  <me-icon
                    v-else
                    icon="el-icon-edit"
                    :style="{ color: share.color, display: 'block' }"></me-icon>
                </template>
              </el-table-column>

              <el-table-column
                :label="t('redisValue.id')"
                prop="id"
                show-overflow-tooltip
                v-if="redisValue.type === 'stream'">
                <template #default="scope">
                  <el-tooltip :content="streamIdToDate(scope.row.id)" placement="right">
                    {{ scope.row.id }}
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column
                :label="t('redisValue.key')"
                prop="key"
                show-overflow-tooltip
                v-if="redisValue.type === 'hash'" />
              <el-table-column :label="t('redisValue.value')" prop="value" show-overflow-tooltip>
                <template #default="scope">
                  {{ streamType ? JSON.stringify(scope.row.value) : scope.row.value }}
                </template>
              </el-table-column>
              <el-table-column
                :label="t('redisValue.ttl')"
                width="150"
                prop="ttl"
                v-if="redisValue.type === 'hash' && share.capabilities.hashFieldTtl">
                <template #default="scope">
                  {{ meHumanSeconds(scope.row.ttl) }}
                </template>
              </el-table-column>
              <el-table-column
                :label="t('redisValue.score')"
                prop="score"
                show-overflow-tooltip
                v-if="redisValue.type === 'zset'" />

              <el-table-column
                :label="t('action')"
                :width="canEdit ? (streamType ? 80 : 100) : 80"
                fixed="right"
                align="center">
                <template #default="scope">
                  <div class="me-flex" style="justify-content: space-around">
                    <me-icon
                      :info="t('copy')"
                      icon="el-icon-document-copy"
                      class="icon-btn"
                      @click.stop="
                        meCopy(streamType ? JSON.stringify(scope.row.value) : scope.row.value)
                      " />
                    <me-icon
                      :info="t('edit')"
                      icon="el-icon-edit"
                      class="icon-btn"
                      @click.stop="fieldSet(scope.row, scope.$index)"
                      v-if="canEdit && !streamType" />
                    <el-popconfirm
                      :hide-after="0"
                      :title="t('redisValue.deleteConfirm')"
                      @confirm.stop="fieldDel(scope.row)"
                      v-if="canEdit">
                      <template #reference>
                        <me-icon :info="t('delete')" icon="el-icon-delete" class="icon-btn" />
                      </template>
                    </el-popconfirm>
                  </div>
                </template>
              </el-table-column>
            </me-table>
            <!-- 字段编辑 -->
            <FieldSet
              ref="fieldSetRef"
              @success="refreshKey"
              @closed="fieldSetInit"
              class="field-set" />
          </div>
        </div>
      </div>

      <!-- 功能区 -->
      <div class="value-footer me-flex">
        <div class="me-flex" style="align-items: center">
          <!-- 美化/复制 -->
          <me-icon
            placement="top-start"
            :info="t('redisValue.prettyHint')"
            class="icon-btn"
            :style="{ color: isPretty ? 'var(--el-color-success)' : '' }"
            icon="el-icon-magic-stick"
            @click="isPretty = !isPretty" />

          <me-icon
            style="font-size: 18px; margin-left: 5px"
            :info="t('copy')"
            class="icon-btn"
            icon="el-icon-document-copy"
            @click="meCopy(showValue)"
            placement="top-start" />

          <me-icon
            class="icon-btn"
            icon="me-icon-keyshort"
            :info="t('redisValue.keyShortHint')"
            placement="top-start"
            @click="openKeyShortDialog"
            style="margin-left: 5px; font-size: 20px" />

          <!-- 键所在槽位和节点信息 -->
          <me-icon
            v-if="share.conn?.cluster"
            style="margin-left: 5px"
            :info="t('redisValue.slotHint')"
            class="icon-btn"
            icon="me-icon-slot"
            @click="showSlot"
            placement="top-start" />

          <me-icon
            v-if="share.conn?.cluster"
            style="margin-left: 5px"
            :info="t('redisValue.locationHint')"
            class="icon-btn"
            icon="el-icon-location"
            @click="showLocation"
            placement="top-start" />

          <el-divider direction="vertical" v-if="textMemory" />

          <!-- 内存占用 -->
          <el-text> {{ textMemory }} </el-text>

          <el-divider direction="vertical" v-if="textLength" />

          <!-- 长度/条目 -->
          <el-text> {{ textLength }}</el-text>
        </div>

        <div class="me-flex" style="position: relative">
          <el-select
            v-model="bytesFormat"
            :disabled="jsonType || streamType"
            style="width: 100px"
            @change="refreshKey(false)">
            <template #header>
              <el-text style="font-weight: bold">{{ t('redisValue.viewAs') }}</el-text>
            </template>
            <el-option
              v-for="item in formatOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.disabled" />
          </el-select>
          <!-- 加载更多、加载全部 -->
          <div class="me-flex" style="width: 45px; margin-left: 10px" v-if="showMore">
            <me-icon
              :name="t('redisValue.loadMore')"
              icon="me-icon-load-more"
              hint
              placement="top"
              class="icon-btn"
              @click="refreshKey(false, true, false)" />
            <me-icon
              :name="t('redisValue.loadAll')"
              icon="me-icon-load-all"
              hint
              placement="top"
              class="icon-btn"
              @click="refreshKey(false, true, true)" />
          </div>

          <!-- 保存 -->
          <me-button
            style="margin-left: 10px"
            :disabled="!redisValue?.newValue"
            v-if="canSave"
            :info="t('save')"
            type="primary"
            icon="me-icon-save"
            @click="setValue"
            placement="top" />

          <!-- string类型不显示，带有hashKey不显示 -->
          <el-segmented
            style="margin-left: 10px"
            v-model="viewType"
            :options="viewTypeList"
            v-if="!(stringTypeOrWithHashKey || jsonType)">
            <template #default="scope">
              <me-icon
                :name="t('redisValue.jsonView')"
                icon="me-icon-json"
                hint
                placement="top"
                v-if="scope.item === 'json'" />
              <me-icon
                :name="t('redisValue.tableView')"
                icon="me-icon-table"
                hint
                placement="top"
                v-else />
            </template>
          </el-segmented>
        </div>
      </div>
    </template>

    <!-- 未选择键时Empty显示 -->
    <el-empty v-else :description="t('redisValue.noKeySelected')"></el-empty>

    <!-- 更新TTL, 字段新增 -->
    <TTLSet ref="ttlSetRef" @success="setTimer" />
    <FieldAdd ref="fieldAddRef" @success="refreshKey" />
    <KeyRename ref="keyRenameRef" />

    <!-- Stream消费者组 -->
    <me-dialog title="Groups" icon="el-icon-coin" v-model="tableGroupVisible" width="900">
      <TableGroup :data-list="groupDataList" />
    </me-dialog>

    <!-- 值编辑器快捷键 -->
    <el-dialog
      v-model="keyShortVisible"
      width="400"
      align-center
      draggable
      :show-close="false"
      style="--el-dialog-bg-color: unset; box-shadow: unset">
      <el-text type="warning" size="large" v-html="t('redisValue.keyShortMore')"> </el-text>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.redis-value {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  .value-header {
    :deep(.el-input-group__prepend) {
      padding: 0 16px;
    }
    :deep(.el-input-group__append) {
      padding: 0 18px;
    }

    display: flex;
    justify-content: space-between;
  }

  .value-main {
    margin: 10px 0 5px 0;
    position: relative;
    flex-grow: 1;
    overflow: hidden;

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

  .value-footer {
    height: 30px;
    font-size: 20px;

    :deep(.el-select__wrapper) {
      min-height: 0;
      height: 30px;
      padding: 4px 4px 4px 10px;
      //box-shadow: 0 0 0 1px var(--el-border-color);
    }

    :deep(.el-select-dropdown__item) {
      padding: 0 20px 0 20px;
    }
  }
}
</style>
