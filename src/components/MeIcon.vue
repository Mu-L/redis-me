<script setup lang="ts">
// 说明: 统一图标使用方式，支持el-icon-xxx图标和自定义的svg图标me-icon-xxx
withDefaults(
  defineProps<{
    icon?: string
    iconLeft?: boolean
    name?: string
    hint?: boolean
    info?: string
    placement?: string
    rawContent?: boolean
    showAfter?: number
  }>(),
  {
    icon: '',
    iconLeft: true,
    name: '',
    hint: false,
    info: '',
    placement: 'auto',
    rawContent: false,
    showAfter: 1000,
  },
)
</script>

<template>
  <div class="icon-main">
    <!-- 图标 + 文字 + 额外提示 -->
    <template v-if="info">
      <span v-if="name && !iconLeft" style="margin-right: 5px">{{ name }}</span>
      <el-tooltip
        :placement="placement"
        :content="info"
        :raw-content="rawContent"
        :show-after="showAfter">
        <el-icon v-if="icon.startsWith('el-icon-')">
          <Component :is="icon" />
        </el-icon>
        <SvgIcon v-else :name="icon" class="icon" />
      </el-tooltip>
      <span v-if="name && iconLeft" style="margin-left: 5px">{{ name }}</span>
    </template>

    <!-- 图标 + 文字提示 -->
    <template v-else-if="hint">
      <el-tooltip :placement="placement" :content="name" :show-after="showAfter">
        <el-icon v-if="icon.startsWith('el-icon-')">
          <Component :is="icon" />
        </el-icon>
        <SvgIcon v-else :name="icon" />
      </el-tooltip>
    </template>

    <!-- 图标 + 文字 -->
    <template v-else-if="name">
      <span v-if="name && !iconLeft" style="margin-right: 5px">{{ name }}</span>
      <el-icon v-if="icon.startsWith('el-icon-')">
        <Component :is="icon" />
      </el-icon>
      <SvgIcon v-else :name="icon" />
      <span v-if="name && iconLeft" style="margin-left: 5px">{{ name }}</span>
    </template>

    <template v-else>
      <el-icon v-if="icon.startsWith('el-icon-')">
        <Component :is="icon" />
      </el-icon>
      <SvgIcon v-else :name="icon" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.icon-main {
  display: flex;
  align-items: center;

  // 避免下拉框里面自带的 .el-dropdown-menu__item i 导致宽度过大
  i {
    margin-right: 0px;
  }
}
</style>
