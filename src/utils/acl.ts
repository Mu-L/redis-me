import type { AclUserDetail } from '@/types/tauri-specta'

export interface AclEditModel {
  username: string
  enabled: boolean
  password: string
  passwordHashes: string[]
  commandRules: string[]
  keyPatterns: string[]
  channelPatterns: string[]
}

export type AclPreset = 'normal' | 'readonly' | 'admin'

/** ACL 自 Redis/Valkey 6.0 起支持；用于 Info 入口与 ACL 页 */
export function isAclSupported(version: string | undefined): boolean {
  const major = parseInt((version || '0').split('.')[0] || '0', 10)
  return Number.isFinite(major) && major >= 6
}

/** 高频场景快捷模板：普通用户、只读用户、管理员 */
export const ACL_PRESET_COMMAND_RULES: Record<AclPreset, string[]> = {
  normal: ['+@read', '+@write', '+@keyspace', '+@pubsub', '-@admin', '-@dangerous'],
  readonly: ['+@read', '+@keyspace', '+@pubsub', '-@write', '-@admin', '-@dangerous'],
  admin: ['+@all'],
}

function uniq(list: string[]): string[] {
  return Array.from(new Set(list))
}

function normalizeRuleList(list: string[]): string[] {
  return uniq(list.map(v => v.trim()).filter(Boolean))
}

function normalizePatternList(list: string[], prefix: '~' | '&'): string[] {
  return uniq(
    list
      .map(v => v.trim())
      .filter(Boolean)
      .map(v => (v.startsWith(prefix) ? v.slice(1) : v)),
  )
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Redis ACL #<sha256> 规则需要十六进制哈希 */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(digest))
}

export function createDefaultAclModel(): AclEditModel {
  return {
    username: '',
    enabled: true,
    password: '',
    passwordHashes: [],
    commandRules: [...ACL_PRESET_COMMAND_RULES.normal],
    keyPatterns: ['*'],
    channelPatterns: ['*'],
  }
}

/** 编辑态从后端详情回填，保持“密码未改则沿用原 hashes” */
export function createAclModelFromDetail(detail: AclUserDetail): AclEditModel {
  return {
    username: detail.username,
    enabled: detail.enabled,
    password: '',
    passwordHashes: [...detail.passwordHashes],
    commandRules: [...detail.commandRules],
    keyPatterns: [...detail.keyPatterns],
    channelPatterns: [...detail.channelPatterns],
  }
}

export async function buildAclSavePayload(
  model: AclEditModel,
): Promise<{
  username: string
  enabled: boolean
  passwordHashes: string[]
  commandRules: string[]
  keyPatterns: string[]
  channelPatterns: string[]
}> {
  const username = model.username.trim()
  const commandRules = normalizeRuleList(model.commandRules)
  const keyPatterns = normalizePatternList(model.keyPatterns, '~')
  const channelPatterns = normalizePatternList(model.channelPatterns, '&')

  const password = model.password.trim()
  const passwordHashes = password ? [await sha256Hex(password)] : [...model.passwordHashes]

  return {
    username,
    enabled: model.enabled,
    passwordHashes,
    commandRules,
    keyPatterns,
    channelPatterns,
  }
}

/** 命令预览：用于保存前检查规则是否符合预期 */
export function buildAclPreviewCommand(model: AclEditModel): string {
  const chunks: string[] = ['ACL', 'SETUSER', model.username || '<username>', 'reset']
  chunks.push(model.enabled ? 'on' : 'off')

  const passwordToken = model.password
    ? ['#<sha256(new-password)>']
    : model.passwordHashes.map(() => '#<saved-hash>')
  chunks.push(...passwordToken)

  chunks.push(...normalizeRuleList(model.commandRules))
  chunks.push(...normalizePatternList(model.keyPatterns, '~').map(v => `~${v}`))
  chunks.push(...normalizePatternList(model.channelPatterns, '&').map(v => `&${v}`))
  return chunks.join(' ')
}

export function summarizeRules(rules: string[], max = 3): string {
  if (!rules.length) return '--'
  if (rules.length <= max) return rules.join(' ')
  return `${rules.slice(0, max).join(' ')} ...`
}
