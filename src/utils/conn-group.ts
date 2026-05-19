import type { UiConn } from '@/types/me-interface'

export const CONN_META_GROUP = 'group'

export function normalizeGroupName(name: unknown): string {
  if (typeof name !== 'string') return ''
  return name.trim()
}

export function getConnGroup(conn: UiConn): string {
  return normalizeGroupName(conn.meta?.[CONN_META_GROUP])
}

export function setConnGroup(conn: UiConn, group: string): void {
  conn.meta ??= {}
  const g = normalizeGroupName(group)
  if (g) conn.meta[CONN_META_GROUP] = g
  else delete conn.meta[CONN_META_GROUP]
}

export function connMatchesKeyword(conn: UiConn, keyword: string): boolean {
  const key = keyword.trim().toLowerCase()
  if (!key) return true
  return (
    (conn.name?.toLowerCase().includes(key) ?? false) ||
    (conn.host?.toLowerCase().includes(key) ?? false)
  )
}

export interface ConnGroupSection {
  key: string
  title: string
  conns: UiConn[]
}

export function getSectionKeys(connGroups: string[], connList: UiConn[]): string[] {
  const keys: string[] = []
  const add = (g: string) => {
    const n = normalizeGroupName(g)
    if (n && !keys.includes(n)) keys.push(n)
  }
  for (const g of connGroups) add(g)
  for (const c of connList) add(getConnGroup(c))
  keys.push('')
  return keys
}

export function buildConnGroupSections(
  connList: UiConn[],
  connGroups: string[],
  keyword: string,
): ConnGroupSection[] {
  const key = keyword.trim().toLowerCase()
  const byGroup = new Map<string, UiConn[]>()
  for (const conn of connList) {
    const g = getConnGroup(conn)
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(conn)
  }

  const filter = (list: UiConn[]) => (key ? list.filter(c => connMatchesKeyword(c, key)) : list)
  const groupNames = new Set(connGroups.map(normalizeGroupName).filter(Boolean))

  return getSectionKeys(connGroups, connList)
    .map(groupKey => ({
      key: groupKey,
      title: groupKey,
      conns: filter(byGroup.get(groupKey) ?? []),
    }))
    .filter(s => {
      if (!key) return s.conns.length > 0 || s.key === '' || groupNames.has(s.key)
      return s.conns.length > 0
    })
}

export function moveConnToGroup(
  connList: UiConn[],
  connGroups: string[],
  conn: UiConn,
  targetGroup: string,
  indexInGroup: number,
): void {
  setConnGroup(conn, targetGroup)
  const byGroup = new Map<string, UiConn[]>()
  for (const c of connList) {
    const g = getConnGroup(c)
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(c)
  }
  const list = byGroup.get(targetGroup) ?? []
  const cur = list.indexOf(conn)
  if (cur > -1) list.splice(cur, 1)
  list.splice(Math.min(Math.max(indexInGroup, 0), list.length), 0, conn)
  byGroup.set(targetGroup, list)
  const keys = getSectionKeys(connGroups, connList)
  const next = keys.flatMap(k => byGroup.get(k) ?? [])
  connList.splice(0, connList.length, ...next)
}

export function moveConnInGroup(
  connList: UiConn[],
  connGroups: string[],
  groupKey: string,
  oldIndex: number,
  newIndex: number,
): void {
  const byGroup = new Map<string, UiConn[]>()
  for (const c of connList) {
    const g = getConnGroup(c)
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(c)
  }
  const list = byGroup.get(groupKey) ?? []
  if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || oldIndex >= list.length) return
  const [moved] = list.splice(oldIndex, 1)
  if (!moved) return
  list.splice(newIndex, 0, moved)
  byGroup.set(groupKey, list)
  const keys = getSectionKeys(connGroups, connList)
  const next = keys.flatMap(k => byGroup.get(k) ?? [])
  connList.splice(0, connList.length, ...next)
}

/** 按 UI 顺序更新文件夹列表，并同步连接在 connList 中的分组顺序 */
export function applyConnGroupOrder(
  connList: UiConn[],
  connGroups: string[],
  orderedNamedKeys: string[],
): void {
  const named = orderedNamedKeys.map(normalizeGroupName).filter(Boolean)
  const set = new Set(named)
  for (const g of connGroups) {
    const n = normalizeGroupName(g)
    if (n && !set.has(n)) named.push(n)
  }
  connGroups.splice(0, connGroups.length, ...named)

  const byGroup = new Map<string, UiConn[]>()
  for (const c of connList) {
    const g = getConnGroup(c)
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(c)
  }
  const keys = getSectionKeys(connGroups, connList)
  connList.splice(0, connList.length, ...keys.flatMap(k => byGroup.get(k) ?? []))
}

export function mergeConnGroupsFromList(connList: UiConn[], connGroups: string[]): void {
  const set = new Set(connGroups.map(normalizeGroupName).filter(Boolean))
  for (const c of connList) {
    const g = getConnGroup(c)
    if (g && !set.has(g)) {
      connGroups.push(g)
      set.add(g)
    }
  }
}

export function renameConnGroup(
  connList: UiConn[],
  connGroups: string[],
  oldName: string,
  newName: string,
  expanded?: Record<string, boolean>,
): boolean {
  const from = normalizeGroupName(oldName)
  const to = normalizeGroupName(newName)
  if (!from || !to || from === to) return false
  if (connGroups.some(g => normalizeGroupName(g) === to)) return false
  for (const c of connList) {
    if (getConnGroup(c) === from) setConnGroup(c, to)
  }
  const i = connGroups.findIndex(g => normalizeGroupName(g) === from)
  if (i > -1) connGroups[i] = to
  if (expanded && from in expanded) {
    expanded[to] = expanded[from]!
    delete expanded[from]
  }
  return true
}

export function removeConnGroup(
  connList: UiConn[],
  connGroups: string[],
  name: string,
  expanded?: Record<string, boolean>,
): void {
  const key = normalizeGroupName(name)
  if (!key) return
  for (const c of connList) {
    if (getConnGroup(c) === key) setConnGroup(c, '')
  }
  const i = connGroups.findIndex(g => normalizeGroupName(g) === key)
  if (i > -1) connGroups.splice(i, 1)
  if (expanded) delete expanded[key]
}
