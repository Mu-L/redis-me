<script setup lang="ts">
import { inject, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import { getConnIcon } from '@/utils/conn-group'
import { bus, CONN_REFRESH, meCommands, meOk, openNewWindow } from '@/utils/util'
import About from '@/views/ext/About.vue'
import Official from '@/views/ext/Official.vue'
import Setting from '@/views/ext/Setting.vue'

const share = inject(shareProvideKey)!
const { t } = useI18n()

const dialog = reactive({
  setting: false,
  info: false,
  social: false,
})

async function handleCommand(command: string): Promise<void> {
  if (command === 'refreshConn') {
    if (!share.conn) return
    share.capabilities = await meCommands.connect(share.conn!.id)
    bus.emit(CONN_REFRESH)
  } else if ('closeConn' === command) {
    share.conn = null
  } else if ('setting' === command) {
    dialog.setting = true
  } else if ('window' === command) {
    await openNewWindow()
  } else if ('info' === command) {
    dialog.info = true
  } else if ('social' === command) {
    dialog.social = true
  } else {
    meOk(`TODO: ${command}`)
  }
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
        <div :style="{ color: item?.color }">
          <me-icon :icon="getConnIcon(item)" :name="item.name" />
        </div>
      </el-option>

      <template #label="{ value }">
        <div :style="{ color: share.color }">
          <me-icon :icon="getConnIcon(value)" :name="value.name" />
        </div>
      </template>
      <!-- 
      <template #prefix>
        <me-icon :icon="share.isValkey ? 'me-icon-valkey' : 'me-icon-redis'" />
      </template>
      -->
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
