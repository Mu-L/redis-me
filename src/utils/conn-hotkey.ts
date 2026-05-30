/** AppMain 全局连接快捷键：与 ConnEmpty 展示一致 */

import type { ConnShortcutAction } from '@/types/me-interface'

export type { ConnShortcutAction }

export function isConnHotkeyBlocked(e: KeyboardEvent): boolean {
  const target = e.target
  return (
    target instanceof HTMLElement && !!target.closest('input, textarea, [contenteditable="true"]')
  )
}

/** 输入框内不触发；标点键用 e.code，避免 Ctrl 按下后 e.key 异常 */
export function matchConnShortcutAction(e: KeyboardEvent): ConnShortcutAction | null {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || isConnHotkeyBlocked(e)) return null

  if (!e.shiftKey && (e.code === 'KeyN' || e.key === 'n' || e.key === 'N')) return 'add'
  if (e.shiftKey && (e.code === 'KeyI' || e.key === 'i' || e.key === 'I')) return 'import'
  if (e.shiftKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) return 'setting'
  if (e.shiftKey && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W')) return 'newWindow'
  return null
}
