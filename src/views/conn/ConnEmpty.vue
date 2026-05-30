<script setup lang="ts">
/** 连接空状态/占位：快捷键列表（Logo 由左侧 KeyEmpty 展示）；键盘由 AppMain 全局监听 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import MeShortcut from '@/components/MeShortcut.vue'
import type { ShortcutItem } from '@/utils/shortcut-display'

const props = withDefaults(
  defineProps<{
    /** 是否展示快捷键列表（连接 loading 占位时可关闭） */
    showShortcuts?: boolean
  }>(),
  { showShortcuts: true },
)

const emit = defineEmits<{
  action: [action: string]
}>()

const { t } = useI18n()

const shortcuts = computed((): ShortcutItem[] => [
  { id: 'add', label: t('conn.add'), keys: ['mod', 'shift', 'N'] },
  { id: 'import', label: t('conn.import'), keys: ['mod', 'shift', 'I'] },
  { id: 'newWindow', label: t('conn.emptyNewWindow'), keys: ['mod', 'shift', 'W'] },
  { id: 'setting', label: t('conn.emptyAppSetting'), keys: ['mod', 'shift', 'S'] },
])
</script>

<template>
  <div class="conn-empty">
    <MeShortcut
      v-if="props.showShortcuts"
      clickable
      :items="shortcuts"
      @action="emit('action', $event)" />
  </div>
</template>

<style scoped lang="scss">
.conn-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
</style>
