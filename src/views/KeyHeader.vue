<script setup>
import { getAllWebviewWindows, WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { type } from '@tauri-apps/plugin-os'
import { nanoid } from 'nanoid'
import { useI18n } from 'vue-i18n'

import { bus, CONN_REFRESH, meErr, meInvoke, meOk } from '@/utils/util.js'
import About from '@/views/ext/About.vue'
import Official from '@/views/ext/Official.vue'
import Setting from '@/views/ext/Setting.vue'

// 共享数据
const share = inject('share')
const { t } = useI18n()

// 弹出框
const dialog = reactive({
  setting: false, // 基础设置
  info: false, // 应用信息
  social: false, // 公众号
})

// 处理额外命令
async function handleCommand(command) {
  if (command === 'refreshConn') {
    await meInvoke('connect', { id: share.conn.id })
    bus.emit(CONN_REFRESH)
  } else if ('closeConn' === command) {
    share.conn = null
  } else if ('setting' === command) {
    dialog.setting = true
  } else if ('window' === command) {
    await newWindow()
  } else if ('info' === command) {
    dialog.info = true
  } else if ('social' === command) {
    dialog.social = true
  } else {
    meOk(`TODO: ${command}`)
  }
}

// 新建窗口: 便于同时查看多个Redis实例数据
// https://tauri.app/zh-cn/reference/javascript/api/namespacewebview/
async function newWindow() {
  const isMacOS = type() === 'macos'

  // 获取所有窗口, 如果不包含main窗口则label设置为main (测试发现: 如果main窗口已关闭，创建新的窗口时, 会自动创建一个空白的main窗口)
  const windows = await getAllWebviewWindows()
  const hasMainWindow = !!windows.find(item => item.label === 'main')

  const label = hasMainWindow ? 'Window' + nanoid() : 'main'
  const appWindow = new WebviewWindow(label, {
    url: 'index.html',

    // tauri.conf.json
    title: 'RedisME',
    hiddenTitle: true,
    width: 1200,
    height: 800 + 25,
    dragDropEnabled: false,

    // src-tauri/src/utils/setup.rs:45
    titleBarStyle: 'overlay',
    decorations: isMacOS,
  })

  appWindow.once('tauri://created', function () {})
  appWindow.once('tauri://error', function (e) {
    //console.log(e)
    meErr(t('keyHeader.newWindowError'))
  })
}
</script>

<template>
  <div class="key-header">
    <el-select
      v-model="share.conn"
      :placeholder="t('keyHeader.connHint')"
      class="conn"
      clearable
      filterable
      :disabled="share.connList.length === 0"
      value-key="id">
      <el-option v-for="item in share.connList" :label="item.name" :value="item" :key="item.id">
        <div :style="{ color: item?.color }">{{ item.name }}</div>
      </el-option>

      <template #label="{ value }">
        <div :style="{ color: share.color }">{{ value.name }}</div>
      </template>
      <template #prefix>
        <me-icon :icon="share.isValkey ? 'me-icon-valkey' : 'me-icon-redis'" />
      </template>
    </el-select>

    <el-dropdown placement="bottom-end" @command="handleCommand" style="margin-left: 10px">
      <el-button type="success" icon="el-icon-operation" />
      <template #dropdown>
        <el-dropdown-menu>
          <template v-if="share.conn">
            <el-dropdown-item command="refreshConn">
              <me-icon :name="t('keyHeader.refreshConn')" icon="el-icon-refresh" />
            </el-dropdown-item>
            <el-dropdown-item command="closeConn">
              <me-icon :name="t('keyHeader.closeConn')" icon="el-icon-circle-close" />
            </el-dropdown-item>
          </template>

          <el-dropdown-item command="window" :divided="!!share.conn">
            <me-icon :name="t('keyHeader.newWindow')" icon="me-icon-window" />
          </el-dropdown-item>
          <el-dropdown-item command="setting" divided>
            <me-icon :name="t('keyHeader.setting')" icon="el-icon-setting" />
          </el-dropdown-item>
          <el-dropdown-item command="social">
            <me-icon :name="t('keyHeader.social')" icon="me-icon-social" />
          </el-dropdown-item>
          <el-dropdown-item command="info">
            <me-icon :name="t('keyHeader.about')" icon="me-icon-info" />
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!--为了方便主题语言等初始化，组件一直存在；为了方便v-model直接绑定弹框是否显示直接传入dialog-->
    <el-dialog
      v-model="dialog.setting"
      width="600"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      align-center
      draggable>
      <template #header>
        <me-icon icon="el-icon-setting" :name="t('setting.title')"></me-icon>
      </template>
      <Setting />
    </el-dialog>
    <el-dialog v-model="dialog.info" width="400" align-center draggable>
      <About />
    </el-dialog>
    <el-dialog
      v-model="dialog.social"
      width="430"
      align-center
      draggable
      :show-close="false"
      style="--el-dialog-bg-color: unset; box-shadow: unset">
      <Official />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.key-header {
  display: flex;
}
</style>
