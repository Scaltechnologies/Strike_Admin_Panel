import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowLeft, Download, Loader2, Printer, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'
import { downloadReportCsv, useReport, type ReportResult, type ReportType } from '../api/report-builder.api'
import { formatCell, rangeLabel, reportMeta } from '../utils/report-meta'
import { ReportTable } from './ReportTable'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

/** Opens a clean, printable copy of the report (the browser's print dialog can save it as PDF). */
function printReport(r: ReportResult, title: string) {
  const w = window.open('', '_blank', 'width=1100,height=800')
  if (!w) { toast.error('Allow pop-ups to print the report.'); return }
  const num = (t: string) => t === 'money' || t === 'number' || t === 'percent'
  const head = r.columns.map((c) => `<th class="${num(c.type) ? 'r' : ''}">${esc(c.label)}</th>`).join('')
  const body = r.rows.map((row) => `<tr>${r.columns.map((c) => `<td class="${num(c.type) ? 'r' : ''}">${esc(formatCell(row[c.key], c.type))}</td>`).join('')}</tr>`).join('')
  const foot = r.columns.map((c, i) => `<td class="${num(c.type) ? 'r' : ''}">${i === 0 ? `Total · ${r.totalRows}` : c.key in r.totals ? esc(formatCell(r.totals[c.key], c.type)) : ''}</td>`).join('')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:28px}
    h1{font-size:20px;margin:0}.sub{color:#666;font-size:12px;margin:4px 0 16px}
    table{border-collapse:collapse;width:100%;font-size:11px}th,td{border-bottom:1px solid #e5e7eb;padding:5px 6px;text-align:left;vertical-align:top}
    th{background:#f5f5f7;font-weight:600}.r{text-align:right;white-space:nowrap}tfoot td{font-weight:700;border-top:2px solid #111}
    .note{color:#b45309;font-size:11px;margin-bottom:10px}@page{size:landscape;margin:12mm}
  </style></head><body><h1>Strike · ${esc(title)}</h1>
  <p class="sub">${esc(rangeLabel(r.from, r.to))} (India time) · generated ${esc(new Date(r.generatedAt).toLocaleString('en-IN'))}</p>
  ${r.truncated ? `<p class="note">Showing the first ${r.rows.length} of ${r.totalRows} rows — download the CSV for everything. Totals cover all rows.</p>` : ''}
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody><tfoot><tr>${foot}</tr></tfoot></table>
  <script>window.onload=()=>{window.print()}</script></body></html>`)
  w.document.close()
}

export function ReportView({ type, from, to, onBack, onDownloaded }: {
  type: ReportType; from: string; to: string; onBack: () => void; onDownloaded: (type: ReportType, from: string, to: string) => void
}) {
  const meta = reportMeta(type)!
  const report = useReport(type, from, to)
  const [downloading, setDownloading] = useState(false)
  const r = report.data
  const Icon = meta.icon
  const totalCols = (r?.columns ?? []).filter((c) => c.key in (r?.totals ?? {}) && c.key !== 'rows').slice(0, 6)

  const download = async () => {
    setDownloading(true)
    try {
      const name = await downloadReportCsv(type, from, to)
      toast.success(`${name} downloaded`)
      onDownloaded(type, from, to)
    } catch {
      toast.error("Couldn't download the report.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="All reports" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', meta.tone)}><Icon className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{meta.title}</h2>
            <p className="text-xs text-muted-foreground">{meta.answers} · {rangeLabel(from, to)}{r ? ` · made ${formatDateTime(r.generatedAt)}` : ''}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void report.refetch()} disabled={report.isFetching} aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted disabled:opacity-50">
            <RefreshCw className={cn('h-4 w-4', report.isFetching && 'animate-spin')} />
          </button>
          <button type="button" onClick={() => r && printReport(r, meta.title)} disabled={!r}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void download()} disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 hover:opacity-95 disabled:opacity-60">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download CSV
          </motion.button>
        </div>
      </div>

      {report.isLoading ? (
        <div className="flex flex-col gap-3"><div className="h-24 animate-pulse rounded-2xl bg-muted" /><div className="h-96 animate-pulse rounded-2xl bg-muted" /></div>
      ) : report.isError || !r ? (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700"><AlertTriangle className="h-4 w-4" />Couldn&apos;t make this report. <button type="button" className="font-semibold underline" onClick={() => void report.refetch()}>Try again</button></div>
      ) : (
        <>
          {totalCols.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Rows</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{r.totalRows.toLocaleString('en-IN')}</p>
              </motion.div>
              {totalCols.slice(0, 5).map((c, i) => (
                <motion.div key={c.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.04 }} whileHover={{ y: -3 }}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <p className="truncate text-xs text-muted-foreground" title={c.label}>{c.label}</p>
                  <p className="mt-1 truncate text-xl font-bold tabular-nums text-foreground">{formatCell(r.totals[c.key], c.type)}</p>
                </motion.div>
              ))}
            </div>
          )}

          {type === 'daily' && r.rows.length > 1 && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#257de0]" />Collected</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#f47230]" />Used at stores</span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={r.rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickFormatter={(d: string) => formatCell(d, 'date').split(', ').pop() ?? d} tickLine={false} axisLine={false} tick={axis} minTickGap={24} />
                    <YAxis tickFormatter={(v: number) => formatCell(v, 'money')} tickLine={false} axisLine={false} width={64} tick={axis} />
                    <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} formatter={(v, n) => [formatCell(v as number, 'money'), n === 'collected' ? 'Collected' : 'Used at stores']}
                      labelFormatter={(d) => formatCell(String(d), 'date')} />
                    <Bar dataKey="collected" fill="#257de0" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="redeemed" fill="#f47230" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {r.truncated && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              Showing the first {r.rows.length.toLocaleString('en-IN')} of {r.totalRows.toLocaleString('en-IN')} rows. The totals cover everything — download the CSV for every row.
            </div>
          )}

          <ReportTable key={`${type}-${from}-${to}`} columns={r.columns} rows={r.rows} totals={r.totals} />
        </>
      )}
    </motion.div>
  )
}
