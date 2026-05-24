/** 字节视图格式与 wire(utf8/base64) 编解码；后端仅 utf8/base64，hex/binary/msgpack/custom 在前端处理 */
import { decode, encode } from '@msgpack/msgpack'
import JSON5 from 'json5'

import i18n from '@/locales'
import type { BytesFormat } from '@/types/tauri-specta'
import {
  findCustomFormatter,
  runDecode,
  runEncode,
  type CustomFormatter,
} from '@/utils/custom-formatter'

const t = i18n.global.t

export const BYTES_FORMAT = ['UTF8', 'Hex', 'Binary', 'Base64'] as const

/** 前端值/键展示格式 */
export type ViewBytesFormat = 'utf8' | 'hex' | 'binary' | 'base64' | 'msgpack' | `custom:${string}`

export const CUSTOM_FORMAT_PREFIX = 'custom:' as const

export function isCustomView(view: ViewBytesFormat): view is `custom:${string}` {
  return view.startsWith(CUSTOM_FORMAT_PREFIX)
}

/** custom 下拉项 value：`custom:${name}` */
export function customFormatValue(name: string): ViewBytesFormat {
  return `${CUSTOM_FORMAT_PREFIX}${name}`
}

/** 从 custom view 解析名称；非 custom 返回 null */
export function customFormatName(view: ViewBytesFormat): string | null {
  return isCustomView(view) ? view.slice(CUSTOM_FORMAT_PREFIX.length) : null
}

/** 仅整键 STRING 可选（MsgPack、自定义 Formatter） */
export function isStringOnlyView(view: ViewBytesFormat): boolean {
  return view === 'msgpack' || isCustomView(view)
}

function resolveCustomFormatter(view: ViewBytesFormat): CustomFormatter {
  const name = customFormatName(view)
  if (!name) throw new Error(t('customFormatter.notFound', { name: view }))
  const formatter = findCustomFormatter(name)
  if (!formatter) throw new Error(t('customFormatter.notFound', { name }))
  return formatter
}

/** STRING 值详情下拉扩展项（仅整键 STRING 可选） */
export const EXT_FORMAT = ['MsgPack'] as const

/** MsgPack 解码失败时的固定提示 */
export const MSGPACK_DECODE_ERR = 'MsgPack Decode Error !'

/** 视图格式 → 后端 wire 格式（非 utf8 一律 base64） */
export function toWireFormat(view: ViewBytesFormat): BytesFormat {
  return view === 'utf8' ? 'utf8' : 'base64'
}

/** 字段弹窗等场景：MsgPack / custom 不适用，降级为 utf8 */
export function viewFmtForField(view: ViewBytesFormat): ViewBytesFormat {
  return isStringOnlyView(view) ? 'utf8' : view
}

/** wire 字符串（utf8 或 base64）→ 编辑器/表格展示 */
export function meFormatViewValue(wire: string, view: ViewBytesFormat): string {
  if (!wire || view === 'utf8') return wire
  if (view === 'base64') return wire
  if (view === 'hex' || view === 'binary') return meFormatBytes(wire, view)
  if (view === 'msgpack') return meMsgpackBase64ToJson(wire)
  if (isCustomView(view)) {
    throw new Error('custom view requires meFormatViewValueAsync')
  }
  return wire
}

/** wire → 展示（含 custom shell 解码；wire 已由 fieldScan 以 base64 返回） */
export async function meFormatViewValueAsync(wire: string, view: ViewBytesFormat): Promise<string> {
  if (!wire || view === 'utf8') return wire
  if (isCustomView(view)) {
    return runDecode(wire, resolveCustomFormatter(view))
  }
  return meFormatViewValue(wire, view)
}

/** 编辑器/表单输入 → wire 字符串（保存用） */
export function meViewToWire(text: string, view: ViewBytesFormat): string {
  if (!text || view === 'utf8') return text
  if (view === 'base64') return text
  if (view === 'hex' || view === 'binary') return meToBase64(text, view)
  if (view === 'msgpack') return meJsonToMsgpackBase64(text)
  if (isCustomView(view)) {
    throw new Error('custom view requires meViewToWireAsync')
  }
  return text
}

/** 编辑区 → wire（含 custom shell 编码） */
export async function meViewToWireAsync(text: string, view: ViewBytesFormat): Promise<string> {
  if (!text || view === 'utf8') return text
  if (isCustomView(view)) {
    return runEncode(text, resolveCustomFormatter(view))
  }
  return meViewToWire(text, view)
}

export function meFormatBytes(base64: string, bytesFormat: string): string {
  if (bytesFormat === 'base64') return base64
  if (bytesFormat === 'hex') return base64ToHex(base64)
  if (bytesFormat === 'binary') return base64ToBinary(base64)
  return 'Unknown bytesFormat: ' + bytesFormat
}

export function meToBase64(bytes: string, encoding: string): string {
  if (encoding === 'base64') return bytes
  if (encoding === 'hex') return hexToBase64(bytes)
  if (encoding === 'binary') return binaryToBase64(bytes)
  return 'Unknown encoding: ' + encoding
}

function base64ToHex(base64: string): string {
  if (!base64) return ''
  const binary = atob(base64)
  return Array.from(binary)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}

function base64ToBinary(base64: string): string {
  if (!base64) return ''
  const binary = atob(base64)
  return Array.from(binary)
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('')
}

function hexToBase64(hex: string): string {
  if (!hex) return ''
  if (hex.length % 2 !== 0) {
    throw new Error(t('util.invalidHexString'))
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(t('util.invalidHexCharacter'))
  }
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    const byte = Number.parseInt(hex.slice(i, i + 2), 16)
    if (Number.isNaN(byte)) {
      throw new Error(t('util.invalidHexCharacter'))
    }
    bytes.push(byte)
  }
  const binary = bytes.map(b => String.fromCharCode(b)).join('')
  return btoa(binary)
}

function binaryToBase64(binary: string): string {
  if (!binary) return ''
  if (binary.length % 8 !== 0) {
    throw new Error(t('util.invalidBinaryString'))
  }
  if (!/^[01]+$/.test(binary)) {
    throw new Error(t('util.invalidBinaryCharacter'))
  }
  const bytes: number[] = []
  for (let i = 0; i < binary.length; i += 8) {
    const byte = Number.parseInt(binary.slice(i, i + 8), 2)
    if (Number.isNaN(byte)) {
      throw new Error(t('util.invalidBinaryCharacter'))
    }
    bytes.push(byte)
  }
  const binaryStr = bytes.map(b => String.fromCharCode(b)).join('')
  return btoa(binaryStr)
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

/** MsgPack wire(base64) → JSON 格式化文本 */
export function meMsgpackBase64ToJson(base64: string): string {
  if (!base64) return ''
  try {
    const decoded = decode(base64ToUint8Array(base64))
    return JSON.stringify(decoded, null, 2)
  } catch {
    return `${MSGPACK_DECODE_ERR}\n\n${base64}`
  }
}

/** JSON 文本 → MsgPack wire(base64) */
export function meJsonToMsgpackBase64(json: string): string {
  const v = JSON5.parse(json.trim())
  return uint8ArrayToBase64(encode(v))
}
