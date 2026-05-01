<script setup>
import { json } from '@codemirror/lang-json'
import { StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { properties as propertiesMode } from '@codemirror/legacy-modes/mode/properties'
import { useDark } from '@vueuse/core'
import CodeMirror from 'vue-codemirror6'

import {
  meBasicSetup,
  propertiesDarkSyntax,
  propertiesEagerParse,
  zhPhrases,
} from '@/plugins/codemirror.js'
import { isZh } from '@/utils/util'

/** Java .properties 流式解析：适配 Redis INFO/CONFIG（key:value、# 段注释、续行） */
const propertiesLang = StreamLanguage.define(propertiesMode)

const { mode, readOnly } = defineProps({
  mode: { type: String, default: 'json' },
  readOnly: { type: Boolean, default: false, required: false },
})

const dark = useDark()
const lang = computed(() => {
  if (mode === 'json') return json()
  if (mode === 'properties') return propertiesLang
  return null
})
const phrases = computed(() => (isZh.value ? zhPhrases : {}))
const extensions = computed(() => {
  const list = [meBasicSetup]
  if (mode === 'properties') {
    list.push(syntaxHighlighting(propertiesDarkSyntax), propertiesEagerParse)
  }
  return list
})
</script>

<template>
  <!-- https://github.com/logue/vue-codemirror6  -->
  <code-mirror
    v-bind="$attrs"
    :dark
    :lang
    :phrases
    :readonly="readOnly"
    :extensions="extensions"
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
