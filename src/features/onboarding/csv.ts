/**
 * Small CSV reader for admin uploads. Handles quoted fields (with commas, quotes and line breaks
 * inside), a UTF-8 byte-order mark, Windows line endings, and rows pasted straight from Excel or
 * Google Sheets (tab-separated).
 */
export function parseTable(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const firstLine = src.split(/\r?\n/, 1)[0] ?? ''
  const delim = (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? '\t' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === delim) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows.map((r) => r.map((c) => c.trim()))
}

/**
 * Turns rows into objects keyed by our field names. Each field lists header spellings people use
 * ("Business name", "hotel_name", "Store"…); matching ignores case, spaces and punctuation.
 */
export function mapRows<K extends string>(rows: string[][], fields: Record<K, readonly string[]>): { records: Record<K, string>[]; missing: K[] } {
  if (rows.length === 0) return { records: [], missing: Object.keys(fields) as K[] }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const header = rows[0].map(norm)
  const index = {} as Record<K, number>
  const missing: K[] = []
  for (const key of Object.keys(fields) as K[]) {
    const i = header.findIndex((h) => fields[key].map(norm).includes(h))
    index[key] = i
    if (i < 0) missing.push(key)
  }
  const records = rows.slice(1).map((r) => {
    const rec = {} as Record<K, string>
    for (const key of Object.keys(fields) as K[]) rec[key] = index[key] >= 0 ? (r[index[key]] ?? '').trim() : ''
    return rec
  })
  return { records, missing }
}

/** Builds a CSV file and starts the download. */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // Leading byte-order mark so Excel opens the file as UTF-8 (₹ and names in other scripts).
  const blob = new Blob([String.fromCharCode(0xfeff) + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const readFileText = (file: File) => file.text()
