<script setup>
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import MeWebsite from '@/components/MeWebsite.vue'
import { infoTip as tips } from '@/utils/tip.js'
import { bus, INFO_REFRESH, meInvoke } from '@/utils/util.js'
import RedisClient from '@/views/tab/RedisClient.vue'
import RedisConfig from '@/views/tab/RedisConfig.vue'

import { enrichNodeList } from '../../utils/util'
import NodeList from '../ext/NodeList.vue'

const { t } = useI18n()
// 共享数据
const share = inject('share')

// 数据
const node = ref('') // 指定节点
const raw = ref('') // 原始信息
const dic = ref({}) // 字典形式
const tagList = ref([]) // 标签名列表
const tagTable = ref([]) // 标签形式， tag分类名称, key标签名称，value表格数据
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
const config = ref('')
const rdbChecked = computed(() => !!config.value.save)
const aofChecked = computed(() => dic.value['aof_enabled'] === '1')
const rdbTooltip = computed(() => config.value.save || t('redisInfo.rdbDisabled'))
const cacheRatio = computed(() => {
  try {
    const ratio =
      parseInt(dic.value['keyspace_hits']) /
      (parseInt(dic.value['keyspace_hits']) + parseInt(dic.value['keyspace_misses']))
    return isNaN(ratio) ? 'error' : (ratio * 100).toFixed(2) + '%'
  } catch (e) {
    return 'error'
  }
})

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
        } catch (e) {}
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
      tips.value[d.key]?.toLowerCase().indexOf(key) > -1,
  )
})

// 合计列
function getSummaries() {
  return [t('redisInfo.total'), '', filterDataList.value.length + ' / ' + dataList.value.length, '']
}

const tableRef = useTemplateRef('table')
function tagChange() {
  tableRef.value.scrollTo(0, 0) // 滚动条归零
}

const infoNode = ref('')

// 新增键/删除键等操作可以调用进行自动刷新，以便保证db下拉框中的数量显示正确
onMounted(() => bus.on(INFO_REFRESH, refresh))
onUnmounted(() => bus.off(INFO_REFRESH, refresh))
async function refresh(withConfigGet = false) {
  loading.value = true
  try {
    const data = await meInvoke('info', { id: share.conn.id, node: node.value })
    raw.value = data.info || ''
    infoNode.value = data.node || share.conn.host + ':' + share.conn.port

    if (withConfigGet) {
      const data2 = await meInvoke('config_get', {
        id: share.conn.id,
        pattern: 'save',
        node: node.value,
      })
      config.value = data2 || ''
    }
  } finally {
    loading.value = false
  }
}
refresh(true)

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
            <node-list v-model="node" style="margin-left: 10px" @change="refresh(true)" clearable />
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

      <el-descriptions-item :span="1">
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
          <el-link underline="never" @click="goMemory" type="primary">{{
            dic['used_memory_human']
          }}</el-link>
          <el-text type="info" style="margin-left: 10px">
            [
            <span style="margin-left: 0px"
              >{{ t('redisInfo.peak') }}: {{ dic['used_memory_peak_human'] }}</span
            >
            <span style="margin-left: 20px"
              >{{ t('redisInfo.rss') }}: {{ dic['used_memory_rss_human'] }}</span
            >
            <span style="margin-left: 20px"
              >{{ t('redisInfo.os') }}: {{ dic['total_system_memory_human'] }}</span
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
          {{ dic['executable'] }}
          <el-text type="info" style="margin-left: 10px">
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

      <el-table
        ref="table"
        :data="filterDataList"
        show-summary
        :summary-method="getSummaries"
        stripe
        height="100%">
        <el-table-column prop="tag" :label="t('redisInfo.tag')" width="100" />
        <el-table-column prop="key" :label="t('redisInfo.key')" show-overflow-tooltip />
        <el-table-column prop="value" :label="t('redisInfo.value')" show-overflow-tooltip />
        <el-table-column :label="t('redisInfo.tip')" show-overflow-tooltip>
          <template #default="scope">
            <span style="color: var(--el-color-info)">{{ tips[scope.row.key] }}</span>
          </template>
        </el-table-column>
      </el-table>
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
    width="520px"
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
        <div class="me-flex" style="align-items: center; gap: 10px">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0">
            <el-tag type="primary" effect="dark" size="small">{{ group.master.shortLabel }}</el-tag>
            <el-text effect="dark" type="primary" style="font-size: 13px; font-weight: 600">
              {{ group.master.node }}
            </el-text>
          </div>
          <el-text
            v-if="group.master.slots"
            effect="dark"
            type="info"
            size="small"
            style="flex-shrink: 0; text-align: right">
            {{ t('nodeList.slotsTooltip', { slots: group.master.slots }) }}
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
            style="display: flex; align-items: center; gap: 10px"
            :style="{ marginTop: idx ? '8px' : '0' }">
            <el-tag type="info" effect="dark" size="small">{{ s.shortLabel }}</el-tag>
            <el-text effect="dark" type="info" style="font-size: 13px; font-weight: 500">
              {{ s.node }}
            </el-text>
          </div>
        </div>
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
