<script setup>
import wechat from '@/assets/images/wechat.png'
import bilibili from '@/assets/images/bilibili.png'
</script>

<template>
  <div class="app-official">
    <el-image :src="wechat" class="img" />
    <el-image :src="bilibili" class="img" />
  </div>
</template>

<style scoped lang="scss">
.app-official {
  .img {
    width: 400px;
    margin-top: 5px;
  }
}
</style>
