/**
 * 终端只读模式：判断 Redis 命令是否可在只读模式下执行。
 * 规则：readonly 标记 > write 标记 > 灰区白名单（CONFIG GET 等）> 脚本/事务黑名单。
 */
import { commandFlags, grayReadonlyCommands } from './flags.gen'

const commandNameSet = new Set(Object.keys(commandFlags))

/** 首词命中则拒绝（EVAL 等脚本无法静态判断内容） */
const BLOCKLIST_ROOT = new Set([
  'EVAL',
  'EVALSHA',
  'FCALL',
  'MULTI',
  'EXEC',
  'DISCARD',
  'WATCH',
  'UNWATCH',
  'MONITOR',
  'SUBSCRIBE',
  'PSUBSCRIBE',
  'SSUBSCRIBE',
  'UNSUBSCRIBE',
  'PUNSUBSCRIBE',
  'SUNSUBSCRIBE',
  'READWRITE',
  'SHUTDOWN',
  'DEBUG',
  'SLAVEOF',
  'REPLICAOF',
  'FAILOVER',
  'MIGRATE',
  'RESTORE',
  'FUNCTION',
  'SCRIPT',
  'MODULE',
  'SAVE',
  'BGSAVE',
  'BGREWRITEAOF',
  'FLUSHALL',
  'FLUSHDB',
  'SYNC',
  'PSYNC',
  'REPLCONF',
  'WAIT',
  'WAITAOF',
])

/** 解析命令名：优先匹配最长已知前缀（如 ACL GETUSER） */
export function parseCommandName(command: string): string {
  const parts = command.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''

  for (let len = Math.min(parts.length, 4); len >= 1; len--) {
    const name = parts.slice(0, len).join(' ').toUpperCase()
    if (commandNameSet.has(name)) return name
  }

  return parts[0]!.toUpperCase()
}

/** 只读模式下是否允许执行该命令 */
export function isReadonlyCommand(command: string): boolean {
  const trimmed = command.trim()
  if (!trimmed) return false

  const root = trimmed.split(/\s+/)[0]!.toUpperCase()
  if (BLOCKLIST_ROOT.has(root)) return false

  const name = parseCommandName(trimmed)
  const flags = commandFlags[name]

  if (!flags) return false
  if (flags.includes('write')) return false
  if (flags.includes('readonly')) return true

  return grayReadonlyCommands.has(name)
}
