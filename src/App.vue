<script setup>
import AppMain from '@/views/AppMain.vue'
import AppTitle from '@/views/ext/AppTitle.vue'
import {meCheckUpdate} from '@/utils/util.js'

import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import {useLocalStorage} from '@vueuse/core'

// 区域语言映射
const localeLangMap = {zhCn, en}
const lang = useLocalStorage('lang', 'en')
const locale = computed(() => localeLangMap[lang.value])

// 检查更新
onMounted(() => meCheckUpdate())
</script>

<template>
  <el-config-provider :locale>
    <AppTitle/>
    <AppMain/>
  </el-config-provider>
</template>

<style lang="scss">
#app {
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}
</style>