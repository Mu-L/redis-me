<script setup>
// 说明: 支持文件选择，SSL证书相关文件
import {open, save} from '@tauri-apps/plugin-dialog'
import dayjs from 'dayjs'

const { filePrefix, fileSuffix} = defineProps({
  filePrefix: {type: String, default: ''},
  fileSuffix: {type: String, default: ''},
})
const model = defineModel({type: String})

async function openDialog() {
  const filters = fileSuffix ? [{name: '', extensions: [fileSuffix]}] : []
  let file
  if (filePrefix) {
    const fileName = `${filePrefix}_${dayjs().format('YYYYMMDDHHmmss')}.${fileSuffix}`
    file = await save({multiple: false, directory: true, filters, defaultPath: fileName})
  } else {
    file = await open({multiple: false, directory: false, filters})
  }
  if (file) {
    model.value = file
  }
}
</script>
<template>
  <el-input v-bind="$attrs" v-model="model">
    <template #append>
      <el-button type="primary" @click="openDialog">...</el-button>
    </template>
  </el-input>
</template>