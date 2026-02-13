<script setup>
import {meCopy, meInvoke, meOk} from '@/utils/util.js'
import {listen} from '@tauri-apps/api/event'
import {useI18n} from 'vue-i18n'

const { t } = useI18n()
// 共享数据
const share = inject('share')
const canEdit = computed(() => !share.readonly)

const channel = ref('')
const keyword = ref('')
const subscribing = ref(false)
const dataList = ref([])
const filterDataList = computed(() => {
  const key = keyword.value.toLowerCase()
  return dataList.value.filter(row => !key
    || row.channel?.toLowerCase().indexOf(key) > -1
    || row.message?.toLowerCase().indexOf(key) > -1
  )
})

// 订阅按钮防抖
const loading = ref(false)
const subscribe = async () => {
  loading.value = true
  try {
    if (subscribing.value) {
      await unlisten()
      await meInvoke('subscribe_stop', {id: share.conn.id})
      subscribing.value = false
      meOk(t('redisPubSub.subscribeStopped'))
    } else {
      await tauriListen()
      await meInvoke('subscribe', {id: share.conn.id, channel: channel.value})
      subscribing.value = true
      meOk(t('redisPubSub.subscribeStarted'))
    }
  } finally {
    loading.value = false
  }
}

// 发送消息
const sendChannel = ref('')
const sendMessage = ref('')
const sendLoading = ref(false)
async function publish() {
  sendLoading.value = true
  try {
    await meInvoke('publish', {id: share.conn.id, channel: sendChannel.value, message: sendMessage.value})
    meOk(t('redisPubSub.publishOk'))
  } finally {
    sendLoading.value = false
  }
}

function clearData() {
  dataList.value = []
  //meConfirm('确定清空消息吗？', () => dataList.value = [])
}

// 监听消息
let unlisten = null
async function tauriListen() {
  unlisten = await listen('subscribe', (event) => {
    const payload = event.payload
    if (payload.id !== share.conn.id) return
    dataList.value.push(event.payload)
  })
}

async function tauriUnlisten() {
  if (unlisten) {
    unlisten()
  }
}
onUnmounted(() => tauriUnlisten())
</script>

<template>
  <div class="redis-pubsub">
    <div class="me-flex">
      <div>
        <el-input v-model="channel" style="width: 160px; margin-right: 10px"
                  :placeholder="t('redisPubSub.subscribeChannel')" :disabled="subscribing" clearable/>
      </div>
      <div>
        <me-button icon="el-icon-delete" :info="t('redisPubSub.clearMessage')"
                   @click="clearData" :disabled="dataList.length === 0" placement="top"/>
        <el-input  v-model="keyword" :placeholder="t('redisPubSub.keyword')" style="width: 280px; margin:0 10px" clearable/>
        <el-button :icon="subscribing ? 'el-icon-video-pause' : 'el-icon-video-play'"
                   :loading="loading"
                   @click="subscribe" type="primary">
          {{subscribing ? t('redisPubSub.subscribeStop') : t('redisPubSub.subscribeStart')}}
        </el-button>
      </div>
    </div>
    <div class="table">
      <el-table :data="filterDataList" ref="table" border stripe height="100%">
        <el-table-column :label="t('redisPubSub.datetime')" prop="datetime" sortable width="200"/>
        <el-table-column :label="t('redisPubSub.channel')" prop="channel"  show-overflow-tooltip/>
        <el-table-column :label="t('redisPubSub.message')" prop="message"  show-overflow-tooltip/>
        <el-table-column :label="t('action')" width="80" align="center">
          <template #default="scope">
            <me-icon :info="t('copy')" icon="el-icon-document-copy" class="icon-btn"
                     @click="meCopy(scope.row.message)" style="justify-content: center"/>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="footer" v-if="canEdit">
      <el-input v-model="sendChannel" :placeholder="t('redisPubSub.channel')" style="width: 200px"></el-input>
      <el-input v-model="sendMessage" :placeholder="t('redisPubSub.messageContent')" style="margin: 0 10px"></el-input>
      <el-button icon="el-icon-promotion" @click="publish" type="warning" :loading="sendLoading"
                 :disabled="!(sendChannel && sendMessage)">{{ t('redisPubSub.send') }}</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-pubsub {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  .table {
    flex-grow: 1;
    height: 0;
    margin: 10px 0;
  }

  .footer {
    display: flex;
  }
}
</style>
