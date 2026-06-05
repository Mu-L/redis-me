import type { AclUserDetail } from '@/types/tauri-specta'

export interface AclEditModel {
  username: string
  enabled: boolean
  password: string
  passwordHashes: string[]
  commandRules: string[]
  keyPatterns: string[]
  channelPatterns: string[]
  /** Redis 7.2+ selector，每条为 SETUSER 括号内规则串 */
  selectors: string[]
}

export type AclPreset = 'normal' | 'readonly' | 'admin'

/** ACL 自 Redis/Valkey 6.0 起支持；用于 Info 入口与 ACL 页 */
export function isAclSupported(version: string | undefined): boolean {
  const major = parseInt((version || '0').split('.')[0] || '0', 10)
  return Number.isFinite(major) && major >= 6
}

/** ACL selectors 自 Redis/Valkey 7.2 起支持 */
export function isAclSelectorSupported(version: string | undefined): boolean {
  const parts = (version || '0').split('.')
  const major = parseInt(parts[0] || '0', 10)
  const minor = parseInt(parts[1] || '0', 10)
  if (!Number.isFinite(major) || !Number.isFinite(minor)) return false
  return major > 7 || (major === 7 && minor >= 2)
}

/** 去掉外层括号，统一存 SETUSER 括号内规则串 */
export function normalizeSelectorInput(text: string): string {
  let v = text.trim()
  if (v.startsWith('(') && v.endsWith(')')) {
    v = v.slice(1, -1).trim()
  }
  return v
}

export function normalizeSelectorList(list: string[]): string[] {
  return uniq(list.map(normalizeSelectorInput).filter(Boolean))
}

/** tag 展示：统一加括号 */
export function formatSelectorLabel(selector: string): string {
  const inner = normalizeSelectorInput(selector)
  return inner ? `(${inner})` : ''
}

/** 快捷模板：普通用户对齐 Redis Cloud Read-Write；只读在 +@read 基础上补 connection */
export const ACL_PRESET_COMMAND_RULES: Record<AclPreset, string[]> = {
  normal: ['+@all', '-@dangerous'],
  // reset 后默认全禁，未 +@write/+@all 时不必写 -@write；-@dangerous 仍要：KEYS 等带 @read
  readonly: ['+@read', '+@connection', '-@dangerous'],
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

/** Redis ACL 键模式关键字（不可加 ~ 前缀，如 allkeys 等价 ~*） */
export const ACL_KEY_KEYWORDS = new Set(['allkeys', 'resetkeys'])

/** Redis ACL 频道模式关键字（不可加 & 前缀，如 allchannels 等价 &*） */
export const ACL_CHANNEL_KEYWORDS = new Set(['allchannels', 'resetchannels'])

export function isAclKeyKeyword(pattern: string): boolean {
  return ACL_KEY_KEYWORDS.has(pattern.trim().toLowerCase())
}

export function isAclChannelKeyword(pattern: string): boolean {
  return ACL_CHANNEL_KEYWORDS.has(pattern.trim().toLowerCase())
}

/** 表单 tag 展示：关键字原样，普通模式加 ~ / & */
export function formatKeyPatternLabel(pattern: string): string {
  if (isAclKeyKeyword(pattern)) return pattern
  return `~${pattern.startsWith('~') ? pattern.slice(1) : pattern}`
}

export function formatChannelPatternLabel(pattern: string): string {
  if (isAclChannelKeyword(pattern)) return pattern
  return `&${pattern.startsWith('&') ? pattern.slice(1) : pattern}`
}

function formatKeyPatternForCommand(pattern: string): string {
  if (isAclKeyKeyword(pattern)) return pattern
  return `~${normalizePatternList([pattern], '~')[0]}`
}

function formatChannelPatternForCommand(pattern: string): string {
  if (isAclChannelKeyword(pattern)) return pattern
  return `&${normalizePatternList([pattern], '&')[0]}`
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
    selectors: [],
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
    selectors: [...detail.selectors],
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
  selectors: string[]
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
    selectors: normalizeSelectorList(model.selectors),
  }
}

function appendAclSelectors(chunks: string[], selectors: string[]): void {
  for (const sel of normalizeSelectorList(selectors)) {
    chunks.push(`(${sel})`)
  }
}

function appendAclCommandRules(chunks: string[], model: AclEditModel): void {
  chunks.push(...normalizeRuleList(model.commandRules))
  chunks.push(...normalizePatternList(model.keyPatterns, '~').map(formatKeyPatternForCommand))
  chunks.push(
    ...normalizePatternList(model.channelPatterns, '&').map(formatChannelPatternForCommand),
  )
  appendAclSelectors(chunks, model.selectors)
}

/** 命令预览：密码用占位符，便于核对规则且避免泄露 hash */
export function buildAclPreviewCommand(model: AclEditModel): string {
  const chunks: string[] = ['ACL', 'SETUSER', model.username || '<username>', 'reset']
  chunks.push(model.enabled ? 'on' : 'off')

  if (model.password.trim()) {
    chunks.push('#<sha256(new-password)>')
  } else if (model.passwordHashes.length) {
    chunks.push(...model.passwordHashes.map(() => '#<saved-hash>'))
  } else {
    chunks.push('nopass')
  }

  appendAclCommandRules(chunks, model)
  return chunks.join(' ')
}

/** 可执行命令：复制时用真实 #hash，与保存逻辑一致 */
export async function buildAclExecutableCommand(model: AclEditModel): Promise<string> {
  const chunks: string[] = ['ACL', 'SETUSER', model.username.trim() || '<username>', 'reset']
  chunks.push(model.enabled ? 'on' : 'off')

  const password = model.password.trim()
  if (password) {
    chunks.push(`#${await sha256Hex(password)}`)
  } else if (model.passwordHashes.length) {
    chunks.push(...model.passwordHashes.map(h => `#${h}`))
  } else {
    chunks.push('nopass')
  }

  appendAclCommandRules(chunks, model)
  return chunks.join(' ')
}

export function summarizeRules(rules: string[], max = 3): string {
  if (!rules.length) return '--'
  if (rules.length <= max) return rules.join(' ')
  return `${rules.slice(0, max).join(' ')} ...`
}

/** 列表摘要：选择器带括号展示 */
export function summarizeSelectors(selectors: string[], max = 2): string {
  if (!selectors.length) return '--'
  const labels = selectors.map(formatSelectorLabel)
  return summarizeRules(labels, max)
}
