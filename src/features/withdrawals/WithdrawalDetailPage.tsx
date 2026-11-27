import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, CheckCircle2, Clock, History, RefreshCw, Store, UserRound, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErrorState } from '@/components/common/ErrorState'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { formatInrFull, formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { usePayoutDetails, type PayoutDetail } from './api/withdrawal-insights.api'
import { PayoutCard } from './components/PayoutCard'
import { humanDuration, statusMeta } from './utils/payout-meta'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthLabel = (ym: string) => { const [y, m] = ym.split('-'); return `${MONTHS[Number(m) - 1]} ${y.slice(2)}` }

export function WithdrawalDetailPage({ withdrawalId }: { withdrawalId: number }) {
  const details = usePayoutDetails(withdrawalId)
  const d = details.data
  if (details.isError) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <BackLink />
        <ErrorState title="Couldn't open this withdrawal" description="It may not exist, or the connection failed." onRetry={() => void details.refetch()} />
      </div>
    )
  }
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <BackLink />
        <button type="button" onClick={() => void details.refetch()} className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted">
          <RefreshCw className={cn('h-3.5 w-3.5', details.isFetching && 'animate-spin')} /> Refresh
        </button>
      </div>
      {!d ? <Skeleton className="h-80 w-full rounded-3xl" /> : <PayoutCard row={d} standalone />}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Timeline d={d} />
          <Earnings d={d} />
        </div>
        <div className="flex flex-col gap-5">
          <StorePanel d={d} />
          <HistoryPanel d={d} />
        </div>
      </div>
    </motion.div>
  )
}

function BackLink() {
  return (
    <Link to="/withdrawals" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Withdrawals
    </Link>
  )
}

function Timeline({ d }: { d?: PayoutDetail }) {
  if (!d) return <Skeleton className="h-40 w-full rounded-2xl" />
  const steps = [
    { icon: UserRound, tone: 'from-sky-400 to-indigo-600', title: `${d.vendorName ?? 'The vendor'} asked to withdraw ${formatInrFull(d.amount)}`, at: d.createdAt, note: d.note ? `“${d.note}”` : undefined },
    ...(d.status === 'APPROVED' ? [{ icon: CheckCircle2, tone: 'from-emerald-400 to-teal-600', title: `Paid${d.reviewedByName ? ` by ${d.reviewedByName}` : ''}`, at: d.reviewedAt, note: [d.adminNote, d.decisionSeconds != null ? `after ${humanDuration(d.decisionSeconds)}` : null].filter(Boolean).join(' · ') }] : []),
    ...(d.status === 'REJECTED' ? [{ icon: XCircle, tone: 'from-rose-400 to-red-600', title: `Rejected${d.reviewedByName ? ` by ${d.reviewedByName}` : ''}`, at: d.reviewedAt, note: d.adminNote ?? undefined }] : []),
    ...(d.status === 'PENDING' ? [{ icon: Clock, tone: 'from-amber-400 to-orange-600', title: 'Waiting to be paid', at: null as string | null, note: d.createdAt ? `for ${formatRelative(d.createdAt).replace(' ago', '')}` : undefined }] : []),
  ]
  return (
    <Panel title="What happened" icon={<History className="h-4 w-4" />}>
      <ol className="relative">
        <span className="absolute bottom-6 left-[19px] top-6 w-px bg-border" aria-hidden />
        {steps.map((s, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.12 }} className="relative flex gap-3 py-2.5">
            <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md ring-4 ring-card', s.tone, i === steps.length - 1 && d.status === 'PENDING' && 'animate-pulse')}>
              <s.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-[11px] text-muted-foreground">{s.at ? `${formatDateTime(s.at)} · ${formatRelative(s.at)}` : ''}{s.note ? `${s.at ? ' · ' : ''}${s.note}` : ''}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </Panel>
  )
}

function Earnings({ d }: { d?: PayoutDetail }) {
  const rows = d?.earningsByMonth ?? []
  return (
    <Panel title="What this vendor earned" subtitle="Online card sales minus Strike’s commission, by month" icon={<BarChart3 className="h-4 w-4" />}>
      {!d ? <Skeleton className="h-52 w-full" /> : rows.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No sales recorded yet</p> : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <defs><linearGradient id="wd-earn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#0d9488" /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip labelFormatter={(l) => monthLabel(String(l))} formatter={(v) => [formatInrFull(Number(v)), 'Earned']} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-popover)', fontSize: 12 }} />
              <Bar dataKey="earned" fill="url(#wd-earn)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1100} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

function StorePanel({ d }: { d?: PayoutDetail }) {
  if (!d) return <Skeleton className="h-40 w-full rounded-2xl" />
  return (
    <Panel title="Vendor" icon={<Store className="h-4 w-4" />}>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        {[
          ['Store', d.store?.name ?? '—'], ['Store status', d.store?.status?.toLowerCase() ?? '—'],
          ['Phone', d.store?.phone ?? d.vendorMobile ?? '—'], ['Payouts so far', String(d.vendorPayouts ?? 0)],
          ['Earned online', formatInrFull(d.vendorEarned)], ['Already paid', formatInrFull(d.vendorPaidOut)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-muted/50 px-3 py-2"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="mt-0.5 truncate font-semibold capitalize text-foreground">{v}</dd></div>
        ))}
      </dl>
      {d.store?.address && <p className="mt-3 text-xs text-muted-foreground">{d.store.address}</p>}
      <Link to="/vendors/$vendorId" params={{ vendorId: String(d.vendorId) }} search={{ tab: undefined }} className="mt-3 inline-block text-xs font-medium text-primary hover:underline">Open vendor dashboard →</Link>
    </Panel>
  )
}

function HistoryPanel({ d }: { d?: PayoutDetail }) {
  const navigate = useNavigate()
  if (!d) return null
  const list = d.history ?? []
  return (
    <Panel title="Their other withdrawals" icon={<History className="h-4 w-4" />}>
      {list.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">This is their first one</p> : (
        <ul className="flex flex-col gap-1">
          {list.map((h) => {
            const s = statusMeta(h.status)
            return (
              <li key={h.id}>
                <button type="button" onClick={() => void navigate({ to: '/withdrawals/$withdrawalId', params: { withdrawalId: String(h.id) } })} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted/60">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', s.tone)}><s.icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{s.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{h.createdAt ? formatRelative(h.createdAt) : ''}{h.adminNote ? ` · ${h.adminNote}` : ''}</span>
                  </span>
                  <span className={cn('shrink-0 text-sm font-semibold tabular-nums', h.status === 'REJECTED' && 'text-muted-foreground line-through')}>{formatInrFull(h.amount)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export default WithdrawalDetailPage
