import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowDownCircle, ArrowRight, BadgePercent, CalendarRange, Download, FileSpreadsheet, HandCoins, History, IndianRupee, Loader2, Receipt, RotateCcw, UserPlus, type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { Delta } from '@/features/analytics/components/AnalyticsCharts'
import { change } from '@/features/analytics/utils/analytics-format'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { formatRelative } from '@/utils/helpers/date'
import { downloadReportCsv, useReportSummary, type DailyTotals, type ReportType } from './api/report-builder.api'
import { ReportView } from './components/ReportView'
import { PRESETS, REPORTS, presetRange, rangeLabel, reportMeta, type PresetId } from './utils/report-meta'

const HISTORY_KEY = 'strike-report-downloads'
type Recent = { type: ReportType; from: string; to: string; at: string }

function readHistory(): Recent[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as Recent[] } catch { return [] }
}

const STATS: { key: keyof DailyTotals; label: string; icon: LucideIcon; tone: string; money?: boolean; invert?: boolean }[] = [
  { key: 'collected', label: 'Money collected', icon: IndianRupee, tone: 'from-sky-400 to-indigo-600', money: true },
  { key: 'sales', label: 'Cards sold', icon: Receipt, tone: 'from-emerald-400 to-teal-600' },
  { key: 'commission', label: 'Strike commission', icon: BadgePercent, tone: 'from-orange-400 to-red-600', money: true },
  { key: 'redeemed', label: 'Used at stores', icon: HandCoins, tone: 'from-cyan-400 to-blue-600', money: true },
  { key: 'refunded', label: 'Refunded', icon: RotateCcw, tone: 'from-violet-500 to-fuchsia-600', money: true, invert: true },
  { key: 'paid_out', label: 'Paid to vendors', icon: ArrowDownCircle, tone: 'from-rose-400 to-red-600', money: true },
  { key: 'new_customers', label: 'New customers', icon: UserPlus, tone: 'from-pink-400 to-rose-600' },
]

export function ReportsPage({ report, from: fromParam, to: toParam }: { report?: ReportType; from?: string; to?: string }) {
  const navigate = useNavigate()
  const def = presetRange('month')
  const from = fromParam ?? def.from
  const to = toParam ?? def.to
  const summary = useReportSummary(from, to)
  const s = summary.data
  const [history, setHistory] = useState<Recent[]>(readHistory)
  const [quick, setQuick] = useState<ReportType | null>(null)

  const go = (patch: { report?: ReportType | null; from?: string; to?: string }) => void navigate({
    to: '/reports',
    search: {
      report: patch.report === null ? undefined : (patch.report ?? report),
      from: patch.from ?? fromParam,
      to: patch.to ?? toParam,
    },
    replace: true,
  })
  const activePreset = PRESETS.find((p) => { const r = presetRange(p.id); return r.from === from && r.to === to })?.id

  const remember = (type: ReportType, f: string, t: string) => {
    const next = [{ type, from: f, to: t, at: new Date().toISOString() }, ...history.filter((h) => !(h.type === type && h.from === f && h.to === t))].slice(0, 8)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }
  const quickDownload = async (type: ReportType, f = from, t = to) => {
    setQuick(type)
    try {
      const name = await downloadReportCsv(type, f, t)
      toast.success(`${name} downloaded`)
      remember(type, f, t)
    } catch {
      toast.error("Couldn't download the report.")
    } finally {
      setQuick(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <FileSpreadsheet className="auth-float pointer-events-none absolute -right-6 -top-4 h-44 w-44 text-white/[0.04]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-teal-500 to-cyan-700 shadow-lg shadow-teal-600/40"><FileSpreadsheet className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">Pick a period, open any report to see it right here, then download it for Excel or print it as a PDF. All times are India time.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-md">
              <CalendarRange className="h-4 w-4 text-white/60" />
              <input type="date" value={from} max={to} onChange={(e) => e.target.value && go({ from: e.target.value })} aria-label="From"
                className="bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
              <span className="text-xs text-white/50">to</span>
              <input type="date" value={to} min={from} onChange={(e) => e.target.value && go({ to: e.target.value })} aria-label="To"
                className="bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => { const r = presetRange(p.id as PresetId); go(r) }}
                className={cn('relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors', activePreset === p.id ? 'text-[#0b0c10]' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
                {activePreset === p.id && <motion.span layoutId="rep-preset" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                <span className="relative">{p.label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {STATS.map((st) => {
              const now = Number(s?.current[st.key] ?? 0)
              const before = Number(s?.previous[st.key] ?? 0)
              return (
                <div key={st.key} className="rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white', st.tone)}><st.icon className="h-3.5 w-3.5" /></span>
                    {s && <Delta value={change(now, before)} invert={st.invert} />}
                  </div>
                  {s ? <AnimatedNumber value={now} format={st.money ? formatInrShort : undefined} className="mt-2 block truncate text-lg font-bold text-white" />
                    : <span className="mt-2 block text-lg font-bold text-white">—</span>}
                  <span className="block truncate text-[11px] text-white/55">{st.label}</span>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-white/45">{rangeLabel(from, to)}{s ? ` · compared with ${rangeLabel(s.previousFrom, s.previousTo)}` : ''}</p>
        </div>
      </motion.section>

      {report ? (
        <ReportView key={report} type={report} from={from} to={to} onBack={() => go({ report: null })} onDownloaded={remember} />
      ) : (
        <>
          {(['Money', 'Vendors', 'Customers & cards'] as const).map((group, gi) => (
            <section key={group} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {REPORTS.filter((r) => r.group === group).map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 + i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                    whileHover={{ y: -4 }}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg">
                    <span className={cn('pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity group-hover:opacity-25', r.tone)} />
                    <div className="flex items-start justify-between">
                      <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', r.tone)}><r.icon className="h-5 w-5" /></span>
                      <button type="button" onClick={() => void quickDownload(r.id)} disabled={quick === r.id} title="Download CSV for this period"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-emerald-500 hover:bg-emerald-500 hover:text-white disabled:opacity-60">
                        {quick === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </button>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{r.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.answers}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.inside.map((x) => <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70">{x}</span>)}
                    </div>
                    <button type="button" onClick={() => go({ report: r.id })}
                      className="mt-auto inline-flex items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-primary">
                      Open report <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}

          {history.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><History className="h-4 w-4 text-primary" /> Your recent downloads</h2>
                <button type="button" onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY) }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
              </div>
              <ul className="divide-y divide-border">
                {history.map((h) => {
                  const m = reportMeta(h.type)
                  if (!m) return null
                  return (
                    <li key={`${h.type}-${h.from}-${h.to}`} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <span className="inline-flex items-center gap-3">
                        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white', m.tone)}><m.icon className="h-4 w-4" /></span>
                        <span>
                          <span className="block text-sm font-medium text-foreground">{m.title}</span>
                          <span className="block text-xs text-muted-foreground">{rangeLabel(h.from, h.to)} · downloaded {formatRelative(h.at)}</span>
                        </span>
                      </span>
                      <span className="flex gap-2">
                        <button type="button" onClick={() => go({ report: h.type, from: h.from, to: h.to })} className="rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-muted">Open</button>
                        <button type="button" onClick={() => void quickDownload(h.type, h.from, h.to)} disabled={quick === h.type}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-60">
                          <Download className="h-3.5 w-3.5" /> Again
                        </button>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default ReportsPage
