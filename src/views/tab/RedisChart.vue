<script setup>
import {meInvoke, meLog, PREDEFINE_COLORS} from '@/utils/util.js'
import {Line} from 'vue-chartjs'
import {Chart as ChartJS, Legend, LinearScale, LineController, LineElement, PointElement, TimeScale} from 'chart.js'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import {cloneDeep} from 'lodash'
import NodeList from '@/views/ext/NodeList.vue'
import {useI18n} from 'vue-i18n'

// 只注册必要的组件即可
// https://chartjs.cn/docs/latest/getting-started/integration.html
ChartJS.register(LineController, LineElement, PointElement, TimeScale, LinearScale, Legend)

const { t } = useI18n()

const share = inject('share')
const node = ref('')         // 指定节点
const autoRefresh     = ref(true)
const refreshInterval = ref(50)

// 从后台获取原始数据
async function getData() {
  try {
    const res = await meInvoke('chart', {id: share.conn.id, node: node.value})
    const label = new Date()
    setChartData(label, res, 'keyTotal', 'keyTotal')
    setChartData(label, res, 'client', 'connectedClients')
    setChartData(label, res, 'command', 'instantaneousOpsPerSec')
    setChartData(label, res, 'memory', 'usedMemory')
    setChartData(label, res, 'network', 'instantaneousInputKbps')
    setChartData(label, res, 'network', 'instantaneousOutputKbps', 1)
  } catch (e) {
    meLog('get chart data error', e)
  }
}

// 简化多个属性设置
function setChartData(label, res, prop1, prop2, index = 0) {
  let propData = chartData.value[prop1]
  propData.labels.push(label)
  propData.datasets[index].data.push(res[prop2])
  // 数组仅保留前1000个，避免数据过多卡死、
  // if (propData.labels > 1000) {
  //   propData.labels = propData.labels.slice(-1000)
  //   propData.datasets[index].data = propData.datasets[index].data.slice(-1000)
  // }
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
        maxTicksLimit: 5, // 最多显示5个主刻度
        autoSkip: true,   // 自动跳过部分刻度
      },
      bounds: 'ticks', // 确保坐标轴从第一个刻度开始，到最后一个刻度结束
      offset: false    // 在两端留出空白
    }
  }
}

// chart.js数据配置项
const dataset = {
  data: [],
  tension: 0.4  // 线条张力、平滑度
}

const initData = {
  command: {labels: [], datasets: [{label: '命令执行数/秒', borderColor: PREDEFINE_COLORS[0], ...cloneDeep(dataset)}]},
  memory:  {labels: [], datasets: [{label: '内存使用', borderColor: PREDEFINE_COLORS[1], ...cloneDeep(dataset)}]},
  network: {
    labels: [], datasets: [
      {label: '网络输入（Kb/s）', borderColor: PREDEFINE_COLORS[2], ...cloneDeep(dataset)},
      {label: '网络输出（Kb/s）', borderColor: PREDEFINE_COLORS[3], ...cloneDeep(dataset)}
    ]
  },
  keyTotal: {labels: [], datasets: [{label: '键总数', borderColor: PREDEFINE_COLORS[4], ...cloneDeep(dataset)}]},
  client: {labels: [], datasets: [{label: '客户端数量', borderColor: PREDEFINE_COLORS[0], ...cloneDeep(dataset)}]},
}
let chartData = ref(cloneDeep(initData))

// 重置数据
function resetData() {
  chartData.value = cloneDeep(initData)
}
</script>

<template>
  <div class="redis-chart">
    <div class="me-flex">
      <div class="left">
        <me-button @click="resetData" icon="el-icon-delete"  info="清空数据"/>
        <el-dropdown placement="bottom-start" :hide-on-click="false" :teleported="false">
          <me-icon class="refresh icon-btn" icon="el-icon-refresh" @click="getData" style="margin-left: 20px"/>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <span>自动刷新</span>
                <el-switch v-model="autoRefresh" style="margin-left: 10px"> 自动刷新</el-switch>
              </el-dropdown-item>
              <el-dropdown-item>
                <span>刷新间隔</span>
                <el-input-number v-model.number="refreshInterval" :min="1" :max="60" :controls="false"
                                 style="width: 80px; margin-left: 10px">
                  <template #suffix>秒</template>
                </el-input-number>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="right">
        <node-list v-model="node" style="margin-left: 10px" init-node/>
      </div>
    </div>

    <div class="charts">
      <div class="chart"><Line :data="cloneDeep(chartData.command)" :options/></div>
      <div class="chart"><Line :data="cloneDeep(chartData.memory)" :options/></div>
      <div class="chart"><Line :data="cloneDeep(chartData.network)" :options/></div>
      <!--
      <div class="chart"><Line :data="cloneDeep(chartData.keyTotal)" :options/></div>
      <div class="chart"><Line :data="cloneDeep(chartData.client)" :options/></div>
      -->
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

  .refresh {
    font-size: 20px;
    color: var(--el-color-success);
  }

  .charts {
    flex-grow: 1;

    .chart {
      height: 33%;
      padding: 10px;
    }
  }
}
</style>