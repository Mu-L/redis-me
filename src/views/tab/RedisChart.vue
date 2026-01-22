<script setup>
import {meInvoke, meLog} from '@/utils/util.js'
import {Line} from 'vue-chartjs'
import {Chart as ChartJS, Legend, LinearScale, LineController, LineElement, PointElement, TimeScale} from 'chart.js'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import {cloneDeep} from 'lodash'

// 只注册必要的组件即可
// https://chartjs.cn/docs/latest/getting-started/integration.html
ChartJS.register(LineController, LineElement, PointElement, TimeScale, LinearScale, Legend)

const share = inject('share')
const node = ref('')         // 指定节点

// 从后台获取原始数据
async function getData() {
  try {
    const data = await meInvoke('chart', {id: share.conn.id, node: node.value})
    const label = new Date()
    chartData.value.keyTotal.labels.push(label)
    chartData.value.keyTotal.datasets[0].data.push(data.keyTotal)
  } catch (e) {
    meLog('get chart data error', e)
  }
}

// chart.js配置项
const options = {
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
  tension: 0.4
}

const initData = {
  keyTotal: {labels: [], datasets: [{label: '键总数', ...dataset}]},
  client: {labels: [], datasets: [{label: '客户端数量', ...dataset}]},
  command: {labels: [], datasets: [{label: '命令执行数/秒', ...dataset}]},
  memory: {labels: [], datasets: [{label: '内存使用', ...dataset}]},
  network: {labels: [], datasets: [{label: '网络输入', ...dataset}, {label: '网络输出', ...dataset}]}
}

let chartData = ref(cloneDeep(initData))

// 重置数据
function resetData() {
  chartData.value = cloneDeep(initData)
}
</script>

<template>
  <div class="redis-chart">
    <el-button @click="getData">获取数据</el-button>
    <el-button @click="resetData">重置数据</el-button>
    <div class="chart">
      <Line :data="cloneDeep(chartData.keyTotal)" :options/>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-chart {
  height: 100%;
  overflow-y: auto;
  border: 2px solid red;

  .chart {
    height: 25vh;
  }
}
</style>