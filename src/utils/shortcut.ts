/** 快捷键：展示格式、连接按键匹配、各页快捷键列表 */

import type { ComposerTranslation } from 'vue-i18n'

import type { ConnShortcutAction } from '@/types/me-interface'

/** 快捷键按键 token；`mod`/`shift`/`alt` 由 MeShortcut 按平台渲染 */
export type ShortcutKey = 'mod' | 'shift' | 'alt' | string

/** MeShortcut 列表项；各 get*Shortcuts 返回此结构 */
export interface ShortcutItem {
  /** 可点击项的动作 id（ConnEmpty 点击行时 emit） */
  id?: string
  label: string
  keys: ShortcutKey[]
  /** 与上一项之间加大间距，用于分组 */
  gapBefore?: boolean
}

/** 单键展示文案；MeShortcut 渲染 kbd 时调用 */
export function displayShortcutKey(key: ShortcutKey, isMacOS: boolean): string {
  if (key === 'mod') return isMacOS ? '⌘' : 'Ctrl'
  if (key === 'shift') return isMacOS ? '⇧' : 'Shift'
  if (key === 'alt') return isMacOS ? '⌥' : 'Alt'
  if (key === ',') return ','
  if (key.length === 1 && /[a-zA-Z]/.test(key)) return key.toUpperCase()
  return key
}

/** kbd 样式类名；MeShortcut 渲染按键时调用 */
export function shortcutKbdClass(key: ShortcutKey, index: number, total: number): string {
  if (key === 'mod' || key === 'shift' || key === 'alt') return 'kbd-mod'
  if (key.length > 1) return 'kbd-mod'
  if (index === total - 1 && /^[a-zA-Z0-9]$/.test(key)) return 'kbd-last'
  return 'kbd-mod'
}

/** 连接快捷键动作；AppMain.runConnAction、TabConn 分发 */
export type { ConnShortcutAction }

/** 焦点在输入框/可编辑区时不响应连接快捷键；matchConnShortcutAction 内部使用 */
export function isConnHotkeyBlocked(e: KeyboardEvent): boolean {
  const target = e.target
  return (
    target instanceof HTMLElement && !!target.closest('input, textarea, [contenteditable="true"]')
  )
}

/** 全局连接快捷键匹配；AppMain document keydown → runConnAction（标点键用 e.code）。与 getConnGlobalShortcuts 按键一致 */
export function matchConnShortcutAction(e: KeyboardEvent): ConnShortcutAction | null {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || isConnHotkeyBlocked(e)) return null

  if (e.shiftKey && (e.code === 'KeyN' || e.key === 'n' || e.key === 'N')) return 'add'
  if (e.shiftKey && (e.code === 'KeyI' || e.key === 'i' || e.key === 'I')) return 'import'
  if (e.shiftKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) return 'setting'
  if (e.shiftKey && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W')) return 'newWindow'
  return null
}

/** 连接页/设置页全局快捷键列表；ConnEmpty、Setting → MeShortcut */
export function getConnGlobalShortcuts(t: ComposerTranslation): ShortcutItem[] {
  return [
    { id: 'add', label: t('conn.add'), keys: ['mod', 'shift', 'N'] },
    { id: 'import', label: t('conn.import'), keys: ['mod', 'shift', 'I'] },
    { id: 'newWindow', label: t('conn.emptyNewWindow'), keys: ['mod', 'shift', 'W'] },
    { id: 'setting', label: t('conn.emptyAppSetting'), keys: ['mod', 'shift', 'S'] },
  ]
}

/** 键值页编辑器快捷键列表；RedisValue 快捷键弹窗 → MeShortcut */
export function getValueShortcuts(t: ComposerTranslation): ShortcutItem[] {
  return [
    { label: t('redisValue.keyShort.fullscreen'), keys: ['F11'] },
    { label: t('redisValue.keyShort.toggleWrap'), keys: ['mod', 'L'] },
    { label: t('redisValue.keyShort.toggleLineNumbers'), keys: ['mod', 'N'] },
    { label: t('redisValue.keyShort.fontIncrease'), keys: ['mod', '='], gapBefore: true },
    { label: t('redisValue.keyShort.fontDecrease'), keys: ['mod', '-'] },
    { label: t('redisValue.keyShort.fontReset'), keys: ['mod', '0'] },
    { label: t('redisValue.keyShort.find'), keys: ['mod', 'F'], gapBefore: true },
    { label: t('redisValue.keyShort.findNext'), keys: ['mod', 'G'] },
    { label: t('redisValue.keyShort.undo'), keys: ['mod', 'Z'] },
    { label: t('redisValue.keyShort.redo'), keys: ['mod', 'Y'] },
  ]
}

/** 终端页快捷键列表；RedisTerminal 快捷键弹窗 → MeShortcut */
export function getTerminalShortcuts(t: ComposerTranslation): ShortcutItem[] {
  return [
    { label: t('redisTerminal.keyShort.fullscreen'), keys: ['F11'] },
    { label: t('redisTerminal.keyShort.execute'), keys: ['Enter'] },
    { label: t('redisTerminal.keyShort.complete'), keys: ['Tab'] },
    { label: t('redisTerminal.keyShort.history'), keys: ['↑', '↓'] },
    { label: t('redisTerminal.keyShort.clearScreen'), keys: ['mod', 'L'], gapBefore: true },
    { label: t('redisTerminal.keyShort.clearInput'), keys: ['mod', 'C'] },
    { label: t('redisTerminal.keyShort.cursorStart'), keys: ['mod', 'A'] },
    { label: t('redisTerminal.keyShort.cursorEnd'), keys: ['mod', 'E'] },
    { label: t('redisTerminal.keyShort.cmdClear'), keys: ['clear'], gapBefore: true },
    { label: t('redisTerminal.keyShort.cmdHelp'), keys: ['help'] },
    { label: t('redisTerminal.keyShort.cmdOpen'), keys: ['open'] },
  ]
}
