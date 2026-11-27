import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, formatDistanceToNowStrict, isValid } from 'date-fns'
import { HandCoins, Route, RotateCcw, ShieldCheck, ShoppingBag, Smartphone, XCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { parseServerDate } from '@/utils/helpers/date'
import { readPage } from '@/utils/helpers/page'
import { auditLogsApi } from '@/features/audit-logs/api/audit-logs.api'
import { summaryOf } from '@/features/audit-logs/utils/audit-display'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { formatInrFull } from '@/features/vendors/utils/vendor-meta'
import type { PurchasePage } from '../api/user-insights.api'
import type { ApiWrappedPage, UserRedemption } from '../types/user.types'

interface JourneyEvent {
  key: string
  at: Date
  icon: LucideIcon
  tone: string
  title: string
  detail?: string
  amount?: string
  amountTone?: string
  failed?: boolean
}

/** Things already shown from real purchase / redemption records, so the app-action copy is skipped. */
const DUPLICATE_ACTIONS = new Set(['PAYMENT_STARTED', 'PAYMENT_COMPLETED', 'CARD_PURCHASED', 'REDEMPTION_REQUESTED'])

/** One timeline of everything about a customer: purchases, refunds, redemptions, app actions, admin actions. */
export function UserJourney({ userId, mobile, purchases, redemptions, loading, limit = 20, title = 'Customer journey' }: {
  userId: number
  mobile?: string
  purchases?: PurchasePage
  redemptions?: ApiWrappedPage<UserRedemption>
  loading: boolean
  limit?: number
  title?: string
}) {
  const canAudit = hasPermission('SEC_AUDIT_LOGS')
  const own = useQuery({
    queryKey: ['users', userId, 'journey', 'own', mobile],
    queryFn: () => auditLogsApi.list({ range: 'all', actorEmail: mobile }, 0, 40),
    enabled: canAudit && !!mobile,
    retry: 1,
    meta: { suppressError: true },
  })
  const admin = useQuery({
    queryKey: ['users', userId, 'journey', 'admin'],
    queryFn: () => auditLogsApi.list({ range: 'all', entityType: 'User', entityId: userId }, 0, 40),
    enabled: canAudit,
    retry: 1,
    meta: { suppressError: true },
  })

  const events = useMemo(() => {
    const out: JourneyEvent[] = []
    for (const p of purchases?.content ?? []) {
      const at = parseServerDate(p.createdAt ?? '')
      if (!isValid(at)) continue
      const refunded = p.status === 'REFUNDED'
      out.push({
        key: `p${p.id}`, at, icon: ShoppingBag, tone: 'from-amber-400 to-orange-600',
        title: `Bought ${p.cardName ?? 'a card'}`,
        detail: [p.vendorName, p.paymentMethod === 'PAY_AT_STORE' ? 'paid at store' : 'paid online', p.couponCode ? `coupon ${p.couponCode}` : null].filter(Boolean).join(' · '),
        amount: formatInrFull(p.amountPaid), amountTone: 'text-foreground', failed: p.status === 'FAILED',
      })
      if (refunded && p.refundedAt) {
        const rAt = parseServerDate(p.refundedAt)
        if (isValid(rAt)) out.push({
          key: `r${p.id}`, at: rAt, icon: RotateCcw, tone: 'from-sky-400 to-indigo-600',
          title: `Refunded ${p.cardName ?? 'a card'}`, detail: p.refundReason ?? undefined,
          amount: `+${formatInrFull(p.amountPaid)}`, amountTone: 'text-sky-600 dark:text-sky-400',
        })
      }
    }
    for (const r of readPage<UserRedemption>(redemptions).content) {
      const at = parseServerDate(r.createdAt)
      if (!isValid(at)) continue
      const ok = r.status === 'COMPLETED'
      const refused = r.status === 'REJECTED' || r.status === 'FAILED' || r.status === 'CANCELLED'
      out.push({
        key: `x${r.id}`, at, icon: refused ? XCircle : HandCoins, tone: refused ? 'from-red-400 to-rose-600' : 'from-emerald-400 to-teal-600',
        title: ok ? 'Used their card at a store' : refused ? `Redemption ${r.status.toLowerCase()}` : 'Asked to use their card',
        detail: [r.failureReason, r.storeId ? `store #${r.storeId}` : null].filter(Boolean).join(' · ') || undefined,
        amount: `−${formatInrFull(r.totalAmount)}`, amountTone: refused ? 'text-muted-foreground line-through' : 'text-emerald-600 dark:text-emerald-400',
        failed: refused,
      })
    }
    const seen = new Set<number>()
    for (const l of [...(own.data?.content ?? []), ...(admin.data?.content ?? [])]) {
      if (seen.has(l.id) || DUPLICATE_ACTIONS.has(l.action)) continue
      seen.add(l.id)
      const at = parseServerDate(l.createdAtUtc ?? l.createdAt)
      if (!isValid(at)) continue
      const byAdmin = l.actorType === 'ADMIN'
      out.push({
        key: `a${l.id}`, at, icon: byAdmin ? ShieldCheck : Smartphone,
        tone: byAdmin ? 'from-violet-500 to-fuchsia-600' : 'from-pink-400 to-rose-600',
        title: byAdmin ? `${l.actorName ?? l.actorEmail ?? 'An admin'}: ${summaryOf(l).charAt(0).toLowerCase()}${summaryOf(l).slice(1)}` : summaryOf(l),
        detail: l.outcome === 'FAILED' ? (l.details ?? 'Failed') : byAdmin ? 'Admin panel' : 'Strike app',
        failed: l.outcome === 'FAILED',
      })
    }
    return out.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
  }, [purchases, redemptions, own.data, admin.data, limit])

  const busy = loading || (canAudit && (own.isLoading || admin.isLoading))

  return (
    <Panel title={title} subtitle="Purchases, card use, app activity and admin actions, newest first" icon={<Route className="h-4 w-4" />} className="h-full">
      {busy && events.length === 0 ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : events.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nothing has happened yet</p>
      ) : (
        <ol className="relative">
          <span className="absolute bottom-5 left-[19px] top-5 w-px bg-gradient-to-b from-border via-border to-transparent" aria-hidden />
          {events.map((ev, i) => {
            const Icon = ev.icon
            return (
              <motion.li key={ev.key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 15) * 0.04, type: 'spring', stiffness: 320, damping: 28 }}
                className="group relative flex gap-3 rounded-xl py-2.5 pr-2 transition-colors hover:bg-muted/40">
                <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md ring-4 ring-card transition-transform group-hover:scale-110', ev.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn('text-sm font-medium', ev.failed ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>{ev.title}</p>
                    {ev.amount && <span className={cn('shrink-0 text-sm font-semibold tabular-nums', ev.amountTone)}>{ev.amount}</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    <span title={format(ev.at, 'PPpp')}>{format(ev.at, 'MMM d, yyyy · HH:mm')} · {formatDistanceToNowStrict(ev.at, { addSuffix: true })}</span>
                    {ev.detail && <span> · {ev.detail}</span>}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
