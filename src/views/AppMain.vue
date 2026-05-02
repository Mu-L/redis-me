<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { check } from '@tauri-apps/plugin-updater'
import { computed, nextTick, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  appProvideKey,
  shareProvideKey,
  type AppMainInject,
  type AppMainShare,
  type ConnListWindowsSyncPayload,
  type UiConn,
} from '@/types/me-interface'
import type { ConnConfig } from '@/types/tauri-specta'
import {
  bus,
  CONN_LIST_WINDOWS_SYNC,
  CONN_REFRESH,
  meCommands,
  meJsonParse,
  meOk,
} from '@/utils/util'
import KeyHeader from '@/views/KeyHeader.vue'
import KeyMain from '@/views/KeyMain.vue'
import TabConn from '@/views/TabConn.vue'

import TabMain from './TabMain.vue'

const { t } = useI18n()

// 共享数据
const share = reactive<AppMainShare>({
  conn: null,
  connList: meTauri.connList as UiConn[],
  nodeList: [],
  loading: false,
  color: 'var(--el-color-primary)',
  readonly: false,
  redisKey: null,
  tabName: 'info',
  dbSizeMap: {},

  exportImporting: false,
  exportImportingTip: '',
  exportImportingPercentage: 0,

  isValkey: false,
  serverVersion: '',

  capabilities: {
    hashFieldTtl: false,
  },
})
provide(shareProvideKey, share)

// 当环境发生变化时，销毁整个key和tag组件（避免状态保留）
onMounted(() => bus.on(CONN_REFRESH, toggleKeyTag))
onUnmounted(() => bus.off(CONN_REFRESH, toggleKeyTag))

// 切换连接时销毁key/tag组件
const connPrepared = ref(false)
function toggleKeyTag(): void {
  connPrepared.value = false
  void nextTick(() => {
    connPrepared.value = true
  })
}

// 切换连接时loading
watch(
  () => JSON.stringify(share.conn),
  async (newConnStr, oldConnStr) => {
    const newConn = meJsonParse(newConnStr) as UiConn | null
    const oldConn = meJsonParse(oldConnStr) as UiConn | null

    const index = share.connList.findIndex(c => c.id === newConn?.id)
    if (index !== -1 && newConn) {
      share.connList[index] = newConn
    }

    if (newConn?.id === oldConn?.id) return

    share.loading = true
    connPrepared.value = false

    try {
      if (oldConn) {
        await meCommands.disconnect(oldConn.id)
      }

      if (newConn) {
        share.color = newConn.color ?? 'var(--el-color-primary)'
        share.readonly = !!newConn.readonly
        share.tabName = 'info'
        share.capabilities = await meCommands.connect(newConn.id)
        connPrepared.value = true
      }
    } catch {
      if (!oldConn) share.conn = null
    } finally {
      share.loading = false
    }
  },
  { deep: true },
)

const tauriWindow = getCurrentWindow()
const connListToString = computed(() => JSON.stringify(share.connList))
watch(
  connListToString,
  async newConnList => {
    const connList = meJsonParse(newConnList) as UiConn[]
    meTauri.connList = connList as MeTauriGlobal['connList']

    await meCommands.connList(connList as ConnConfig[])
    const payload: ConnListWindowsSyncPayload = {
      connList,
      label: tauriWindow.label,
    }
    await tauriWindow.emit(CONN_LIST_WINDOWS_SYNC, payload)
  },
  { immediate: true },
)

onMounted(
  () =>
    void tauriWindow.listen(CONN_LIST_WINDOWS_SYNC, e => {
      share.connList = (e.payload as ConnListWindowsSyncPayload).connList
    }),
)

const app = reactive<AppMainInject>({
  update: null,
  downloading: false,
  downloadPercentage: 0,
})
provide(appProvideKey, app)
async function checkAutoUpdate(): Promise<void> {
  if (!meTauri.settings.autoUpdate) return
  app.update = await check().catch((): null => null)
}
onMounted(checkAutoUpdate)

function changeReadonly(): void {
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
