import type { Update } from '@tauri-apps/plugin-updater'

import { commands as spectaCommands } from '@/types/tauri-specta'
import type {
  ConnConfig,
  RedisKey_Deserialize,
  RedisNode,
  ServerCapabilities,
} from '@/types/tauri-specta'

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

/** 存储/列表中的连接 + 界面字段（颜色、只读等） */
export type UiConn = ConnConfig & {
  color?: string
  readonly?: boolean
  meta?: Record<string, unknown>
}

/** AppMain `provide('share')` 的响应式状态 */
export interface AppMainShare {
  conn: UiConn | null
  connList: UiConn[]
  nodeList: EnrichedRedisNode[]
  loading: boolean
  color: string
  readonly: boolean
  redisKey: RedisKey_Deserialize | null
  tabName: string
  dbSizeMap: Record<string, string | number>
  exportImporting: boolean
  exportImportingTip: string
  exportImportingPercentage: number
  isValkey: boolean
  serverVersion: string
  capabilities: ServerCapabilities
}

/** AppMain `provide('app')`：更新检查与下载进度 */
export interface AppMainInject extends MeAppUpdateState {
  update: Update | null
}

/** 多窗口连接列表同步（与 `CONN_LIST_WINDOWS_SYNC` 事件对应） */
export interface ConnListWindowsSyncPayload {
  connList: UiConn[]
  label: string
}

/** vue-web-terminal 命令提示项（与 commands-help 等本地 JSON 结构兼容） */
export interface MeXtermCommandItem {
  key: string
  summary?: string
  description?: string
  usage?: string
  group?: string
  title?: string
  since?: string
}

type UnwrapSpectaPromise<R> =
  R extends Promise<infer P> ? (P extends { status: 'ok'; data: infer D } ? D : never) : never

type WrapSpectaCommand<F> = F extends (...args: infer A) => infer R
  ? R extends Promise<unknown>
    ? (...args: [...A, (false | undefined)?]) => Promise<UnwrapSpectaPromise<R>>
    : F
  : F

type SpectaCommandsMap = typeof spectaCommands

/**
 * `MeCommands`（及运行时 `meCommands`）：与 `@/types/tauri-specta` 里 **`export const commands`**
 * 逐项同键、同入参（本文件以 `spectaCommands` 取类型）；成功时返回解包后的 `data`；末尾可传 `false` 关闭错误弹窗。
 */
export type MeCommands = {
  [K in keyof SpectaCommandsMap]: SpectaCommandsMap[K] extends (...args: never[]) => unknown
    ? WrapSpectaCommand<SpectaCommandsMap[K]>
    : SpectaCommandsMap[K]
}
