import type { RedisKey_Deserialize } from '@/types/tauri-specta'

/** 连接 + db + 键身份 → TYPE 结果；避免 el-tree-v2 展开时 KeyTypeTag 重建重复请求 */
const cache = new Map<string, string>()
const pending = new Map<string, Promise<string | undefined>>()

/** 与后端 RedisKey.to_bytes 一致：二进制键用 base64 bytes，UTF-8 键用 key */
export function redisKeyIdentity(rk: RedisKey_Deserialize): string {
  return rk.bytes || rk.key
}

function cacheKey(connId: string, db: number, rk: RedisKey_Deserialize): string {
  return `${connId}\0${db}\0${redisKeyIdentity(rk)}`
}

export function getCachedKeyType(
  connId: string,
  db: number,
  rk: RedisKey_Deserialize,
): string | undefined {
  return cache.get(cacheKey(connId, db, rk))
}

/** 删除/重命名等场景：清除该连接下所有 db 中同键的缓存 */
export function invalidateKeyType(connId: string, redisKey: RedisKey_Deserialize): void {
  const identity = redisKeyIdentity(redisKey)
  const suffix = `\0${identity}`
  for (const k of cache.keys()) {
    if (k.startsWith(`${connId}\0`) && k.endsWith(suffix)) {
      cache.delete(k)
      pending.delete(k)
    }
  }
}

/** 关闭/切换连接时丢弃该连接的全部 TYPE 缓存 */
export function clearKeyTypeCacheForConn(connId: string): void {
  const prefix = `${connId}\0`
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) {
      cache.delete(k)
      pending.delete(k)
    }
  }
}

async function fetchKeyType(
  connId: string,
  redisKey: RedisKey_Deserialize,
): Promise<string | undefined> {
  const { meCommands } = await import('@/utils/util')
  try {
    return (await meCommands.keyType(connId, redisKey, false))?.toUpperCase()
  } catch {
    return undefined
  }
}

export async function resolveKeyType(
  connId: string,
  db: number,
  redisKey: RedisKey_Deserialize,
): Promise<string | undefined> {
  const ck = cacheKey(connId, db, redisKey)
  const hit = cache.get(ck)
  if (hit) return hit

  let req = pending.get(ck)
  if (!req) {
    req = fetchKeyType(connId, redisKey)
      .then(upper => {
        if (upper) cache.set(ck, upper)
        return upper
      })
      .finally(() => {
        pending.delete(ck)
      })
    pending.set(ck, req)
  }
  return req
}
