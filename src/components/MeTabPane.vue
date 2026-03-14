<script setup>
import { useI18n } from 'vue-i18n'

const { data } = defineProps({
  name: { type: String, required: true },
  icon: { type: String, required: true },
})

const { t } = useI18n()
</script>

<template>
  <el-tab-pane :name>
    <template #label>
      <me-icon :name="t(`tabMain.${name}`)" :icon />
    </template>
    <slot />
  </el-tab-pane>
</template>
