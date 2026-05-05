<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="key-empty">
    <div class="image-bg">
      <SvgIcon name="me-icon-logo-color" style="font-size: 60px;" />
    </div>
    <el-text type="info" style="margin-top: 30px;">{{ t('keyEmpty.tagline') }}</el-text>
  </div>
</template>

<style scoped lang="scss">
.key-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  .image-bg {
    position: relative;
    background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
    width: 100px;
    height: 100px;
    filter: blur(68px);
    border-radius: 50%;
  }
}
</style>
