<script setup>
// 说明: 支持tooltip的按钮
defineProps({
  info: { type: String, default: '请添加按钮提示' },
  placement: { type: String, default: 'auto' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <el-tooltip :content="info" :show-after="1000" :placement="placement">
    <el-button v-bind="$attrs" :icon="icon" v-if="icon.startsWith('el-icon')">
      <template v-for="(item, key, index) in $slots" :key="index" v-slot:[key]>
        <slot :name="key"></slot>
      </template>
    </el-button>
    <el-button v-bind="$attrs" v-else>
      <template #icon>
        <SvgIcon :name="icon" />
      </template>
      <template v-for="(item, key, index) in $slots" :key="index" v-slot:[key]>
        <slot :name="key"></slot>
      </template>
    </el-button>
  </el-tooltip>
</template>
