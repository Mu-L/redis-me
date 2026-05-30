<script setup lang="ts">
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  useTemplateRef,
  watchEffect,
} from 'vue'
import { useI18n } from 'vue-i18n'

import MeWebsite from '@/components/MeWebsite.vue'
import { infoTip as tips } from '@/locales/info'
import { shareProvideKey } from '@/types/me-interface'
import { bus, INFO_REFRESH, meCommands, enrichNodeList } from '@/utils/util'
import RedisClient from '@/views/tab/RedisClient.vue'
import RedisConfig from '@/views/tab/RedisConfig.vue'

import NodeList from '../ext/NodeList.vue'

const { t } = useI18n()
const tipMap = computed(() => tips.value as Record<string, string | undefined>)
// 共享数据
const share = inject(shareProvideKey)!

// 数据
const node = ref('') // 指定节点
const raw = ref('') // 原始信息
const dic = ref<Record<string, string>>({}) // 字典形式
const tagList = ref<string[]>([]) // 标签名列表
/** 标签形式：tag 分类名、键名、值 */
const tagTable = ref<{ key: string; value: string; tag: string }[]>([])
const keyCount = ref(0) // 键数量
const keyword = ref('') // 关键字过滤
const tagSelected = ref('') // 选中的标签
const dialog = reactive({
  raw: false,
  client: false,
  config: false,
  memory: false,
  topology: false,
})
const loading = ref(false)
const config = ref<Record<string, string>>({})
const rdbChecked = computed(() => !!config.value['save'])
const aofChecked = computed(() => dic.value['aof_enabled'] === '1')
const rdbTooltip = computed(() => config.value['save'] || t('redisInfo.rdbDisabled'))
const cacheRatio = computed(() => {
  try {
    const ratio =
      parseInt(dic.value['keyspace_hits']) /
      (parseInt(dic.value['keyspace_hits']) + parseInt(dic.value['keyspace_misses']))
    return isNaN(ratio) ? 'error' : (ratio * 100).toFixed(2) + '%'
  } catch (_e: unknown) {
    return 'error'
  }
})

/** 连接配置中的 ACL 用户名，空串显示 default */
const displayUsername = computed(() => {
  const name = share.conn?.username?.trim()
  return name || 'default'
})

/** INFO instantaneous_ops_per_sec */
const opsPerSec = computed(() => {
  const v = dic.value['instantaneous_ops_per_sec']
  if (v == null || v === '') return '--'
  const n = parseFloat(v)
  return Number.isNaN(n) ? '--' : `${n}/s`
})

/** INFO instantaneous_*_kbps */
const networkInKbps = computed(() => {
  const v = dic.value['instantaneous_input_kbps']
  if (v == null || v === '') return '--'
  const n = parseFloat(v)
  return Number.isNaN(n) ? '--' : n.toFixed(2)
})
const networkOutKbps = computed(() => {
  const v = dic.value['instantaneous_output_kbps']
  if (v == null || v === '') return '--'
  const n = parseFloat(v)
  return Number.isNaN(n) ? '--' : n.toFixed(2)
})
const networkUnavailable = computed(
  () => networkInKbps.value === '--' || networkOutKbps.value === '--',
)

/** maxmemory 为 0 时显示未限制，否则 human · policy */
const maxmemorySummary = computed(() => {
  const bytes = parseInt(dic.value['maxmemory'] ?? '0', 10)
  if (!bytes) return t('redisInfo.maxmemoryUnlimited')
  const human = dic.value['maxmemory_human'] || `${bytes}B`
  const policy = dic.value['maxmemory_policy'] || '--'
  return `${human} · ${policy}`
})

const infoNode = ref('')

/** 已用内存占系统总内存比例（展示用，非 Redis maxmemory） */
// const memoryUsagePercent = computed(() => {
//   const used = parseInt(dic.value['used_memory'] ?? '', 10)
//   const total = parseInt(dic.value['total_system_memory'] ?? '', 10)
//   if (!total || Number.isNaN(used) || Number.isNaN(total)) return '--'
//   return ((used / total) * 100).toFixed(2)
// })

// raw原始值发生变化后，其他的值重新计算
watchEffect(() => {
  dic.value = {}
  tagList.value = []
  tagTable.value = []
  keyCount.value = 0
  share.dbSizeMap = {}

  const lines = raw.value.split('\n')
  let tagKey = ''

  share.isValkey = false
  lines.forEach(line => {
    if (line.startsWith('#')) {
      tagKey = line.substring(1).trim()
      tagList.value.push(tagKey)
    } else {
      const index = line.indexOf(':')
      const key = line.substring(0, index).trim()
      const value = line.substring(index + 1).trim()

      if (key !== '') {
        tagTable.value.push({ key, value, tag: tagKey })
        dic.value[key] = value

        // 如果info信息中有valkey_version则设置为true
        if (key === 'valkey_version') {
          share.isValkey = true
        }
      }

      // db0:keys=14410,expires=3997,avg_ttl=736124073
      // db1:keys=50,expires=0,avg_ttl=0,subexpiry=0
      if (/^db\d{1,2}$/.test(key)) {
        try {
          const size = parseInt(value.split(',')[0].split('=')[1])
          share.dbSizeMap[key] = size
          keyCount.value += size
        } catch (_e: unknown) {}
      }
    }
  })

  share.serverVersion = dic.value[share.isValkey ? 'valkey_version' : 'redis_version']
})

// 表格数据
const dataList = computed(() => {
  return tagTable.value.filter(d => !tagSelected.value || d.tag === tagSelected.value)
})
const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  return dataList.value.filter(
    d =>
      !key ||
      d.key?.toLowerCase().indexOf(key) > -1 ||
      d.value?.toLowerCase().indexOf(key) > -1 ||
      (tipMap.value[d.key]?.toLowerCase() ?? '').indexOf(key) > -1,
  )
})

// 合计列
// function getSummaries() {
//   return [t('redisInfo.total'), '', filterDataList.value.length + ' / ' + dataList.value.length, '']
// }

const tableRef = useTemplateRef('table')
function tagChange() {
  tableRef.value?.scrollTo(0, 0) // 滚动条归零
}

// 新增键/删除键等操作可以调用进行自动刷新，以便保证db下拉框中的数量显示正确
function onInfoRefreshBus(payload?: boolean | undefined) {
  void refresh(payload === true)
}
onMounted(() => bus.on(INFO_REFRESH, onInfoRefreshBus))
onUnmounted(() => bus.off(INFO_REFRESH, onInfoRefreshBus))

async function refresh(withConfigGet: boolean = false) {
  loading.value = true
  try {
    const data = await meCommands.info(share.conn!.id, node.value)
    raw.value = data.info || ''
    const conn = share.conn
    infoNode.value = data.node || (conn ? `${conn.host}:${conn.port}` : '')

    if (withConfigGet) {
      const data2 = await meCommands.configGet(share.conn!.id, 'save', node.value)
      config.value = data2 ?? {}
    }
  } finally {
    loading.value = false
  }
}

/** 集群先拉 nodeList 并选定 master，再首次 INFO，避免随机节点 */
async function initPage() {
  const nodeList = await meCommands.nodeList(share.conn!.id)
  share.nodeList = enrichNodeList(nodeList || [])
  if (share.conn?.cluster) {
    const firstMaster = share.nodeList.find(n => n.isMaster)
    if (firstMaster?.node) node.value = firstMaster.node
  }
  await refresh(true)
}

void initPage()

// 客户端、配置、内存
function goClient() {
  dialog.client = true
}
function goConfig() {
  dialog.config = true
}
function goMemory() {
  // dialog.memory = true
  share.tabName = 'memory'
}

// 新增功能：Redis 集群拓扑弹框
const nodeGroups = computed(() => {
  const masters = share.nodeList.filter(n => n.isMaster)
  return masters.map(m => ({
    master: m,
    slaves: share.nodeList.filter(n => n.isSlave && n.slaveOfNode === m.node),
  }))
})
</script>

<template>
  <div class="redis-info" v-loading="loading">
    <el-descriptions border>
      <template #title>
        <div class="me-flex" style="align-items: center">
          <div class="me-flex">
            <el-text size="large" style="margin-left: 5px">{{ infoNode }}</el-text>
            <el-tag style="margin-left: 10px" effect="plain">
              {{ share.isValkey ? 'Valkey' : 'Redis' }} {{ share.serverVersion }}
            </el-tag>
            <el-tag
              type="success"
              style="margin-left: 10px"
              effect="plain"
              v-if="dic[share.isValkey ? 'server_mode' : 'redis_mode']"
              >{{ dic[share.isValkey ? 'server_mode' : 'redis_mode'] }}</el-tag
            >
            <el-tag type="success" style="margin-left: 10px" v-if="dic['role']" effect="plain">{{
              dic['role']
            }}</el-tag>
            <me-icon
              v-if="share.conn?.cluster"
              class="icon-btn"
              style="margin-left: 10px; font-size: 16px; color: var(--el-color-primary)"
              icon="me-icon-cluster"
              :info="t('redisInfo.clusterTopology')"
              @click="dialog.topology = true" />
          </div>
          <div class="me-flex">
            <me-icon
              class="refresh-btn"
              :name="t('refresh')"
              icon="el-icon-refresh"
              placement="left"
              hint
              @click="refresh(true)" />
            <node-list v-model="node" init-node style="margin-left: 10px" @change="refresh(true)" />
          </div>
        </div>
      </template>

      <el-descriptions-item>
        <template #label
          ><me-icon :name="t('redisInfo.uptimeInDays')" icon="el-icon-timer"
        /></template>
        {{ dic['uptime_in_days'] }} {{ t('redisInfo.days', parseInt(dic['uptime_in_days'])) }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label><me-icon :name="t('redisInfo.keyTotal')" icon="el-icon-key" /></template>
        {{ keyCount }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label
          ><me-icon :name="t('redisInfo.connectedClients')" icon="me-icon-conn"
        /></template>
        <div class="me-flex">
          <el-link @click="goClient" underline="never" type="primary">{{
            dic['connected_clients']
          }}</el-link>
          <el-text type="info" style="margin-left: 10px">
            [ {{ t('redisInfo.maxClients') }}: {{ dic['maxclients'] }} ]
          </el-text>
        </div>
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label><me-icon :name="t('redisInfo.user')" icon="el-icon-user" /></template>
        {{ displayUsername }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label>
          <span class="network-label">
            <me-icon :name="t('redisInfo.network')" icon="el-icon-connection" />
            <span class="network-unit">kb/s</span>
          </span>
        </template>
        <span v-if="networkUnavailable">--</span>
        <span v-else class="network-throughput">
          <span>↑ {{ networkInKbps }}</span>
          <span class="network-throughput-gap">↓ {{ networkOutKbps }}</span>
        </span>
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label
          ><me-icon :name="t('redisInfo.command')" icon="el-icon-odometer"
        /></template>
        {{ opsPerSec }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label
          ><me-icon :name="t('redisInfo.persistence')" icon="me-icon-save"
        /></template>
        <!-- rdb需要通过config get save命令去确认 -->
        <el-checkbox v-model="rdbChecked" disabled>
          <el-tooltip :content="rdbTooltip" placement="top-start">RDB</el-tooltip>
        </el-checkbox>
        <el-checkbox v-model="aofChecked" disabled>AOF</el-checkbox>
      </el-descriptions-item>

      <el-descriptions-item :span="2">
        <template #label><me-icon :name="t('redisInfo.memory')" icon="me-icon-memory" /></template>
        <div class="me-flex">
          <el-link underline="never" @click="goMemory" type="primary">
            {{ dic['used_memory_human'] }}
          </el-link>
          <el-text type="info" style="margin-left: 10px">
            [
            <span>{{ t('redisInfo.peak') }}: {{ dic['used_memory_peak_human'] }}</span>
            <span style="margin-left: 20px"
              >{{ t('redisInfo.maxmemoryLimit') }}: {{ maxmemorySummary }}</span
            >
            ]
          </el-text>
        </div>
      </el-descriptions-item>

      <el-descriptions-item :span="3">
        <template #label
          ><me-icon :name="t('redisInfo.executable')" icon="el-icon-video-play"
        /></template>
        <div class="me-flex">
          <el-text truncated style="max-width: 300px; color: unset">{{
            dic['executable']
          }}</el-text>
          <el-text type="info" style="margin-left: 10px; max-width: 300px" truncated>
            [
            <el-link underline="never" @click="goConfig" type="primary">{{
              t('redisInfo.config')
            }}</el-link
            >: {{ dic['config_file'] || '--' }} ]
          </el-text>
        </div>
      </el-descriptions-item>

      <el-descriptions-item :span="3">
        <template #label><me-icon :name="t('redisInfo.system')" icon="el-icon-monitor" /></template>
        <div class="me-flex">
          {{ dic['os'] }}
          <el-text type="info" style="margin-left: 10px">
            [
            <span>PID: {{ dic['process_id'] }}</span>
            <span style="margin-left: 20px"
              >{{ t('redisInfo.memory') }}: {{ dic['total_system_memory_human'] }}</span
            >
            <span style="margin-left: 20px" v-if="cacheRatio !== 'error'"
              >{{ t('redisInfo.cacheRatio') }}: {{ cacheRatio }}</span
            >
            ]
          </el-text>
        </div>
      </el-descriptions-item>
    </el-descriptions>

    <el-card class="detail-card">
      <template #header>
        <div class="me-flex detail-header">
          <div class="me-flex">
            <el-text size="large">{{ t('redisInfo.infoDetail') }}</el-text>
            <me-website to="info" />
          </div>

          <div class="detail-header-right">
            <me-icon
              :info="t('redisInfo.rawInfo')"
              icon="el-icon-notebook"
              class="icon-btn"
              @click="dialog.raw = true" />
            <el-select
              v-model="tagSelected"
              :placeholder="t('redisInfo.tag')"
              clearable
              style="width: 150px; margin: 0 10px"
              @change="tagChange">
              <el-option v-for="tag in tagList" :key="tag" :label="tag" :value="tag" />
            </el-select>
            <el-input
              v-model="keyword"
              clearable
              style="width: 200px"
              prefix-icon="el-icon-search"
              :placeholder="t('redisInfo.keyword')" />
          </div>
        </div>
      </template>

      <me-table ref="table" :data="filterDataList" export-name="info">
        <el-table-column prop="tag" :label="t('redisInfo.tag')" width="100" />
        <el-table-column prop="key" :label="t('redisInfo.key')" show-overflow-tooltip />
        <el-table-column prop="value" :label="t('redisInfo.value')" show-overflow-tooltip />
        <el-table-column :label="t('redisInfo.tip')" show-overflow-tooltip>
          <template #default="scope">
            <span style="color: var(--el-color-info)">{{ tipMap[scope.row.key] }}</span>
          </template>
        </el-table-column>
      </me-table>
    </el-card>
  </div>

  <me-dialog v-model="dialog.raw" icon="el-icon-notebook" title="Info" width="60vw">
    <me-code :modelValue="raw" mode="properties" read-only />
  </me-dialog>

  <me-dialog
    v-model="dialog.client"
    icon="el-icon-mic"
    :title="t('redisInfo.client')"
    width="80vw"
    :close-on-press-escape="false"
    :close-on-click-modal="false">
    <RedisClient :init-node="node || infoNode" />
  </me-dialog>

  <!--
  <me-dialog v-model="dialog.memory" icon="me-icon-memory" :title="t('redisInfo.memory')" width="80vw" >
    <RedisMemory/>
  </me-dialog>
  -->

  <me-dialog
    v-model="dialog.config"
    icon="el-icon-wallet"
    :title="t('redisInfo.runConfig')"
    width="80vw"
    :close-on-press-escape="false"
    :close-on-click-modal="false">
    <RedisConfig :init-node="node || infoNode" :init-version="share.serverVersion" />
  </me-dialog>

  <el-dialog
    v-model="dialog.topology"
    :title="t('redisInfo.clusterTopology')"
    width="600px"
    draggable>
    <template #header>
      <me-icon icon="me-icon-cluster" :name="t('redisInfo.clusterTopology')" />
    </template>
    <div class="cluster-topology-wrap">
      <el-card
        v-for="(group, groupIdx) in nodeGroups"
        :key="group.master.node"
        shadow="hover"
        :style="{ marginTop: groupIdx ? '10px' : '0' }">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0">
            <el-tag type="primary" effect="dark" size="small">{{ group.master.shortLabel }}</el-tag>
            <el-text effect="dark" type="primary" style="font-size: 13px; font-weight: 600">
              {{ group.master.node }}
            </el-text>
          </div>
          <el-text type="info" style="font-size: 12px">
            {{ group.master.id }}
          </el-text>
        </div>
        <div
          v-if="group.slaves.length"
          style="
            margin-top: 10px;
            padding-left: 14px;
            border-left: 2px solid var(--el-border-color-lighter);
          ">
          <div
            v-for="(s, idx) in group.slaves"
            :key="s.node"
            style="display: flex; align-items: center; justify-content: space-between; gap: 10px"
            :style="{ marginTop: idx ? '8px' : '0' }">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0">
              <el-tag type="info" effect="dark" size="small">{{ s.shortLabel }}</el-tag>
              <el-text effect="dark" type="info" style="font-size: 13px; font-weight: 500">
                {{ s.node }}
              </el-text>
            </div>
            <el-text type="info" style="font-size: 12px">
              {{ s.id }}
            </el-text>
          </div>
        </div>
        <el-text
          v-if="group.master.slots"
          effect="dark"
          type="info"
          size="small"
          style="display: block; margin-top: 10px; text-align: right">
          Slots: {{ group.master.slots }}
        </el-text>
      </el-card>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.redis-info {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  // 描述标题的宽度
  :deep(.el-descriptions__title) {
    width: 100%;
  }

  // 参数详情的高度小一些
  :deep(.el-card__header) {
    padding: 10px;
  }

  // 参数详情的Body去掉Padding
  :deep(.el-card__body) {
    padding: 0;
  }

  .refresh-btn {
    font-size: 20px;
    color: var(--el-color-success);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .network-throughput-gap {
    margin-left: 16px;
  }

  .network-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    vertical-align: middle;
  }

  .network-unit {
    font-size: 10px;
    color: var(--el-text-color-secondary);
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  .detail-card {
    margin-top: 10px;
    flex: 1;

    :deep(.el-card__body) {
      height: calc(100% - var(--el-card-padding) * 2 - 10px);
    }

    .detail-header {
      font-weight: bold;
      align-items: center;

      .detail-header-right {
        display: flex;
      }
    }
  }
}

.cluster-topology-wrap {
  height: 100%;
  overflow: auto;
  padding: 4px 2px 12px;
}
</style>
