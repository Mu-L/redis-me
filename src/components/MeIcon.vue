<script setup>
// 说明: 统一图标使用方式，支持el-icon-xxx图标和自定义的svg图标me-icon-xxx
defineProps({
  icon: { type: String, default: '' }, // 图标
  iconLeft: { type: Boolean, default: true },
  name: { type: String, default: '' }, // 文字
  hint: { type: Boolean, default: false }, // 文字是否显示为提示(tooltip)
  info: { type: String, default: '' }, // 图标 + 文字 + 额外的提示
  placement: { type: String, default: 'auto' },
  rawContent: { type: Boolean, default: false },
  showAfter: { type: Number, default: 1000 },
})
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
