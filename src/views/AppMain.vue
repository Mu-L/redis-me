<script setup>
import TabMain from './TabMain.vue'
import {sortBy} from 'lodash'
import {bus, CONN_REFRESH, DoNothing, meInvoke, meOk} from '@/utils/util.js'
import TabConn from '@/views/TabConn.vue'
import KeyHeader from '@/views/KeyHeader.vue'
import KeyMain from '@/views/KeyMain.vue'
import {onMounted, ref} from 'vue'
import {check} from '@tauri-apps/plugin-updater'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()

// 共享数据
const share = reactive({
  conn: null,                         // 当前连接
  connList: meTauri.connList,         // 连接列表, 初始化从存储中已读取
  nodeList: [],                       // 节点列表
  color: 'var(--el-color-primary)',   // 即 share.conn.color（便于使用和移植）
  readonly: false,                    // 即 share.conn.readonly 当前连接是否只读(此处另外存储1份，避免影响连接默认的只读设置)
  redisKey: null,
  tabName: 'info',
  dbSizeMap: {}, // 数据库大小显示
})
provide('share', share)

// 当环境发生变化时，销毁整个key和tag组件（避免状态保留）
onMounted(() => bus.on(CONN_REFRESH, toggleKeyTag))
onUnmounted(() => bus.off(CONN_REFRESH, toggleKeyTag))

// 切换连接时销毁key/tag组件
const connPrepared = ref(false)
function toggleKeyTag() {
  connPrepared.value = false
  nextTick(() => connPrepared.value = true)
}

// 切换连接时loading
const loading = ref(false)
watch(() => share.conn, async (newConn, oldConn) => {
  // 连接id未发生改变时，无需断开重连（比如颜色或db改变）
  if (newConn?.id === oldConn?.id) return

  loading.value = true
  connPrepared.value = false

  try { // 关闭旧连接
    if (oldConn) {
      await meInvoke('disconnect', {id: oldConn.id})
    }

    // 打开新连接，获取节点列表和数据库列表（TODO）
    if (newConn) {
      share.color = newConn.color
      share.readonly = !!newConn.readonly
      share.tabName = 'info'
      await meInvoke('connect', {id: newConn.id})
      connPrepared.value = true
      const data = await meInvoke('node_list', {id: share.conn.id})
      // 节点列表排序: 主节点在前面，相同类型节点按照node升序
      const nodeList = sortBy(data, 'node').reverse()
      share.nodeList = sortBy(nodeList, 'isMaster').reverse()
    }
  } catch (e) {
    // 如果从连接列表页进入的，则返回连接列表页
    if (!oldConn) share.conn = null
  } finally {
    loading.value = false
  }

}, {deep: true})

// 保存连接列表: 列表真实变化时才发送命令
const connListToString = computed(() => JSON.stringify(share.connList))
watch(connListToString, async (newConnList) => {
  const connList = JSON.parse(newConnList)
  meTauri.connList = connList // 保证导入导出连接时也进行持久化更新
  await meInvoke('conn_list', {connList})
}, {immediate: true})

// 软件自动更新
const app = reactive({
    // 软件更新
    update: null,
    downloading: false,
    downloadPercentage: 0,
  }
)
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
  <div class="redis-main" v-loading="loading">
    <el-splitter>
      <!-- 左侧键 -->
      <el-splitter-panel :min="250" size="30%">
        <div class="redis-key">
          <KeyHeader/>
          <KeyMain v-if="share.conn && connPrepared"/>
          <el-empty v-else/>
        </div>
      </el-splitter-panel>

      <!-- 右侧值 -->
      <el-splitter-panel :min="250">
        <TabConn     v-if="!share.conn"/>
        <template v-else-if="connPrepared">
          <TabMain/>
          <me-icon class="readonly-icon" plain
                     :icon="share.readonly ? 'me-icon-lock' : 'me-icon-unlock'"
                     :name="share.readonly ? t('appMain.readonly') : t('appMain.writable')"
                     :hint="true" :show-after="0"
                     @click="changeReadonly"
          />
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

  /* icon图标hover变色 */
  :deep(.icon-btn) {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
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
}
</style>
