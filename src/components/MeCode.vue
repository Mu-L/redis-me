<script setup>
import {useDark} from '@vueuse/core'
import CodeMirror from 'vue-codemirror6'
import {json} from '@codemirror/lang-json'
import {python} from '@codemirror/lang-python'
import {isZh} from '@/utils/util.js'
import {meBasicSetup, zhPhrases} from '@/plugins/codemirror.js'

const {mode, readOnly} = defineProps({
  mode: {type: String, default: 'json'},
  readOnly: {type: Boolean, default: false, required: false},
})

const dark = useDark()
const lang = mode === 'json' ? json() : python() // 暂未找到ini或properties的语法高亮，暂用python代替（也是#作为注释）
const phrases = computed(() => isZh.value ? zhPhrases: {})
const extensions = [meBasicSetup] // 不使用默认的basicSetup，自己定义扩展（取消高亮当前行等）
</script>

<template>
  <!-- https://github.com/logue/vue-codemirror6  -->
  <code-mirror v-bind="$attrs" :dark :lang :phrases :readonly="readOnly" :extensions
               :class="readOnly ? ['codemirror-opacity' , 'is-disabled'] : []" />
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

  /* JSON值在黑色模式下红色看着不舒服，因此改下 */
  :deep(.ͼe) {
    color: #e6db74;
  }

  :deep(.ͼd) {
    color: #e6db74;
  }

  :deep(.ͼ3 .cm-gutters) {
    background-color: #272822;
  }
}
</style>