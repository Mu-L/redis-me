import { computed } from 'vue'

import { isZh } from '@/utils/util'

import { enCommands } from './en'
import type { CommandHelpRow } from './types'
import { redisCmdSummaryZhCn } from './zh-cn'

export type { CommandHelpRow }
export { enCommands } from './en'
export { redisCmdSummaryZhCn } from './zh-cn'

const zhCommands: CommandHelpRow[] = enCommands.map(cmd => {
  const summary = redisCmdSummaryZhCn[cmd.key] ?? cmd.summary
  return { ...cmd, summary, description: `${summary} @since ${cmd.since} 【${cmd.group}】` }
})

enCommands.forEach(command => {
  command.description = `${command.summary} @since ${command.since} [${command.group}]`
})

export const commandHelp = computed(() => (isZh.value ? zhCommands : enCommands))
