<script setup>
import {useDark} from '@vueuse/core'
import CodeMirror from 'vue-codemirror6'
import {json} from '@codemirror/lang-json'

const {mode, readOnly} = defineProps({
  mode: {type: String, default: 'application/json'},
  readOnly: {type: Boolean, default: false, required: false},
})


const dark = useDark()
const lang = json()
const phrases = {
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
</script>

<template>
  <code-mirror v-bind="$attrs" :dark :lang :phrases="phrases"/>
</template>