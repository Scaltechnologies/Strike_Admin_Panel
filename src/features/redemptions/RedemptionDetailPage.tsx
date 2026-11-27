import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowUpRight, CalendarClock, CheckCircle2, Clock, CreditCard, History, MapPin, Phone, Receipt, RefreshCw, Smartphone, Store, UserRound, Wallet, XCircle,
} from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { hasPermission } from '@/core/auth/auth'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, formatRelative } from '@/utils/helpers/date'
import { AnimatedNumber, Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer, riseIn, toNumber } from '@/features/dashboard/utils/dashboard-format'
import { avatarGradient, formatInrFull, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { UserAvatar } from '@/features/users/components/UserAvatar'
import { useRedemptionDetails, type RedemptionDetail } from './api/redemption-insights.api'
import { humanDuration, initiatedLabel, statusMeta, usablePhoto } from './utils/redemption-meta'

export function RedemptionDetailPage({ redemptionId }: { redemptionId: number }) {
  const details = useRedemptionDetails(redemptionId)
  const d = details.data

  if (details.isError) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <BackLink />
        <ErrorState title="Couldn't open this redemption" description="It may not exist, or the connection failed." onRetry={() => void details.refetch()} />
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <BackLink />
        <button type="button" onClick={() => void details.refetch()} className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <RefreshCw className={cn('h-3.5 w-3.5', details.isFetching && 'animate-spin')} /> Refresh
        </button>
      </div>

      {!d ? <Skeleton className="h-64 w-full rounded-3xl" /> : <Hero d={d} />}

      <ErrorBoundary fallback={<TabError />}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="flex flex-col gap-5 xl:col-span-2">
            <Bill d={d} loading={details.isLoading} />
            <Timeline d={d} loading={details.isLoading} />
          </div>
          <div className="flex flex-col gap-5">
            <CardWallet d={d} loading={details.isLoading} />
            <People d={d} loading={details.isLoading} />
            <CustomerHistory d={d} loading={details.isLoading} />
          </div>
        </div>
      </ErrorBoundary>
    </motion.div>
  )
}

function BackLink() {
  return (
    <Link to="/redemptions" search={{ tab: 'activity' }} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> All redemptions
    </Link>
  )
}

function Hero({ d }: { d: RedemptionDetail }) {
  const meta = statusMeta(d.status)
  const refused = d.status === 'REJECTED' || d.status === 'FAILED' || d.status === 'REVERSED'
  const name = d.customerName?.trim() || d.customerMobile || `Customer #${d.userId ?? '—'}`
  return (
    <motion.section variants={riseIn} className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-8">
      <div className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: meta.color }} aria-hidden />
      <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white/70">Redemption #{d.id}</span>
            {d.initiatedBy && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">via {initiatedLabel(d.initiatedBy).toLowerCase()}</span>}
          </div>
          <p className="mt-4 text-sm text-white/60">{refused || d.status === 'CANCELLED' ? 'Asked to spend' : d.status === 'PENDING' ? 'Wants to spend' : 'Spent from card wallet'}</p>
          <AnimatedNumber value={toNumber(d.amount)} format={formatInrFull}
            className={cn('mt-1 block text-5xl font-extrabold tracking-tight', refused || d.status === 'CANCELLED' ? 'text-white/50 line-through' : 'text-white')} />
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4" />{name}</span>
            <span className="flex items-center gap-1.5"><Store className="h-4 w-4" />{d.storeName ?? `Store #${d.storeId ?? '—'}`}</span>
            <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" />{d.cardName ?? d.card?.name ?? 'Card'}</span>
            {d.createdAt && <span className="flex items-center gap-1.5" title={formatDateTime(d.createdAt)}><Clock className="h-4 w-4" />{formatDateTime(d.createdAt)}</span>}
          </p>
          {refused && d.failureReason && (
            <p className="mt-4 inline-flex max-w-2xl items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-100">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {d.failureReason}
            </p>
          )}
        </div>
        <motion.div initial={{ scale: 1.6, rotate: -25, opacity: 0 }} animate={{ scale: 1, rotate: -8, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.25 }}
          className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 text-center font-extrabold uppercase tracking-wider shadow-2xl"
          style={{ borderColor: meta.color, color: meta.color, boxShadow: `0 0 40px ${meta.color}55` }}>
          <meta.icon className="h-8 w-8" />
          <span className="mt-1 px-3 text-sm leading-tight">{meta.label}</span>
          {d.decisionSeconds != null && <span className="mt-1 text-[10px] font-semibold normal-case tracking-normal opacity-80">in {humanDuration(d.decisionSeconds)}</span>}
        </motion.div>
      </div>
    </motion.section>
  )
}

function Bill({ d, loading }: { d?: RedemptionDetail; loading: boolean }) {
  const items = d?.items ?? []
  const sum = items.reduce((s, i) => s + toNumber(i.totalPrice), 0)
  return (
    <Panel title="Bill" subtitle="What was paid for with the card" icon={<Receipt className="h-4 w-4" />}>
      {loading ? <Skeleton className="h-32 w-full" /> : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No item list for this redemption — the store entered an amount only.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-dashed border-border bg-[repeating-linear-gradient(0deg,transparent,transparent_27px,var(--color-muted)_28px)] dark:bg-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashed border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Item</th><th className="px-4 py-2.5 text-center font-semibold">Qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">Price</th><th className="px-4 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <motion.tr key={`${i.menuItemId}-${idx}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }} className="border-b border-dashed border-border/70 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{i.name ?? `Item #${i.menuItemId}`}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">× {i.quantity}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatInrFull(i.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">{formatInrFull(i.totalPrice)}</td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-dashed border-border bg-muted/40">
                <td className="px-4 py-3 font-bold text-foreground" colSpan={3}>Total</td>
                <td className="px-4 py-3 text-right text-base font-extrabold tabular-nums text-foreground">{formatInrFull(sum || d?.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Panel>
  )
}

function Timeline({ d, loading }: { d?: RedemptionDetail; loading: boolean }) {
  if (loading || !d) return <Skeleton className="h-40 w-full rounded-2xl" />
  const steps: { icon: typeof Clock; tone: string; title: string; at: string | null; note?: string }[] = [
    { icon: Smartphone, tone: 'from-sky-400 to-indigo-600', title: d.initiatedBy === 'USER' ? 'Customer asked to pay with their card' : 'Store started the redemption', at: d.createdAt, note: initiatedLabel(d.initiatedBy) },
  ]
  if (d.approvedAt) steps.push({ icon: CheckCircle2, tone: 'from-emerald-400 to-teal-600', title: 'Store approved — wallet charged', at: d.approvedAt, note: d.balanceAfter != null ? `${formatInrFull(d.balanceAfter)} left on the card` : undefined })
  if (d.rejectedAt) steps.push({ icon: XCircle, tone: 'from-rose-400 to-red-600', title: d.status === 'FAILED' ? 'Redemption failed' : 'Store rejected it', at: d.rejectedAt, note: d.failureReason ?? undefined })
  if (d.cancelledAt) steps.push({ icon: XCircle, tone: 'from-slate-400 to-slate-600', title: 'Customer cancelled it', at: d.cancelledAt })
  if (d.status === 'COMPLETED' && !d.approvedAt) steps.push({ icon: CheckCircle2, tone: 'from-emerald-400 to-teal-600', title: 'Completed', at: null })
  if (d.status === 'PENDING') steps.push({ icon: Clock, tone: 'from-amber-400 to-orange-600', title: 'Waiting for the store to approve', at: null, note: d.createdAt ? `waiting ${formatRelative(d.createdAt).replace(' ago', '')}` : undefined })
  return (
    <Panel title="What happened" subtitle="Step by step" icon={<History className="h-4 w-4" />}>
      <ol className="relative">
        <span className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-border via-border to-transparent" aria-hidden />
        {steps.map((s, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.12, type: 'spring', stiffness: 300, damping: 26 }}
            className="relative flex gap-3 py-2.5">
            <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md ring-4 ring-card', s.tone,
              i === steps.length - 1 && d.status === 'PENDING' && 'animate-pulse')}>
              <s.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {s.at ? `${formatDateTime(s.at)} · ${formatRelative(s.at)}` : ''}{s.note ? `${s.at ? ' · ' : ''}${s.note}` : ''}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </Panel>
  )
}

function CardWallet({ d, loading }: { d?: RedemptionDetail; loading: boolean }) {
  const c = d?.card
  const canCard = hasPermission('SEC_CARDS')
  if (loading) return <Skeleton className="h-56 w-full rounded-2xl" />
  if (!c) return null
  const total = toNumber(c.walletAmount)
  const now = toNumber(c.walletBalanceNow)
  const usedPct = total > 0 ? Math.min(100, Math.max(0, ((total - now) / total) * 100)) : 0
  return (
    <Panel title="Card used" subtitle={`${c.redemptions} completed redemption${c.redemptions === 1 ? '' : 's'} on this card`} icon={<Wallet className="h-4 w-4" />}
      action={canCard && c.cardId != null ? (
        <Link to="/cards/$cardId" params={{ cardId: String(c.cardId) }} className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">Card <ArrowUpRight className="h-3 w-3" /></Link>
      ) : undefined}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a0700] via-[#e01a00] to-[#ffb000] p-4 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{d?.storeName ?? 'Strike'}</p>
        <p className="mt-0.5 text-lg font-bold">{c.name ?? d?.cardName ?? 'Card'}</p>
        <p className="mt-3 text-[10px] uppercase tracking-widest text-white/70">Balance now</p>
        <p className="font-mono text-2xl font-bold tabular-nums">{formatInrFull(now)}</p>
        <p className="text-[11px] text-white/80">of {formatInrFull(total)} loaded · {c.status?.toLowerCase()}</p>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground"><span>Used</span><span className="tabular-nums">{Math.round(usedPct)}%</span></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-600" initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ duration: 1.1, delay: 0.3 }} />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Fact label="Left after this" value={d?.balanceAfter != null ? formatInrFull(d.balanceAfter) : '—'} />
        <Fact label="Card price" value={formatInrFull(c.cardPrice)} />
        <Fact label="Bought" value={c.purchasedAt ? formatDate(c.purchasedAt) : '—'} />
        <Fact label="Expires" value={c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'} />
      </dl>
    </Panel>
  )
}

function People({ d, loading }: { d?: RedemptionDetail; loading: boolean }) {
  const navigate = useNavigate()
  if (loading || !d) return <Skeleton className="h-48 w-full rounded-2xl" />
  const name = d.customerName?.trim() || d.customerMobile || `Customer #${d.userId ?? '—'}`
  const canUser = hasPermission('SEC_USERS') && d.userId != null
  const canVendor = hasPermission('SEC_VENDORS') && d.vendorId != null
  return (
    <Panel title="Customer & store" icon={<UserRound className="h-4 w-4" />}>
      <button type="button" disabled={!canUser} onClick={() => canUser && void navigate({ to: '/users/$userId', params: { userId: String(d.userId) }, search: { tab: undefined } })}
        className={cn('flex w-full items-center gap-3 rounded-xl p-2 text-left', canUser && 'transition-colors hover:bg-muted/60')}>
        <UserAvatar id={d.userId ?? d.id} name={name} photo={usablePhoto(d.customerPhoto)} className="h-11 w-11 rounded-full text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
          {d.customerMobile && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{d.customerMobile}</span>}
        </span>
        {canUser && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      <div className="my-2 border-t border-border" />
      <button type="button" disabled={!canVendor} onClick={() => canVendor && void navigate({ to: '/vendors/$vendorId', params: { vendorId: String(d.vendorId) }, search: { tab: undefined } })}
        className={cn('flex w-full items-center gap-3 rounded-xl p-2 text-left', canVendor && 'transition-colors hover:bg-muted/60')}>
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-sm font-bold text-white', avatarGradient(d.storeId ?? 0))}>
          {usablePhoto(d.storeLogo) ? <img src={usablePhoto(d.storeLogo)!} alt="" className="h-full w-full object-cover" /> : vendorInitials(d.storeName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{d.storeName ?? `Store #${d.storeId ?? '—'}`}</span>
          <span className="block truncate text-xs text-muted-foreground">{d.vendorName ?? ''}{d.managerName ? ` · manager ${d.managerName}` : ''}</span>
          {d.storeAddress && <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{d.storeAddress}</span>}
        </span>
        {canVendor && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
      </button>
    </Panel>
  )
}

function CustomerHistory({ d, loading }: { d?: RedemptionDetail; loading: boolean }) {
  const navigate = useNavigate()
  if (loading || !d) return null
  const list = d.customerRecent ?? []
  return (
    <Panel title="This customer's other redemptions" subtitle={d.customerTotals ? `${toNumber(d.customerTotals.completed)} completed · ${formatInrFull(d.customerTotals.amount)} in total` : undefined}
      icon={<CalendarClock className="h-4 w-4" />}>
      {list.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">This is their first one</p> : (
        <ul className="flex flex-col gap-1">
          {list.map((r) => {
            const m = statusMeta(r.status)
            return (
              <li key={r.id}>
                <button type="button" onClick={() => void navigate({ to: '/redemptions/$redemptionId', params: { redemptionId: String(r.id) } })}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', m.tone)}><m.icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{r.storeName || 'Store'}</span>
                    <span className="block text-[11px] text-muted-foreground">{formatRelative(r.createdAt)} · {m.label}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatInrFull(r.amount)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

export default RedemptionDetailPage
