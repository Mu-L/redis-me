<script setup>
import {useDark} from '@vueuse/core'
import CodeMirror from 'vue-codemirror6'
import {json} from '@codemirror/lang-json'
import {python} from '@codemirror/lang-python'
import {isZh} from '@/utils/util.js'

const {mode, readOnly} = defineProps({
  mode: {type: String, default: 'json'},
  readOnly: {type: Boolean, default: false, required: false},
})

const dark = useDark()
const lang = mode === 'json' ? json() : python()

// 语言切换及功能提示
const zhPhrases = {
  // @codemirror/view
  'Control character': '控制字符',
  // @codemirror/commands
  'Selection deleted': '所选内容已删除',
  // @codemirror/language
  'Folded lines': '折叠的行',
  'Unfolded lines': '可展开的行',
  to: '目的地',
  'folded code': '折叠的代码',
  unfold: '展开折叠',
  'Fold line': '折叠行',
  'Unfold line': '展开行的折叠',
  // @codemirror/search
  'Go to line': '转到行',
  go: '确定',
  Find: '查找',
  Replace: '替换',
  next: '▼',
  previous: '▲',
  all: '全部',
  'match case': '区分大小写',
  'by word': '按单词',
  regexp: '正则表达式',
  replace: '替换',
  'replace all': '全部替换',
  close: '关闭',
  'current match': '当前匹配项',
  'replaced $ matches': '已替换 $ 个匹配项',
  'replaced match on line $': '已替换第 $ 行的匹配项',
  'on line': '在第...行',
  // @codemirror/autocomplete
  Completions: '自动完成',
  // @codemirror/lint
  Diagnostics: '诊断信息',
  'No diagnostics': '无诊断信息',
}
const phrases = computed(() => isZh() ? zhPhrases: {})

</script>

<template>
  <code-mirror v-bind="$attrs" :dark :lang :phrases :disabled="readOnly" basic />
</template>

<style scoped lang="scss">
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

  /* JSON值在黑色模式下红色看着不舒服，因此改下 */
  :deep(.ͼe) {
    color: var(--json-value-color);
  }

  :deep(.ͼd) {
    color: var(--json-value-color);
  }
}
</style>