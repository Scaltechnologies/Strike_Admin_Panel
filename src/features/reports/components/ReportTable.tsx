import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportColumn, ReportRow } from '../api/report-builder.api'
import { STATUS_TONE, formatCell } from '../utils/report-meta'

const PAGE = 50
const numeric = (t: ReportColumn['type']) => t === 'money' || t === 'number' || t === 'percent'

export function ReportTable({ columns, rows, totals }: { columns: ReportColumn[]; rows: ReportRow[]; totals: Record<string, number> }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    let r = t ? rows.filter((row) => columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(t))) : rows
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      r = [...r].sort((a, b) => {
        const x = a[sort.key]
        const y = b[sort.key]
        if (x == null) return 1
        if (y == null) return -1
        return (col && numeric(col.type) ? Number(x) - Number(y) : String(x).localeCompare(String(y))) * sort.dir
      })
    }
    return r
  }, [rows, columns, q, sort])

  // While searching, the totals row adds up only the matching rows.
  const foot = useMemo(() => {
    if (!q.trim()) return totals
    const t: Record<string, number> = { rows: filtered.length }
    for (const c of columns) {
      if (c.key in totals && c.key !== 'rows') t[c.key] = filtered.reduce((s, r) => s + (Number(r[c.key]) || 0), 0)
    }
    return t
  }, [q, filtered, totals, columns])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const p = Math.min(page, pages - 1)
  const shown = filtered.slice(p * PAGE, p * PAGE + PAGE)
  const toggle = (key: string) => { setSort((s) => (s?.key === key ? (s.dir === -1 ? null : { key, dir: -1 }) : { key, dir: 1 })); setPage(0) }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search in this report"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <span className="text-xs text-muted-foreground">{q ? `${filtered.length} of ${rows.length} rows match` : `${rows.length} rows`} · click a heading to sort</span>
      </div>

      <div className="overflow-auto rounded-2xl border border-border" style={{ maxHeight: 620 }}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('whitespace-nowrap border-b border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground', numeric(c.type) ? 'text-right' : 'text-left')}>
                  <button type="button" onClick={() => toggle(c.key)} className={cn('inline-flex items-center gap-1 hover:text-foreground', numeric(c.type) && 'flex-row-reverse')}>
                    {c.label}
                    {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-muted-foreground">{q ? 'Nothing matches your search.' : 'Nothing happened in this period.'}</td></tr>
            ) : shown.map((row, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.01 }}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-violet-500/[0.04]">
                {columns.map((c) => {
                  const v = row[c.key]
                  return (
                    <td key={c.key} className={cn('px-3 py-2 align-top', numeric(c.type) ? 'whitespace-nowrap text-right tabular-nums' : 'max-w-[280px]', c.type === 'date' && 'whitespace-nowrap text-muted-foreground')}>
                      {c.type === 'status' && v ? (
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_TONE[String(v)] ?? 'bg-muted text-foreground/80')}>{formatCell(v, c.type)}</span>
                      ) : (
                        <span className={cn(c.type === 'text' && 'line-clamp-2 break-words', c.type === 'money' && Number(v) < 0 && 'text-red-600')} title={v != null ? String(v) : undefined}>{formatCell(v, c.type)}</span>
                      )}
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="sticky bottom-0 bg-card/95 backdrop-blur">
              <tr className="border-t-2 border-border">
                {columns.map((c, i) => (
                  <td key={c.key} className={cn('whitespace-nowrap px-3 py-2.5 text-sm font-bold', numeric(c.type) ? 'text-right tabular-nums' : '')}>
                    {i === 0 ? `${q.trim() ? 'Matching' : 'Total'} · ${foot.rows ?? rows.length}` : c.key in foot ? formatCell(foot[c.key], c.type) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button type="button" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="tabular-nums text-muted-foreground">Page {p + 1} of {pages}</span>
          <button type="button" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  )
}
