import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight, Clock, CreditCard, GitCommit, Globe, History, Info, Loader2, Percent, Power, Radio, Server, ShieldCheck, UserRound, UtensilsCrossed, XCircle, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import env from '@/config/env'
import { useAuthStore } from '@/store/auth-store'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { checkAppStatus, type SettingsHistoryEntry, type SettingsOverview } from '../api/settings-overview.api'
import { describeChange, type HistoryKind } from '../utils/settings-meta'
import { Card, SectionHead } from './SettingsBits'

const KIND: Record<HistoryKind, { icon: LucideIcon; tone: string; label: string }> = {
  access: { icon: Power, tone: 'bg-red-500/10 text-red-600', label: 'App access' },
  payments: { icon: CreditCard, tone: 'bg-indigo-500/10 text-indigo-600', label: 'Payments' },
  commission: { icon: Percent, tone: 'bg-orange-500/10 text-orange-600', label: 'Commission' },
  menus: { icon: UtensilsCrossed, tone: 'bg-amber-500/10 text-amber-600', label: 'Menu approvals' },
  other: { icon: Info, tone: 'bg-muted text-muted-foreground', label: 'Other' },
}

export function HistoryList({ entries, limit }: { entries: SettingsHistoryEntry[]; limit?: number }) {
  const shown = limit ? entries.slice(0, limit) : entries
  if (shown.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No settings have been changed yet.</p>
  return (
    <ol className="flex flex-col">
      {shown.map((e, i) => {
        const d = describeChange(e)
        const K = KIND[d.kind]
        const failed = e.outcome === 'FAILED' || e.outcome === 'FAILURE' || e.outcome === 'DENIED'
        return (
          <motion.li key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}
            className="group relative flex gap-3 pb-4 last:pb-0">
            {i < shown.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-px bg-border" aria-hidden />}
            <span className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110', K.tone)}>
              <K.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl px-2 py-1 transition-colors group-hover:bg-muted/40">
              <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-foreground">
                {d.title}
                {failed && <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 text-[10px] font-semibold text-red-600"><XCircle className="h-3 w-3" />didn&apos;t go through</span>}
              </p>
              {(d.from || d.to) && (
                <p className="mt-0.5 break-words text-xs text-muted-foreground">
                  {d.from && <span className="line-through">{d.from}</span>}
                  {d.from && d.to && <span className="mx-1.5">→</span>}
                  {d.to && <span className="font-medium text-foreground/80">{d.to}</span>}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-muted-foreground" title={e.at ? formatDateTime(e.at) : undefined}>
                {e.at ? formatRelative(e.at) : ''}{e.actor ? ` · ${e.actor}` : ''}
              </p>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}

export function HistorySection({ data }: { data: SettingsOverview | undefined }) {
  const [kind, setKind] = useState<HistoryKind | 'all'>('all')
  const entries = useMemo(() => (data?.history ?? []).filter((e) => kind === 'all' || describeChange(e).kind === kind), [data, kind])
  const counts = useMemo(() => {
    const c: Partial<Record<HistoryKind, number>> = {}
    for (const e of data?.history ?? []) { const k = describeChange(e).kind; c[k] = (c[k] ?? 0) + 1 }
    return c
  }, [data])
  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={History} tone="bg-gradient-to-br from-slate-500 to-slate-800 shadow-slate-500/30" title="Change history"
        body="Who changed which setting, and when. The last 30 changes are shown here."
        right={<Link to="/audit-logs" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Full audit log <ArrowRight className="h-3.5 w-3.5" /></Link>} />
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'access', 'payments', 'commission', 'menus', 'other'] as const).map((k) => {
          const n = k === 'all' ? data?.history.length ?? 0 : counts[k] ?? 0
          if (k !== 'all' && n === 0) return null
          return (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', kind === k ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted')}>
              {k === 'all' ? 'Everything' : KIND[k].label} <span className="opacity-70">{n}</span>
            </button>
          )
        })}
      </div>
      <Card>{data ? <HistoryList entries={entries} /> : <div className="h-40 animate-pulse rounded-xl bg-muted" />}</Card>
    </div>
  )
}

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium text-foreground">{children}</span>
    </div>
  )
}

export function AboutSection() {
  const user = useAuthStore((s) => s.user)
  const [build, setBuild] = useState<string | null | undefined>(undefined)
  const [ping, setPing] = useState<{ loading: boolean; ms?: number; ok?: boolean }>({ loading: true })
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let alive = true
    fetch(`/version.txt?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => { if (alive) setBuild(t && /^[0-9a-f]{7,40}\s*$/i.test(t) ? t.trim() : null) })
      .catch(() => { if (alive) setBuild(null) })
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => { alive = false; window.clearInterval(id) }
  }, [])

  const [pingTick, setPingTick] = useState(0)
  useEffect(() => {
    let alive = true
    checkAppStatus()
      .then((r) => { if (alive) setPing({ loading: false, ms: r.ms, ok: true }) })
      .catch(() => { if (alive) setPing({ loading: false, ok: false }) })
    return () => { alive = false }
  }, [pingTick])
  const runPing = () => { setPing({ loading: true }); setPingTick((t) => t + 1) }

  const india = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={Info} tone="bg-gradient-to-br from-cyan-400 to-blue-600 shadow-blue-500/30" title="About"
        body="Your account, this version of the admin panel, and whether the server is answering." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-1 text-sm font-semibold text-foreground">You</p>
          <Row icon={UserRound} label="Signed in as">{user?.name ?? '—'}</Row>
          <Row icon={Globe} label="Email">{user?.email ?? '—'}</Row>
          <Row icon={ShieldCheck} label="Access">{user?.role === 'SUPER_ADMIN' ? 'Super admin — every section' : `Sub-admin — ${user?.permissions.length ?? 0} sections`}</Row>
          <Row icon={Clock} label="Your time zone">{zone}</Row>
          <Row icon={Clock} label="Time in India">{india}</Row>
        </Card>
        <Card>
          <p className="mb-1 text-sm font-semibold text-foreground">System</p>
          <Row icon={Server} label="Server">
            {ping.loading ? <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" /> : ping.ok ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Answering · {ping.ms} ms</span>
            ) : <span className="text-red-600">Not answering</span>}
          </Row>
          <Row icon={GitCommit} label="Admin panel version">
            {build === undefined ? '…' : build ? <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{build.slice(0, 7)}</code> : `${env.version} (${env.environment})`}
          </Row>
          <Row icon={Globe} label="Server address">{env.apiBaseUrl || window.location.origin}</Row>
          <div className="pt-3">
            <button type="button" onClick={runPing} disabled={ping.loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50">
              <Radio className="h-3.5 w-3.5" /> Check again
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
