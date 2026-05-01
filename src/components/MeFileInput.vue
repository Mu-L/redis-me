<script setup lang="ts">
// 说明: 支持文件选择，SSL证书相关文件
import { open, save } from '@tauri-apps/plugin-dialog'
import dayjs from 'dayjs'

const props = withDefaults(
  defineProps<{
    filePrefix?: string
    fileSuffix?: string
  }>(),
  {
    filePrefix: '',
    fileSuffix: '',
  },
)
const model = defineModel<string>({ default: '' })

async function openDialog(): Promise<void> {
  const filters = props.fileSuffix ? [{ name: '', extensions: [props.fileSuffix] }] : []
  let file: string | null = null
  if (props.filePrefix) {
    const fileName = `${props.filePrefix}_${dayjs().format('YYYYMMDDHHmmss')}.${props.fileSuffix}`
    file = await save({ multiple: false, directory: true, filters, defaultPath: fileName })
  } else {
    file = await open({ multiple: false, directory: false, filters })
  }
  if (file) model.value = file
}
</script>
<template>
  <el-input v-bind="$attrs" v-model="model">
    <template #append>
      <el-button type="primary" @click="openDialog">...</el-button>
    </template>
  </el-input>
</template>
