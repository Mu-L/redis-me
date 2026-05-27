/** MeTable 导出：从 el-table DOM 读取与界面一致的表头/单元格文本 */
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs'
import type { TableInstance } from 'element-plus'
import * as XLSX from 'xlsx'

import i18n from '@/locales'
import { meErr, meOk } from '@/utils/util'

const { t } = i18n.global

const SKIP_COLUMN_CLASSES = ['el-table-column--selection', 'el-table__expand-column']

function normalizeCellText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function isSkippedColumn(cell: Element): boolean {
  return SKIP_COLUMN_CLASSES.some(cls => cell.classList.contains(cls))
}

/** 读取当前 el-table DOM 中的表头与行（需先渲染要导出的全部行） */
export function readTableFromDom(table: TableInstance): { headers: string[]; rows: string[][] } {
  const root = table.$el as HTMLElement | undefined
  if (!root) return { headers: [], rows: [] }

  const headers: string[] = []
  root
    .querySelectorAll('.el-table__header-wrapper thead tr:first-child th.el-table__cell')
    .forEach(th => {
      if (isSkippedColumn(th)) return
      const cell = th.querySelector('.cell')
      headers.push(normalizeCellText(cell?.textContent ?? ''))
    })

  const rows: string[][] = []
  const bodyWrapper = root.querySelector('.el-table__body-wrapper')
  bodyWrapper?.querySelectorAll('tbody tr').forEach(tr => {
    if ((tr as HTMLElement).style.display === 'none') return
    const rowCells: string[] = []
    tr.querySelectorAll('td.el-table__cell').forEach(td => {
      if (isSkippedColumn(td)) return
      const cell = td.querySelector('.cell')
      rowCells.push(normalizeCellText(cell?.textContent ?? ''))
    })
    if (rowCells.length) rows.push(rowCells)
  })

  return { headers, rows }
}

export function matrixToJson(headers: string[], rows: string[][]): string {
  const objects = rows.map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header || `column${index + 1}`] = row[index] ?? ''
    })
    return obj
  })
  return JSON.stringify(objects, null, 2)
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function matrixToCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(csvEscape).join(','), ...rows.map(row => row.map(csvEscape).join(','))]
  return `\ufeff${lines.join('\n')}`
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 导出可在浏览器直接打开的 HTML 表格 */
export function matrixToHtml(headers: string[], rows: string[][]): string {
  const headerHtml = headers.map(h => `<th>${htmlEscape(h)}</th>`).join('')
  const bodyHtml = rows
    .map(row => {
      const cells = row.map(cell => `<td>${htmlEscape(cell)}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    th { background: #f5f5f5; }
    tr:nth-child(even) { background: #fafafa; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
</body>
</html>`
}

export function matrixToXlsxBytes(headers: string[], rows: string[][]): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Uint8Array(buf)
}

export async function saveTableTextFile(
  content: string,
  defaultPath: string,
  extensions: string[],
): Promise<void> {
  const path = await save({
    defaultPath,
    filters: [{ name: extensions[0]?.toUpperCase() ?? 'File', extensions }],
  })
  if (!path) return
  try {
    await writeTextFile(path, content)
    meOk(t('meTable.exportOk'))
  } catch (e: unknown) {
    meErr(e instanceof Error ? e : String(e), t('meTable.exportErr'))
  }
}

export async function saveTableXlsxFile(
  headers: string[],
  rows: string[][],
  defaultPath: string,
): Promise<void> {
  const path = await save({ defaultPath, filters: [{ name: 'XLSX', extensions: ['xlsx'] }] })
  if (!path) return
  try {
    await writeFile(path, matrixToXlsxBytes(headers, rows))
    meOk(t('meTable.exportOk'))
  } catch (e: unknown) {
    meErr(e instanceof Error ? e : String(e), t('meTable.exportErr'))
  }
}
