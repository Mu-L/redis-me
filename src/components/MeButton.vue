<script setup lang="ts">
// 说明: 支持tooltip的按钮
withDefaults(
  defineProps<{
    info?: string
    placement?: string
    icon?: string
  }>(),
  {
    info: '请添加按钮提示',
    placement: 'auto',
    icon: '',
  },
)
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
