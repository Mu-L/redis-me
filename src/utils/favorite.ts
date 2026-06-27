import { useStorage } from '@vueuse/core'

import type { RedisKey_Deserialize } from '@/types/tauri-specta'

export interface FavoriteKey {
  connId: string
  db: number
  redisKey: RedisKey_Deserialize
  favoritedAt: number
}

const FAVORITE_KEY = 'redis-me:favorites'

export function useFavorites() {
  return useStorage<FavoriteKey[]>(FAVORITE_KEY, [])
}

export function isFavorited(
  favorites: FavoriteKey[],
  connId: string,
  db: number,
  bytes: string,
): boolean {
  return favorites.some(f => f.connId === connId && f.db === db && f.redisKey.bytes === bytes)
}

export function addFavorite(
  favorites: FavoriteKey[],
  connId: string,
  db: number,
  redisKey: RedisKey_Deserialize,
): FavoriteKey[] {
  if (isFavorited(favorites, connId, db, redisKey.bytes)) return favorites
  return [...favorites, { connId, db, redisKey, favoritedAt: Date.now() }]
}

export function removeFavorite(
  favorites: FavoriteKey[],
  connId: string,
  db: number,
  bytes: string,
): FavoriteKey[] {
  return favorites.filter(f => !(f.connId === connId && f.db === db && f.redisKey.bytes === bytes))
}

/** 清空指定连接下某一 db 的全部收藏 */
export function clearFavoritesForDb(
  favorites: FavoriteKey[],
  connId: string,
  db: number,
): FavoriteKey[] {
  return favorites.filter(f => !(f.connId === connId && f.db === db))
}
