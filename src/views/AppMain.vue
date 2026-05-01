<script setup>
import { getCurrentWindow } from '@tauri-apps/api/window'
import { check } from '@tauri-apps/plugin-updater'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  bus,
  CONN_LIST_WINDOWS_SYNC,
  CONN_REFRESH,
  meCommands,
  DoNothing,
  meJsonParse,
  meOk,
} from '@/utils/util.js'
import KeyHeader from '@/views/KeyHeader.vue'
import KeyMain from '@/views/KeyMain.vue'
import TabConn from '@/views/TabConn.vue'

import TabMain from './TabMain.vue'

const { t } = useI18n()

// 共享数据
const share = reactive({
  conn: null, // 当前连接
  connList: meTauri.connList, // 连接列表, 初始化从存储中已读取
  nodeList: [], // 节点列表，刷新连接才会更新
  loading: false, // 整个主体界面loading（其他地方也会使用到）
  color: 'var(--el-color-primary)', // 即 share.conn.color（便于使用和移植）
  readonly: false, // 即 share.conn.readonly 当前连接是否只读(此处另外存储1份，避免影响连接默认的只读设置)
  redisKey: null, // Redis键
  tabName: 'info', // 标签页名
  dbSizeMap: {}, // 数据库大小显示

  // 导入导出
  exportImporting: false, // 导入导出中
  exportImportingTip: '', // 导入导出提示
  exportImportingPercentage: 0, // 导入导出进度

  // 兼容valkey
  isValkey: false, // 默认不是valkey, 如果info信息中有valkey_version则设置为true
  serverVersion: '', // 服务器版本, isValkey ? 'valkey_version' : 'redis_version'

  // 扩展能力
  capabilities: {
    hashFieldTtl: false, // 哈希字段级的TTL, Redis/Valkey >= 7.4.0
  },
})
provide('share', share)

// 当环境发生变化时，销毁整个key和tag组件（避免状态保留）
onMounted(() => bus.on(CONN_REFRESH, toggleKeyTag))
onUnmounted(() => bus.off(CONN_REFRESH, toggleKeyTag))

// 切换连接时销毁key/tag组件
const connPrepared = ref(false)
function toggleKeyTag() {
  connPrepared.value = false
  nextTick(() => (connPrepared.value = true))
}

// 切换连接时loading
watch(
  // () => share.conn,
  () => JSON.stringify(share.conn), // 监听序列化后的字符串，避免新旧连接是同一个引用
  async (newConn, oldConn) => {
    newConn = meJsonParse(newConn)
    oldConn = meJsonParse(oldConn)

    // 触发连接列表更新（保存和同步到后端） #72
    const index = share.connList.findIndex(c => c.id === newConn?.id)
    if (index !== -1) {
      share.connList[index] = newConn
    }

    // 连接id未发生改变时，无需断开重连（比如颜色或db改变）
    if (newConn?.id === oldConn?.id) return

    share.loading = true
    connPrepared.value = false

    try {
      // 关闭旧连接
      if (oldConn) {
        await meCommands.disconnect(oldConn.id)
      }

      // 打开新连接
      if (newConn) {
        share.color = newConn.color
        share.readonly = !!newConn.readonly
        share.tabName = 'info'
        share.capabilities = await meCommands.connect(newConn.id)
        connPrepared.value = true
      }
    } catch (e) {
      // 如果从连接列表页进入的，则返回连接列表页
      if (!oldConn) share.conn = null
    } finally {
      share.loading = false
    }
  },
  { deep: true },
)

// 保存连接列表: 列表真实变化时才发送命令
const window = getCurrentWindow()
const connListToString = computed(() => JSON.stringify(share.connList))
watch(
  connListToString,
  async newConnList => {
    const connList = meJsonParse(newConnList)
    meTauri.connList = connList // 保证导入导出连接时也进行持久化更新

    // 后端同步 和 多窗口同步
    await meCommands.connList(connList)
    await window.emit(CONN_LIST_WINDOWS_SYNC, { connList, label: window.label })
  },
  { immediate: true },
)

// 多窗口的连接列表实时同步（TODO 后端和持久化仅需要变化的窗口处理即可）
onMounted(() => window.listen(CONN_LIST_WINDOWS_SYNC, e => (share.connList = e.payload.connList)))

// 软件自动更新
const app = reactive({
  // 软件更新
  update: null,
  downloading: false,
  downloadPercentage: 0,
})
provide('app', app)
async function checkAutoUpdate() {
  if (!meTauri.settings.autoUpdate) return
  app.update = await check().catch(DoNothing)
}
onMounted(checkAutoUpdate)

// 切换只读
function changeReadonly() {
  share.readonly = !share.readonly
  meOk(share.readonly ? t('appMain.readonlyTip') : t('appMain.writableTip'))
}
</script>

<template>
  <div class="redis-main" v-loading="share.loading">
    <el-splitter>
      <!-- 左侧键 -->
      <el-splitter-panel :min="250" size="30%">
        <div class="redis-key">
          <KeyHeader />
          <KeyMain v-if="share.conn && connPrepared" />
          <el-empty v-else />
        </div>
      </el-splitter-panel>

      <!-- 右侧值 -->
      <el-splitter-panel :min="250">
        <TabConn v-if="!share.conn" />
        <template v-else-if="connPrepared">
          <TabMain />

          <!-- 只读/可写 -->
          <me-icon
            class="readonly-icon"
            plain
            :icon="share.readonly ? 'me-icon-lock' : 'me-icon-unlock'"
            :name="share.readonly ? t('appMain.readonly') : t('appMain.writable')"
            :hint="true"
            @click="changeReadonly" />

          <!-- 导入导出 -->
          <el-progress
            class="export-importing"
            type="dashboard"
            status="success"
            :percentage="share.exportImportingPercentage"
            v-if="share.exportImporting">
            <template #default="{ percentage }">
              <div class="percentage-value">{{ percentage }}%</div>
              <div class="percentage-label">{{ share.exportImportingTip }}</div>
            </template>
          </el-progress>
        </template>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style scoped lang="scss">
.redis-main {
  height: calc(100% - 30px);
  //border: 2px solid blue;
  padding: 0px 5px 5px 5px;
  flex: 1;

  .redis-key {
    //border: 2px solid red;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  /* 中间分隔面板的样式调整 */
  :deep(.el-splitter-bar) {
    width: 5px !important;

    .el-splitter-bar__dragger-horizontal:before {
      width: 0; // 宽度为0，不显示原始的竖线
      background-color: transparent;
    }
  }

  /* 只读按钮图标 */
  :deep(.readonly-icon) {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 20px;
    z-index: 100;
    color: var(--el-color-success);

    cursor: pointer;
    &:hover {
      color: var(--el-color-primary);
    }
  }

  // 版本升级过程中显示下载进度
  .export-importing {
    position: absolute;
    right: 20px;
    bottom: 0;
    z-index: 100;

    .percentage-value {
      font-size: 28px;
      color: var(--el-color-success);
    }

    .percentage-label {
      margin-top: 10px;
      font-size: 14px;
    }
  }
}
</style>
