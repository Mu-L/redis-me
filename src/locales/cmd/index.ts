import { computed } from 'vue'

import { isZh } from '@/utils/util'

import { enCommands } from './en'
import { isReadonlyCommand } from './readonly'
import type { CommandHelpRow } from './types'
import { redisCmdSummaryZhCn } from './zh-cn'

export type { CommandHelpRow }
export { enCommands } from './en'
export { redisCmdSummaryZhCn } from './zh-cn'
export { isReadonlyCommand, parseCommandName } from './readonly'

function withReadonly(cmd: CommandHelpRow): CommandHelpRow {
  return { ...cmd, readonly: isReadonlyCommand(cmd.key) }
}

const enHelp: CommandHelpRow[] = enCommands.map(cmd => {
  const row = withReadonly(cmd)
  row.description = `${row.summary} @since ${row.since} [${row.group}]`
  return row
})

const zhHelp: CommandHelpRow[] = enHelp.map(cmd => {
  const summary = redisCmdSummaryZhCn[cmd.key] ?? cmd.summary
  return { ...cmd, summary, description: `${summary} @since ${cmd.since} 【${cmd.group}】` }
})

export const commandHelp = computed(() => (isZh.value ? zhHelp : enHelp))
