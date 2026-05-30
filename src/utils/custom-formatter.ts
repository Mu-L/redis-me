/** 自定义编解码：通过 shell 调用外部脚本（decode/encode + base64 参数；超长 payload 走 stdin） */
import { isTauri } from '@tauri-apps/api/core'
import { type } from '@tauri-apps/plugin-os'
import { Command } from '@tauri-apps/plugin-shell'

import i18n from '@/locales'

const t = i18n.global.t

/** Base64 参数超过此长度时改走 stdin（Windows cmd 命令行约 8191 字符上限） */
export const FORMATTER_STDIN_B64_THRESHOLD = 8000
const STDIN_ARG = '--stdin'

/** 持久化于 settings.customFormatters */
export interface CustomFormatter {
  name: string
  /** 可执行入口，如 `python3 /path/codec.py` */
  command: string
}

export type FormatterMode = 'decode' | 'encode'

interface ShellExecResult {
  code: number
  stdout: string
  stderr: string
}

const B64_RE = /^[A-Za-z0-9+/]+=*$/

function isValidBase64(s: string): boolean {
  return B64_RE.test(s)
}

/** UTF-8 文本 → base64（encode 时作为脚本第 2 参数） */
function textUtf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

export function findCustomFormatter(name: string): CustomFormatter | undefined {
  const list = window.meTauri.settings.customFormatters
  if (!Array.isArray(list)) return undefined
  return list.find(f => f.name === name)
}

function getExecTimeoutSec(): number {
  const n = window.meTauri.settings.formatterExecTimeoutSec
  return typeof n === 'number' && n > 0 ? n : 5
}

export function needsStdinInput(b64: string): boolean {
  return b64.length >= FORMATTER_STDIN_B64_THRESHOLD
}

/** 拼完整命令行；超长 Base64 时参数 2 为 `--stdin`，payload 由 stdin 单行传入 */
export function buildFormatterCommand(
  formatter: CustomFormatter,
  mode: FormatterMode,
  b64: string,
): string {
  const cmd = formatter.command.trim()
  if (!cmd) throw new Error(t('customFormatter.emptyCommand'))
  if (needsStdinInput(b64)) return `${cmd} ${mode} ${STDIN_ARG}`
  return `${cmd} ${mode} ${b64}`
}

function formatExecError(name: string, result: ShellExecResult, fullCommand: string): string {
  const err = result.stderr?.trim() || result.stdout?.trim()
  let detail: string
  if (err) {
    detail = err
  } else if (result.code !== 0) {
    detail = t('customFormatter.execFailed', { name, code: result.code })
  } else {
    detail = t('customFormatter.invalidOutput', { name })
  }
  return withExecCommand(fullCommand, detail)
}

/** 错误信息前附上实际执行的完整命令，便于排查 */
function withExecCommand(fullCommand: string, message: string): string {
  return t('customFormatter.execFailResult', { command: fullCommand, detail: message })
}

/** 从 execFailResult 拼装的错误里取出 detail 部分 */
export function parseFormatterErrorDetail(message: string): string {
  const headPrefixes = ['⚠️ 错误：', '⚠️ Error: ']
  for (const prefix of headPrefixes) {
    if (!message.startsWith(prefix)) continue
    const rest = message.slice(prefix.length)
    for (const m of ['\n🔔 命令：', '\n🔔 Command: ']) {
      const i = rest.indexOf(m)
      if (i >= 0) return rest.slice(0, i).trim()
    }
    return rest.trim()
  }
  return message.trim()
}

function toExecError(fullCommand: string, e: unknown): Error {
  const detail = e instanceof Error ? e.message : String(e)
  return new Error(withExecCommand(fullCommand, detail))
}

function createExecCommand(fullCommand: string) {
  if (type() === 'windows') {
    return Command.create('exec-cmd', ['/C', fullCommand])
  }
  return Command.create('exec-sh', ['-c', fullCommand])
}

function execTimeoutPromise(
  formatterName: string,
  timeoutSec: number,
): { promise: Promise<never>; clear: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(new Error(t('customFormatter.timeout', { name: formatterName, sec: timeoutSec }))),
      timeoutSec * 1000,
    )
  })
  return {
    promise,
    clear: () => {
      if (timer) clearTimeout(timer)
    },
  }
}

async function execShell(fullCommand: string, formatterName: string): Promise<ShellExecResult> {
  if (!isTauri()) {
    throw new Error(t('customFormatter.shellUnavailable'))
  }
  const timeoutSec = getExecTimeoutSec()
  const cmd = createExecCommand(fullCommand)
  const timeout = execTimeoutPromise(formatterName, timeoutSec)
  try {
    const result = await Promise.race([cmd.execute(), timeout.promise])
    return { code: result.code ?? 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
  } catch (e) {
    throw toExecError(fullCommand, e)
  } finally {
    timeout.clear()
  }
}

/** spawn + stdin 单行写入（末尾换行，脚本用 readline 读取；Tauri shell 不自动关闭 stdin） */
async function execShellWithStdin(
  fullCommand: string,
  b64: string,
  formatterName: string,
): Promise<ShellExecResult> {
  if (!isTauri()) {
    throw new Error(t('customFormatter.shellUnavailable'))
  }
  const timeoutSec = getExecTimeoutSec()
  const cmd = createExecCommand(fullCommand)
  const stdoutChunks: string[] = []
  const stderrChunks: string[] = []

  const closePromise = new Promise<{ code: number | null }>((resolve, reject) => {
    cmd.on('close', data => resolve({ code: data.code }))
    cmd.on('error', err => reject(new Error(String(err))))
    cmd.stdout.on('data', line => stdoutChunks.push(String(line)))
    cmd.stderr.on('data', line => stderrChunks.push(String(line)))
  })

  const timeout = execTimeoutPromise(formatterName, timeoutSec)
  let child: Awaited<ReturnType<typeof cmd.spawn>> | undefined
  let finished = false
  try {
    child = await cmd.spawn()
    await child.write(`${b64}\n`)
    const closed = await Promise.race([closePromise, timeout.promise])
    finished = true
    return {
      code: closed.code ?? 0,
      stdout: stdoutChunks.join('\n'),
      stderr: stderrChunks.join('\n'),
    }
  } catch (e) {
    throw toExecError(fullCommand, e)
  } finally {
    timeout.clear()
    if (!finished) await child?.kill().catch(() => undefined)
  }
}

async function execFormatter(
  formatter: CustomFormatter,
  mode: FormatterMode,
  b64: string,
  /** decode/encode 用于读写；test 用于弹窗测试（允许空 stdout） */
  kind: 'decode' | 'encode' | 'test',
): Promise<string> {
  if (kind === 'decode' && !b64) return ''
  const fullCommand = buildFormatterCommand(formatter, mode, b64)
  const result = needsStdinInput(b64)
    ? await execShellWithStdin(fullCommand, b64, formatter.name)
    : await execShell(fullCommand, formatter.name)
  const out = kind === 'encode' ? result.stdout.trim() : result.stdout.trimEnd()
  if (result.code !== 0) {
    throw new Error(formatExecError(formatter.name, result, fullCommand))
  }
  if (kind !== 'test' && !out) {
    const msg =
      mode === 'decode'
        ? t('customFormatter.decodeEmpty', { name: formatter.name })
        : t('customFormatter.encodeEmpty', { name: formatter.name })
    throw new Error(withExecCommand(fullCommand, msg))
  }
  if (kind === 'encode' && out && !isValidBase64(out)) {
    throw new Error(
      withExecCommand(fullCommand, t('customFormatter.encodeNotBase64', { name: formatter.name })),
    )
  }
  return out
}

/** Redis wire base64 → 展示文本 */
export async function runDecode(wireBase64: string, formatter: CustomFormatter): Promise<string> {
  return execFormatter(formatter, 'decode', wireBase64, 'decode')
}

/** 编辑区文本 → Redis wire base64 */
export async function runEncode(editorText: string, formatter: CustomFormatter): Promise<string> {
  return execFormatter(formatter, 'encode', textUtf8ToBase64(editorText), 'encode')
}

/** 弹窗内测试 decode / encode */
export async function testFormatter(
  formatter: CustomFormatter,
  mode: FormatterMode,
  sampleBase64: string,
): Promise<string> {
  return execFormatter(formatter, mode, sampleBase64, 'test')
}
