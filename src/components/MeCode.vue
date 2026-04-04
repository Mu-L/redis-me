<script setup>
import { json } from '@codemirror/lang-json'
import { python } from '@codemirror/lang-python'
import { useDark } from '@vueuse/core'
import CodeMirror from 'vue-codemirror6'

import { meBasicSetup, zhPhrases } from '@/plugins/codemirror.js'
import { isZh } from '@/utils/util.js'

const { mode, readOnly } = defineProps({
  mode: { type: String, default: 'json' },
  readOnly: { type: Boolean, default: false, required: false },
})

const dark = useDark()
const lang = mode === 'json' ? json() : python() // 暂未找到ini或properties的语法高亮，暂用python代替（也是#作为注释）
const phrases = computed(() => (isZh.value ? zhPhrases : {}))
const extensions = [meBasicSetup] // 不使用默认的basicSetup，自己定义扩展（取消高亮当前行等）
</script>

<template>
  <!-- https://github.com/logue/vue-codemirror6  -->
  <code-mirror
    v-bind="$attrs"
    :dark
    :lang
    :phrases
    :readonly="readOnly"
    :extensions
    :class="readOnly ? ['codemirror-opacity', 'is-disabled'] : []" />
</template>

<style scoped lang="scss">
.codemirror-opacity {
  opacity: 0.6;
}

.vue-codemirror {
  height: 100%;
  font-size: 15px;

  /* 默认高度 */
  :deep(.cm-editor) {
    height: 100%;
  }

  /* 字体设置 */
  :deep(.cm-scroller) {
    font-family: var(--code-font);
  }
}

html.dark .vue-codemirror {
  background-color: #272822;

  :deep(.ͼ3 .cm-gutters) {
    background-color: #272822;
  }

  /* JSON值在黑色模式下红色看着不舒服，因此改下 */
  /* Json的字符串值 */
  :deep(.ͼe) {
    color: #e6db74;
  }

  /* Json的布尔值 */
  :deep(.ͼc) {
    color: var(--el-color-primary);
  }

  /* Json的数字值 */
  :deep(.ͼd) {
    color: var(--el-color-success);
  }
}
</style>
