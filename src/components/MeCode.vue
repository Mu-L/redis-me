<script setup lang="ts">
import { LanguageSupport, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { properties as propertiesMode } from '@codemirror/legacy-modes/mode/properties'
import { useDark } from '@vueuse/core'
import { json5 as cmJson5 } from 'codemirror-json5'
import { computed } from 'vue'
import CodeMirror from 'vue-codemirror6'

import {
  meBasicSetup,
  propertiesDarkSyntax,
  propertiesEagerParse,
  zhPhrases,
} from '@/plugins/codemirror'
import { isZh } from '@/utils/util'

/** Java .properties 流式解析：适配 Redis INFO/CONFIG（key:value、# 段注释、续行） */
const propertiesLang = new LanguageSupport(StreamLanguage.define(propertiesMode))

const props = withDefaults(
  defineProps<{
    /** `json` / `json5` 均使用 JSON5 语法高亮（合法 JSON 也可）；`properties` 为 Redis INFO/CONFIG */
    mode?: string
    readOnly?: boolean
  }>(),
  {
    mode: 'json',
    readOnly: false,
  },
)

const dark = useDark()
const lang = computed(() => {
  if (props.mode === 'json' || props.mode === 'json5') return cmJson5()
  if (props.mode === 'properties') return propertiesLang
  return undefined
})
const phrases = computed(() => (isZh.value ? zhPhrases : {}))
const extensions = computed(() => {
  const list = [meBasicSetup]
  if (props.mode === 'properties') {
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
    :extensions
    :readonly="props.readOnly"
    :class="props.readOnly ? ['codemirror-opacity', 'is-disabled'] : []" />
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

  /* Json5的注释 */
  :deep(.ͼm) {
    color: #75715e;
  }
}
</style>
