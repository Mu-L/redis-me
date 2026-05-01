import { commands as spectaCommands } from '@/bindings/tauri-specta'
import type { RedisNode } from '@/bindings/tauri-specta'

/** node_list 原始项经 enrich 后供 UI 使用 */
export interface EnrichedRedisNode extends RedisNode {
  isMaster: boolean
  isSlave: boolean
  shortLabel: string
  masterSlots?: string | null
  slotsTooltip: string
}

export interface KeyTypeListItem {
  short: string
  value: string
  type: string
}

/** 检查更新 / 下载安装时的 UI 状态（由注入的 app 提供） */
export interface MeAppUpdateState {
  downloading: boolean
  downloadPercentage: number
}

type UnwrapSpectaPromise<R> =
  R extends Promise<infer P> ? (P extends { status: 'ok'; data: infer D } ? D : never) : never

type WrapSpectaCommand<F> = F extends (...args: infer A) => infer R
  ? R extends Promise<unknown>
    ? (...args: [...A, (false | undefined)?]) => Promise<UnwrapSpectaPromise<R>>
    : F
  : F

type SpectaCommandsMap = typeof spectaCommands

/** `meCommands`：与 specta `commands` 同签名，返回值已解包；末尾可传 `false` 关闭错误弹窗 */
export type MeCommands = {
  [K in keyof SpectaCommandsMap]: SpectaCommandsMap[K] extends (...args: never[]) => unknown
    ? WrapSpectaCommand<SpectaCommandsMap[K]>
    : SpectaCommandsMap[K]
}
