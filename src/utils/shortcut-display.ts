/** 快捷键展示：mod/shift/alt 与 ConnEmpty、MeShortcut 共用 */

export type ShortcutKey = 'mod' | 'shift' | 'alt' | string

export interface ShortcutItem {
  /** 可点击项的动作 id（ConnEmpty 等） */
  id?: string
  label: string
  keys: ShortcutKey[]
  /** 与上一项之间加大间距，用于分组 */
  gapBefore?: boolean
}

export function displayShortcutKey(key: ShortcutKey, isMacOS: boolean): string {
  if (key === 'mod') return isMacOS ? '⌘' : 'Ctrl'
  if (key === 'shift') return isMacOS ? '⇧' : 'Shift'
  if (key === 'alt') return isMacOS ? '⌥' : 'Alt'
  if (key === ',') return ','
  if (key.length === 1 && /[a-zA-Z]/.test(key)) return key.toUpperCase()
  return key
}

/** 末尾单字母键固定宽度；符号/多字符键用 kbd-mod 自适应宽度 */
export function shortcutKbdClass(key: ShortcutKey, index: number, total: number): string {
  if (key === 'mod' || key === 'shift' || key === 'alt') return 'kbd-mod'
  if (key.length > 1) return 'kbd-mod'
  if (index === total - 1 && /^[a-zA-Z0-9]$/.test(key)) return 'kbd-last'
  return 'kbd-mod'
}
