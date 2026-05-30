export interface CommandHelpRow {
  key: string
  title: string
  group: string
  summary: string
  since: string
  usage: string
  description?: string
  /** 只读模式下是否允许执行（由 isReadonlyCommand 派生） */
  readonly?: boolean
}
