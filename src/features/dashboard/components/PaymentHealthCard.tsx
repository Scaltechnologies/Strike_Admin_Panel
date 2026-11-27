import { motion } from 'framer-motion'
import { Activity, BadgePercent, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import type { AnalyticsPaymentData } from '../types/dashboard.types'
import { AnimatedNumber, Panel, Skeleton } from './dashboard-ui'
import { formatCount, formatInrCompact, toNumber } from '../utils/dashboard-format'

function Ring({ percent }: { percent: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const tone = percent >= 90 ? '#22c55e' : percent >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90" aria-hidden>
      <defs>
        <linearGradient id="pay-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity={0.65} />
          <stop offset="100%" stopColor={tone} />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="11" />
      <motion.circle
        cx="64" cy="64" r={r} fill="none" stroke="url(#pay-ring)" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - Math.min(100, percent) / 100) }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      />
    </svg>
  )
}

export function PaymentHealthCard({ data, loading }: { data?: AnalyticsPaymentData; loading: boolean }) {
  const total = toNumber(data?.totalPayments)
  const completed = toNumber(data?.completedPayments)
  const failed = toNumber(data?.failedPayments)
  const refunded = toNumber(data?.refundedPayments)
  const finished = completed + failed
  const successRate = finished > 0 ? (completed / finished) * 100 : 0

  const rows = [
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
    { label: 'Failed', value: failed, icon: XCircle, color: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
    { label: 'Refunded', value: refunded, icon: RotateCcw, color: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' },
  ]

  return (
    <Panel title="Payment health" subtitle="Card purchases, all time" icon={<Activity className="h-4 w-4" />} className="h-full">
      {loading ? (
        <div className="flex flex-col items-center gap-4"><Skeleton className="h-36 w-36 rounded-full" /><Skeleton className="h-20 w-full" /></div>
      ) : total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No payments yet</div>
      ) : (
        <>
          <div className="relative mx-auto flex w-fit items-center justify-center">
            <Ring percent={successRate} />
            <div className="absolute flex flex-col items-center">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                <AnimatedNumber value={successRate} format={(n) => `${n.toFixed(n >= 99.95 || n === 0 ? 0 : 1)}%`} />
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">succeed</p>
            </div>
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{formatCount(total)}</span> payments in total
          </p>

          <ul className="mt-4 space-y-2.5">
            {rows.map(({ label, value, icon: Icon, color, bar }, i) => (
              <li key={label}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1.5 font-medium ${color}`}><Icon className="h-3.5 w-3.5" />{label}</span>
                  <span className="tabular-nums font-semibold text-foreground">{formatCount(value)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className={`h-full rounded-full ${bar}`} initial={{ width: 0 }}
                    animate={{ width: `${total ? (value / total) * 100 : 0}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 + i * 0.1 }} />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground"><BadgePercent className="h-3.5 w-3.5" />Discounts given</span>
            <span className="font-semibold text-foreground">{formatInrCompact(toNumber(data?.totalDiscounts))}</span>
          </div>
        </>
      )}
    </Panel>
  )
}
