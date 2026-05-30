<script setup lang="ts">
/** 连接空状态/占位：快捷键列表（Logo 由左侧 KeyEmpty 展示）；键盘由 AppMain 全局监听 */
import { type as getOsType } from '@tauri-apps/plugin-os'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type ConnEmptyShortcut = {
  action: string
  label: string
  /** mod=Ctrl/⌘，shift=Shift/⇧，alt=Alt/⌥，其余为单键展示 */
  keys: ('mod' | 'shift' | 'alt' | string)[]
}

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
const isMacOS = getOsType() === 'macos'

const shortcuts = computed((): ConnEmptyShortcut[] => [
  { action: 'add', label: t('conn.add'), keys: ['mod', 'N'] },
  { action: 'import', label: t('conn.import'), keys: ['mod', 'shift', 'I'] },
  { action: 'newWindow', label: t('conn.emptyNewWindow'), keys: ['mod', 'shift', 'W'] },
  { action: 'setting', label: t('conn.emptyAppSetting'), keys: ['mod', 'shift', 'S'] },
])

function displayKey(key: ConnEmptyShortcut['keys'][number]): string {
  if (key === 'mod') return isMacOS ? '⌘' : 'Ctrl'
  if (key === 'shift') return isMacOS ? '⇧' : 'Shift'
  if (key === 'alt') return isMacOS ? '⌥' : 'Alt'
  if (key === ',') return ','
  return key.length === 1 ? key.toUpperCase() : key
}

function kbdClass(key: ConnEmptyShortcut['keys'][number], index: number, total: number): string {
  if (key === 'mod' || key === 'shift' || key === 'alt') return 'kbd-mod'
  if (index === total - 1) return 'kbd-last'
  return ''
}
</script>

<template>
  <div class="conn-empty">
    <ul v-if="props.showShortcuts" class="shortcut-list">
      <li v-for="item in shortcuts" :key="item.action">
        <button type="button" class="shortcut-row" @click="emit('action', item.action)">
          <span class="shortcut-label">{{ item.label }}</span>
          <span class="shortcut-keys" aria-hidden="true">
            <template v-for="(key, i) in item.keys" :key="i">
              <kbd :class="kbdClass(key, i, item.keys.length)">{{ displayKey(key) }}</kbd>
              <span v-if="i < item.keys.length - 1" class="shortcut-plus">+</span>
            </template>
          </span>
        </button>
      </li>
    </ul>
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
  user-select: none;

  .shortcut-list {
    margin: 0;
    padding: 0;
    list-style: none;
    width: min(400px, 100%);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .shortcut-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    width: 100%;
    padding: 5px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    font: inherit;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    text-align: left;

    &:hover {
      background: color-mix(in srgb, var(--el-fill-color-light) 55%, transparent);
      color: var(--el-text-color-regular);
    }
  }

  .shortcut-label {
    flex: 1;
    min-width: 0;
  }

  /* 固定宽度列，各行快捷键右缘对齐（仿 Cursor） */
  .shortcut-keys {
    flex: 0 0 168px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    font-size: 14px;
  }

  .shortcut-plus {
    flex-shrink: 0;
    width: 10px;
    text-align: center;
    opacity: 0.45;
    font-size: 14px;
  }

  kbd {
    flex-shrink: 0;
    box-sizing: border-box;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 5px;
    background: var(--el-fill-color-dark);
    color: var(--el-text-color-secondary);
    font-family: inherit;
    font-size: 12px;
    line-height: 1.3;
    text-align: center;
    box-shadow: 0 1px 0 color-mix(in srgb, var(--el-border-color) 80%, transparent);
  }

  kbd.kbd-mod {
    padding: 3px 7px;
  }

  /* 仅末尾字母固定宽度，保证各行快捷键右缘对齐 */
  kbd.kbd-last {
    width: 28px;
    padding: 3px 0;
  }
}
</style>
