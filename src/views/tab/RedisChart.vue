<script setup>
import {meInvoke, meLog, PREDEFINE_COLORS} from '@/utils/util.js'
import {Line} from 'vue-chartjs'
import {
  Chart as ChartJS, Legend, LinearScale, LineController, LineElement, PointElement, TimeScale, CategoryScale,
  Tooltip
} from 'chart.js'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import {cloneDeep, merge} from 'lodash'
import NodeList from '@/views/ext/NodeList.vue'
import {useI18n} from 'vue-i18n'
import dayjs from 'dayjs'

// 只注册必要的组件即可
// https://chartjs.cn/docs/latest/getting-started/integration.html
ChartJS.register(LineController, LineElement, PointElement, TimeScale, LinearScale, Legend, CategoryScale, Tooltip)
// ChartJS.overrides.line.maintainAspectRatio = false

const {t} = useI18n()

const share = inject('share')
const node = ref('')           // 指定节点
const autoRefresh = ref(true)  // 自动刷新
const refreshInterval = ref(5) // 刷新间隔（秒）
const keepMinutes = ref(30)    // 保留N分钟的数据, 超过则砍一半(1个个截取，图表总跳动)
const maxDataCount = computed(() => keepMinutes.value * 60 / refreshInterval.value) // 最多保存N个数据

// 自动刷新及刷新间隔配置
let timer = null
watch([autoRefresh, refreshInterval], (val) => {
  clearTimeout(timer)
  if (val) {
    timer = setInterval(getData, refreshInterval.value * 1000)
  }
}, {immediate: true})
onUnmounted(() => clearTimeout(timer))

// 图表实例，手动刷新
const commandRef = useTemplateRef('command')
const memoryRef = useTemplateRef('memory')
const networkRef = useTemplateRef('network')
function refreshInstance(){
  commandRef.value?.chart.update()
  memoryRef.value?.chart.update()
  networkRef.value?.chart.update()
}

// 从后台获取原始数据
getData()
async function getData() {
  try {
    const res = await meInvoke('chart', {id: share.conn.id, node: node.value})
    const label = new Date()
    setChartData(label, res, 'command', 'instantaneousOpsPerSec')
    setChartData(label, res, 'memory', 'usedMemory')
    setChartData(label, res, 'network', 'instantaneousInputKbps', 'instantaneousOutputKbps')
    refreshInstance()
  } catch (e) {
    meLog('get chart data error', e)
  }
}

// 简化多个属性设置
function setChartData(label, res, prop0, prop1, prop2) {
  let propData = chartData.value[prop0]
  propData.labels.push(label)
  propData.datasets[0].data.push(res[prop1])
  if (prop2) {
    propData.datasets[1].data.push(res[prop2])
  }
  // 数组仅保留前N个，避免数据过多程序卡顿
  const length = maxDataCount.value
  if (propData.labels.length > length) {
    const deleteCount = Math.floor(maxDataCount.value / 2)
    meLog('chart data too long, truncate', length)
    propData.labels.splice(0, deleteCount)
    propData.datasets[0].data.splice(0, deleteCount)
    if (prop2) {
      propData.datasets[1].data.splice(0, deleteCount)
    }
  }
}

// chart.js配置项
const options = {
  maintainAspectRatio: false,
  // x轴为日期格式，显示为秒
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'second',
        displayFormats: {
          second: 'HH:mm:ss'
        }
      },
      // 控制刻度显示数量
      ticks: {
        align: 'center',  // 刻度居中
        maxTicksLimit: 10, // 最多显示N个主刻度
        autoSkip: true,   // 自动跳过部分刻度
      },
      bounds: 'ticks', // 确保坐标轴从第一个刻度开始，到最后一个刻度结束
      offset: false    // 在两端留出空白
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        // 格式化工具提示的标题（时间）
        title: function (context) {
          // context[0]包含第一个数据点
          const dt = dayjs(context[0].parsed.x)
          return dt.format('YYYY-MM-DD HH:mm:ss')
        }
      }
    },
  },
}

// chart.js数据配置项
const dataset = {
  data: [],
  tension: 0.4  // 线条张力、平滑度
}

const memoryOptions = cloneDeep(options)
merge(memoryOptions, {
  scales: {
    y: {
      beginAtZero: true, // 从零开始
      ticks: {
        // 关键：修改 Y 轴刻度的显示单位
        callback: function (value) {
          const valueInMB = value / (1024 * 1024) // 字节转 MB
          return valueInMB.toFixed(1) + ' M' // 保留 1 位小数
        }
      },
    }
  }
})

const initData = computed(() => ({
  command: {
    labels: [],
    datasets: [
      {label: t('redisChart.command'), borderColor: PREDEFINE_COLORS[0], ...cloneDeep(dataset)}
    ]
  },
  memory: {
    labels: [],
    datasets: [
      {label: t('redisChart.memory'), borderColor: PREDEFINE_COLORS[1], ...cloneDeep(dataset)}]
  },
  network: {
    labels: [],
    datasets: [
      {label: t('redisChart.networkIn'), borderColor: PREDEFINE_COLORS[2], ...cloneDeep(dataset)},
      {label: t('redisChart.networkOut'), borderColor: PREDEFINE_COLORS[4], ...cloneDeep(dataset)}
    ]
  },
}))

// 避免vue的响应式更新和chartjs的响应式更新冲突（无限循环），使用shallowRef
let chartData = shallowRef(cloneDeep(initData.value))

// 重置数据
function resetData() {
  chartData.value = cloneDeep(initData.value)
  getData()
}
watch(node, resetData)

// 国际化在此设置，保证可以实时响应语言切换
watch(() => meTauri.settings.language, () => {
  chartData.value.command.datasets[0].label = t('redisChart.command')
  chartData.value.memory.datasets[0].label = t('redisChart.memory')
  chartData.value.network.datasets[0].label = t('redisChart.networkIn')
  chartData.value.network.datasets[1].label = t('redisChart.networkOut')
  chartData.value = cloneDeep(chartData.value) // 直接更新时label并没有更新，因此克隆1份，让vue进行重新渲染
}, {immediate: true})
</script>

<template>
  <div class="redis-chart">
    <div class="me-flex">
      <div class="left">
        <me-button @click="resetData" icon="el-icon-delete" info="清空数据" placement="top"/>
        <el-dropdown placement="bottom-start" :hide-on-click="false" :teleported="false">
          <me-icon class="refresh icon-btn" :class="autoRefresh ? 'rotating' : ''"
                   icon="el-icon-refresh-right" @click="getData" style="margin-left: 20px"/>
          <template #dropdown>
            <el-dropdown-menu>
              <el-form :label-width="t('redisChart.labelWidth')" label-position="right">
                <el-dropdown-item>
                  <el-form-item :label="t('redisChart.autoRefresh')">
                    <el-switch v-model="autoRefresh" style="margin-left: 10px"> 自动刷新</el-switch>
                  </el-form-item>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-form-item :label="t('redisChart.refreshInterval')">
                    <el-input-number v-model.number="refreshInterval" :min="1" :max="60"
                                     :controls="false" style="width: 80px; margin-left: 10px">
                      <template #suffix>{{ t('redisChart.refreshUnit') }}</template>
                    </el-input-number>
                  </el-form-item>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-form-item :label="t('redisChart.keepMinutes')">
                    <el-input-number v-model.number="keepMinutes" :min="1" :max="600"
                                     :controls="false" style="width: 80px; margin-left: 10px">
                      <template #suffix>{{ t('redisChart.keepUnit') }}</template>
                    </el-input-number>
                  </el-form-item>
                </el-dropdown-item>
              </el-form>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="right">
        <node-list v-model="node" style="margin-left: 10px" init-node/>
      </div>
    </div>

    <div class="charts">
      <div class="chart">
        <Line ref="command" :data="chartData.command" :options/>
      </div>
      <div class="chart">
        <Line ref="memory" :data="chartData.memory" :options="memoryOptions"/>
      </div>
      <div class="chart">
        <Line ref="network" :data="chartData.network" :options/>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-chart {
  height: 100%;
  overflow-y: auto;
  //border: 2px solid red;

  display: flex;
  flex-direction: column;

  .left {
    display: flex;
  }

  :deep(.el-input-group__prepend) {
    padding: 0 10px 0 0;
  }

  :deep(.el-input-group__append) {
    width: 42px;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  .refresh {
    font-size: 24px;
    color: var(--el-color-success);
  }

  .charts {
    margin-top: -20px;
    flex-grow: 1;

    .chart {
      height: 33%;
      padding: 10px;
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .rotating {
    animation: rotate 2s linear infinite;
  }
}
</style>