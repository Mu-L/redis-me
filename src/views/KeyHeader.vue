<script setup>
import {bus, CONN_REFRESH, EXPORT_DATA, IMPORT_DATA, meInvoke, meOk, mePrompt} from '@/utils/util.js'
import Setting from '@/views/ext/Setting.vue'
import About from '@/views/ext/About.vue'
import {useI18n} from 'vue-i18n'

// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)
const { t } = useI18n()

// 新增模拟数据
async function mockData() {
  mePrompt(t('keyHeader.mockHint'), {
      inputValue: 100,
      inputType: 'number',
      inputValidator: (value) => {
        if (value < 1 || value > 1000) {
          return t('keyHeader.mockValidator')
        }
       }
    },
    async ({value}) => {
      let total = value
      share.exportImportingPercentage = 0
      share.exportImporting = true
      share.exportImportingTip = t('keyMain.importing')

      try {
        while (value > 0) {
          const count = Math.min(value, 10)
          await meInvoke('mock_data', {id: share.conn.id, count})
          value = value - count
          share.exportImportingPercentage = Math.round((total - value) / total * 100)
        }
        meOk(t('keyHeader.mockOk'))
      } finally {
        share.exportImporting = false
      }

      //share.loading = true
      //try {
      //  await meInvoke('mock_data', {id: share.conn.id, count: parseInt(value)})
      //  meOk(t('keyHeader.mockOk'))
      //  bus.emit(CONN_REFRESH)
      //} finally {
      //  share.loading = false
      //}
    })
}



// 弹出框
const dialog = reactive({
  setting: false,      // 基础设置
  info: false,         // 应用信息
})

// 处理额外命令
async function handleCommand(command) {
  if (command === 'refreshConn') {
    await meInvoke('connect', {id: share.conn.id})
    bus.emit(CONN_REFRESH)
  } else if ('closeConn' === command) {
    share.conn = null
  } else if ('setting' === command) {
    dialog.setting = true
  } else if ('info' === command) {
    dialog.info = true
  } else if ('mockData' === command) {
    await mockData()
  } else if ('exportData' === command) {
    bus.emit(EXPORT_DATA)
  } else if ('importData' === command) {
    bus.emit(IMPORT_DATA)
  } else {
    meOk(`TODO: ${command}`)
  }
}
</script>

<template>
  <div class="key-header">
    <el-select v-model="share.conn" :placeholder="t('keyHeader.connHint')" class="conn" clearable
               filterable :disabled="share.connList.length === 0" value-key="id">
      <el-option v-for="item in share.connList" :label="item.name" :value="item" :key="item.id">
        <div :style="{color: item?.color}">{{ item.name }}</div>
      </el-option>

      <template #label="{ value }">
        <div :style="{color: share.color}">{{ value.name }}</div>
      </template>
      <template #prefix>
        <me-icon icon="me-icon-redis"/>
      </template>
    </el-select>

    <el-dropdown placement="bottom-end" @command="handleCommand" style="margin-left: 10px">
      <el-button type="success" icon="el-icon-operation"/>
      <template #dropdown>
        <el-dropdown-menu>
          <template v-if="share.conn">
            <el-dropdown-item command="refreshConn">
              <me-icon :name="t('keyHeader.refreshConn')" icon="el-icon-refresh"/>
            </el-dropdown-item>
            <el-dropdown-item command="closeConn">
              <me-icon :name="t('keyHeader.closeConn')" icon="el-icon-circle-close"/>
            </el-dropdown-item>

            <el-dropdown-item command="mockData" divided v-if="canEdit">
              <me-icon :name="t('keyHeader.mockData')" icon="el-icon-coffee-cup"/>
            </el-dropdown-item>
            <el-dropdown-item command="exportData">
              <me-icon :name="t('keyHeader.exportData')" icon="el-icon-upload"/>
            </el-dropdown-item>
            <el-dropdown-item command="importData" v-if="canEdit">
              <me-icon :name="t('keyHeader.importData')" icon="el-icon-download"/>
            </el-dropdown-item>
          </template>

          <el-dropdown-item command="setting" :divided="!!share.conn">
            <me-icon :name="t('keyHeader.setting')" icon="el-icon-setting"/>
          </el-dropdown-item>
          <el-dropdown-item command="info">
            <me-icon :name="t('keyHeader.about')" icon="me-icon-info"/>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!--为了方便主题语言等初始化，组件一直存在；为了方便v-model直接绑定弹框是否显示直接传入dialog-->
    <el-dialog :title="t('setting.title')" v-model="dialog.setting" width="600"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               align-center draggable>
      <Setting/>
    </el-dialog>
    <el-dialog v-model="dialog.info" width="400" align-center draggable>
      <About/>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.key-header {
  display: flex;
}
</style>
