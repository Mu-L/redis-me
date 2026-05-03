/**
 * 各类 RDM（Redis Desktop Manager）导出格式的连接导入解析。
 * 新增其它 RDM 时在本文件追加解析函数即可。
 */
import { readFile } from '@tauri-apps/plugin-fs'
import { unzipSync } from 'fflate'
import { nanoid } from 'nanoid'
import { parse as parseYaml } from 'yaml'

import type { UiConn } from '@/types/me-interface'
import { meJsonParse } from '@/utils/util'

/** 携带 i18n key，由 UI 层 `t(key)` 展示 */
export class ConnImportParseError extends Error {
  constructor(readonly i18nKey: string) {
    super(i18nKey)
    this.name = 'ConnImportParseError'
  }
}

export type ConnImportSource = 'redisme' | 'another' | 'tiny'

export function connImportFileSuffix(source: ConnImportSource): string {
  if (source === 'redisme') return 'json'
  if (source === 'another') return 'ano'
  return 'zip'
}

function emptyConn(overrides: Partial<UiConn>): UiConn {
  const base: UiConn = {
    id: '',
    name: '',
    host: '127.0.0.1',
    port: 6379,
    username: '',
    password: '',
    db: 0,
    cluster: false,
    ssl: false,
    sslOption: { key: '', cert: '', ca: '' },
    sentinel: false,
    sentinelOption: { masterName: '', masterUsername: '', masterPassword: '' },
    ssh: false,
    sshOption: {
      host: '',
      port: 22,
      loginType: 'pwd',
      username: '',
      password: '',
      pkfile: '',
      passphrase: '',
    },
    meta: {},
  }
  return { ...base, ...overrides }
}

/** 仅将原始 JSON/YAML 中的标量安全转为字符串，避免 `String(object)` */
function asStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : ''
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return ''
}

function parsePortU16(raw: unknown, errKey = 'conn.importPortErr'): number {
  const n = typeof raw === 'string' ? parseInt(raw.trim(), 10) : Number(raw)
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    throw new ConnImportParseError(errKey)
  }
  return Math.floor(n)
}

function parseDb(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.min(255, Math.max(0, Math.floor(raw)))
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = parseInt(raw.trim(), 10)
    if (Number.isFinite(n) && n >= 0) return Math.min(255, Math.floor(n))
  }
  return 0
}

/** RedisME 导出的 JSON 文本 → 连接列表（与原先 TabConn 校验一致） */
export function parseRedisMeConnections(content: string): UiConn[] {
  let connList: unknown
  try {
    connList = meJsonParse(content)
  } catch {
    throw new ConnImportParseError('conn.importJsonErr')
  }

  if (!Array.isArray(connList) || connList.length === 0) {
    throw new ConnImportParseError('conn.importConnErr')
  }

  for (const conn of connList as UiConn[]) {
    if (!conn.id || !conn.name || !conn.host || !conn.port) {
      throw new ConnImportParseError('conn.importFormatErr')
    }
  }
  return connList as UiConn[]
}

type AnotherRaw = Record<string, unknown>

function anotherSslEnabled(ssl: AnotherRaw | undefined): boolean {
  if (!ssl) return false
  return !!(asStr(ssl.key) || asStr(ssl.cert) || asStr(ssl.ca))
}

function anotherItemToUiConn(raw: unknown): UiConn {
  if (!raw || typeof raw !== 'object') {
    throw new ConnImportParseError('conn.importFormatErr')
  }
  const o = raw as AnotherRaw
  const host = asStr(o.host).trim()
  if (!host) throw new ConnImportParseError('conn.importFormatErr')
  const port = parsePortU16(o.port)

  const name = asStr(o.connectionName ?? o.name).trim() || `${host}:${port}`

  const keyStr = o.key != null ? asStr(o.key) : ''
  const id = keyStr ? `another-${keyStr}` : nanoid()

  const sshOpt = o.sshOptions as AnotherRaw | undefined
  const sshOn = !!(sshOpt && asStr(sshOpt.host).trim())
  const pk = sshOpt ? asStr(sshOpt.privatekey) : ''
  const loginType = pk.trim() ? 'pkfile' : 'pwd'

  const sslOpt = o.sslOptions as AnotherRaw | undefined
  const sslOn = anotherSslEnabled(sslOpt)

  const sentOpt = o.sentinelOptions as AnotherRaw | undefined
  const masterName = sentOpt ? asStr(sentOpt.masterName).trim() : ''
  const sentinelOn = !!masterName

  return emptyConn({
    id,
    name,
    host,
    port,
    username: asStr(o.username),
    password: asStr(o.auth),
    db: 0,
    cluster: !!o.cluster,
    readonly: !!o.connectionReadOnly,
    color: typeof o.color === 'string' ? o.color : undefined,
    ssl: sslOn,
    sslOption: sslOpt
      ? { key: asStr(sslOpt.key), cert: asStr(sslOpt.cert), ca: asStr(sslOpt.ca) }
      : { key: '', cert: '', ca: '' },
    sentinel: sentinelOn,
    sentinelOption: {
      masterName,
      masterUsername: '',
      masterPassword: sentOpt ? asStr(sentOpt.nodePassword) : '',
    },
    ssh: sshOn,
    sshOption: sshOn
      ? {
          host: asStr(sshOpt!.host),
          port: parsePortU16(sshOpt!.port ?? 22),
          loginType,
          username: asStr(sshOpt!.username),
          password: asStr(sshOpt!.password),
          pkfile: pk,
          passphrase: asStr(sshOpt!.passphrase),
        }
      : {
          host: '',
          port: 22,
          loginType: 'pwd',
          username: '',
          password: '',
          pkfile: '',
          passphrase: '',
        },
  })
}

/** AnotherRDM `.ano`：整文件 Base64(UTF-8 JSON 数组) */
export function parseAnotherRdmFromAno(content: string): UiConn[] {
  let jsonText: string
  try {
    const b64 = content.trim().replace(/\s+/g, '')
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 0xff
    jsonText = new TextDecoder().decode(bytes)
  } catch {
    throw new ConnImportParseError('conn.importAnoDecodeErr')
  }

  let arr: unknown
  try {
    arr = JSON.parse(jsonText)
  } catch {
    throw new ConnImportParseError('conn.importJsonErr')
  }
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new ConnImportParseError('conn.importConnErr')
  }
  return arr.map(a => anotherItemToUiConn(a))
}

type TinyRaw = Record<string, unknown>

function asObj(v: unknown): TinyRaw | undefined {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as TinyRaw
  return undefined
}

function getStr(o: TinyRaw, ...keys: string[]): string {
  for (const k of keys) {
    if (!(k in o)) continue
    const s = asStr(o[k]).trim()
    if (s !== '') return s
  }
  return ''
}

function tinyClusterOn(o: TinyRaw): boolean {
  const c = o.cluster
  if (typeof c === 'boolean') return c
  const co = asObj(c)
  return !!(co && co.enable)
}

function tinySslOn(ssl: TinyRaw | undefined): boolean {
  return !!(ssl && ssl.enable)
}

function tinySshOn(ssh: TinyRaw | undefined): boolean {
  return !!(ssh && ssh.enable)
}

function tinySentinelOn(s: TinyRaw | undefined): boolean {
  return !!(s && s.enable && getStr(s, 'master').trim())
}

function flattenTinyConnections(items: unknown[]): TinyRaw[] {
  const out: TinyRaw[] = []
  if (!Array.isArray(items)) return out
  for (const item of items) {
    const o = asObj(item)
    if (!o) continue
    if (o.type === 'group' && Array.isArray(o.connections) && o.connections.length > 0) {
      out.push(...flattenTinyConnections(o.connections))
    } else if (o.type !== 'group') {
      out.push(o)
    }
  }
  return out
}

function mapTinyItemToUiConn(o: TinyRaw): UiConn | 'skip-unix' {
  const network = getStr(o, 'network').toLowerCase() || 'tcp'
  const sock = getStr(o, 'sock')
  if (network === 'unix' || (sock && !getStr(o, 'addr'))) {
    return 'skip-unix'
  }

  const name = getStr(o, 'name').trim() || 'imported'
  const host = getStr(o, 'addr', 'host').trim() || '127.0.0.1'
  const port = parsePortU16(o.port ?? 6379)

  const ssl = asObj(o.ssl)
  const sslOn = tinySslOn(ssl)
  const ssh = asObj(o.ssh)
  const sshOn = tinySshOn(ssh)
  const sent = asObj(o.sentinel)
  const sentinelOn = tinySentinelOn(sent)

  const loginRaw = asStr(ssh?.login_type ?? ssh?.loginType) || 'pwd'
  const loginType = loginRaw === 'pkfile' ? 'pkfile' : 'pwd'

  const id = `tinyrdm-${name}`

  return emptyConn({
    id,
    name,
    host,
    port,
    username: getStr(o, 'username'),
    password: getStr(o, 'password'),
    db: parseDb(o.last_db ?? o.lastDB),
    cluster: tinyClusterOn(o),
    color: getStr(o, 'mark_color', 'markColor') || undefined,
    ssl: sslOn,
    sslOption: ssl
      ? {
          key: getStr(ssl, 'keyFile', 'keyfile'),
          cert: getStr(ssl, 'certFile', 'certfile'),
          ca: getStr(ssl, 'caFile', 'cafile'),
        }
      : { key: '', cert: '', ca: '' },
    sentinel: sentinelOn,
    sentinelOption: sentinelOn
      ? {
          masterName: getStr(sent!, 'master'),
          masterUsername: getStr(sent!, 'username'),
          masterPassword: getStr(sent!, 'password'),
        }
      : { masterName: '', masterUsername: '', masterPassword: '' },
    ssh: sshOn,
    sshOption: ssh
      ? {
          host: getStr(ssh, 'addr'),
          port: parsePortU16(ssh.port ?? 22),
          loginType,
          username: getStr(ssh, 'username'),
          password: getStr(ssh, 'password'),
          pkfile: getStr(ssh, 'pkFile', 'pk_file'),
          passphrase: getStr(ssh, 'passphrase'),
        }
      : {
          host: '',
          port: 22,
          loginType: 'pwd',
          username: '',
          password: '',
          pkfile: '',
          passphrase: '',
        },
  })
}

const TINY_YAML_NAMES = ['connections.yaml']

/** TinyRDM 导出 zip（内含 connections.yaml） */
export async function parseTinyRdmFromZipFile(
  path: string,
): Promise<{ connections: UiConn[]; skippedUnix: number }> {
  let bytes: Uint8Array
  try {
    bytes = await readFile(path)
  } catch {
    throw new ConnImportParseError('conn.importZipReadErr')
  }

  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new ConnImportParseError('conn.importZipErr')
  }

  let yamlText: string | null = null
  for (const [fname, data] of Object.entries(files)) {
    if (TINY_YAML_NAMES.includes(fname) || fname.endsWith('/connections.yaml')) {
      yamlText = new TextDecoder().decode(data)
      break
    }
  }
  if (yamlText == null) {
    throw new ConnImportParseError('conn.importYamlMissing')
  }

  let root: unknown
  try {
    root = parseYaml(yamlText)
  } catch {
    throw new ConnImportParseError('conn.importYamlErr')
  }

  if (!Array.isArray(root)) {
    throw new ConnImportParseError('conn.importYamlErr')
  }

  const flat = flattenTinyConnections(root)
  const connections: UiConn[] = []
  let skippedUnix = 0
  for (const item of flat) {
    const mapped = mapTinyItemToUiConn(item)
    if (mapped === 'skip-unix') {
      skippedUnix += 1
      continue
    }
    connections.push(mapped)
  }

  if (connections.length === 0) {
    throw new ConnImportParseError(skippedUnix > 0 ? 'conn.importAllUnixErr' : 'conn.importConnErr')
  }

  return { connections, skippedUnix }
}

export function mergeImportedConnList(existing: UiConn[], imported: UiConn[]): UiConn[] {
  const impIds = imported.map(c => c.id)
  const next: UiConn[] = []
  next.push(...existing.filter(c => !impIds.includes(c.id)))
  next.push(...imported)
  return next
}
