/** 全局连接快捷键列表：ConnEmpty、设置页共用，与 conn-hotkey 按键一致 */

import type { ComposerTranslation } from 'vue-i18n'

import type { ShortcutItem } from '@/utils/shortcut-display'

export function getConnGlobalShortcuts(t: ComposerTranslation): ShortcutItem[] {
  return [
    { id: 'add', label: t('conn.add'), keys: ['mod', 'shift', 'N'] },
    { id: 'import', label: t('conn.import'), keys: ['mod', 'shift', 'I'] },
    { id: 'newWindow', label: t('conn.emptyNewWindow'), keys: ['mod', 'shift', 'W'] },
    { id: 'setting', label: t('conn.emptyAppSetting'), keys: ['mod', 'shift', 'S'] },
  ]
}
