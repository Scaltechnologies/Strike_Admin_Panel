import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertTriangle, ArrowLeft, Ban, Check, CheckCircle2, Clock, Copy, CreditCard, ExternalLink, HandCoins, History, Loader2, MapPin,
  Phone, QrCode, Receipt, RefreshCw, RotateCcw, ShieldCheck, Store, UserRound, Wallet, XCircle, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { usePaymentDetails, useSyncRefund, type PaymentDetails } from './api/payment-insights.api'
import { RefundDialog } from './components/RefundDialog'
import { REFUND_METHOD, STATUS_META, isOnline, money, payMethodText, reasonLabel, refundState } from './utils/payment-meta'
import { Avatar } from './components/Avatar'

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" title={`Copy ${label}`}
      onClick={() => void navigator.clipboard.writeText(value).then(() => { setCopied(true); toast.success(`${label} copied`); window.setTimeout(() => setCopied(false), 1400) })}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-2 py-1 font-mono text-[11px] text-foreground/80 transition-colors hover:bg-muted/70">
      <span className="truncate">{value}</span>
      {copied ? <Check className="h-3 w-3 shrink-0 text-emerald-500" /> : <Copy className="h-3 w-3 shrink-0" />}
    </button>
  )
}

function Section({ icon: Icon, title, right, children, className }: { icon: LucideIcon; title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md', className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600"><Icon className="h-3.5 w-3.5" /></span>{title}</h2>
        {right}
      </header>
      {children}
    </motion.section>
  )
}

function Line({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right tabular-nums', strong ? 'font-bold text-foreground' : 'font-medium text-foreground/90', tone)}>{value}</span>
    </div>
  )
}

type Ev = { at: string; icon: LucideIcon; tone: string; title: string; sub?: string }

function timeline(d: PaymentDetails): Ev[] {
  const p = d.payment
  const ev: Ev[] = [{ at: p.createdAt, icon: Receipt, tone: 'bg-sky-500', title: isOnline(p) ? 'Checkout paid online' : 'Paid at the store', sub: `${money(p.amountPaid)} for ${p.cardName}` }]
  for (const a of d.attempts ?? []) {
    ev.push({ at: a.createdAt, icon: a.status === 'SUCCESS' || a.status === 'CAPTURED' ? CheckCircle2 : a.status === 'FAILED' ? XCircle : Clock, tone: a.status === 'FAILED' ? 'bg-red-500' : 'bg-slate-400',
      title: `Payment try #${a.attemptNumber} — ${a.status.toLowerCase()}`, sub: a.failureReason ?? a.gatewayPaymentId ?? undefined })
  }
  for (const e of d.events ?? []) {
    ev.push({ at: e.createdAt, icon: QrCode, tone: 'bg-amber-500', title: e.action.replace(/_/g, ' ').toLowerCase(), sub: [e.actorType?.toLowerCase(), e.previousStatus && e.newStatus ? `${e.previousStatus} → ${e.newStatus}` : null].filter(Boolean).join(' · ') || undefined })
  }
  for (const r of d.redemptions ?? []) {
    ev.push({ at: r.createdAt, icon: HandCoins, tone: r.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-400', title: `Used at the store — ${money(r.totalAmount)}`, sub: r.status.toLowerCase() })
  }
  for (const a of d.adminActions ?? []) {
    const failed = a.outcome === 'FAILED'
    ev.push({ at: a.createdAt, icon: a.action.includes('REFUND') || a.action.includes('REVERSED') ? RotateCcw : ShieldCheck, tone: failed ? 'bg-red-500' : 'bg-violet-500',
      title: `${a.action.replace(/_/g, ' ').toLowerCase()}${failed ? ' (didn’t go through)' : ''}`, sub: [a.actorName ?? a.actorEmail, a.details].filter(Boolean).join(' · ') || undefined })
  }
  return ev.filter((e) => e.at).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function PaymentDetailPage({ paymentId }: { paymentId: number }) {
  const details = usePaymentDetails(paymentId)
  const sync = useSyncRefund()
  const [refunding, setRefunding] = useState(false)
  const d = details.data
  const events = useMemo(() => (d ? timeline(d) : []), [d])

  if (details.isLoading) {
    return <div className="flex flex-col gap-4 p-6">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />)}</div>
  }
  if (!d) {
    return (
      <div className="flex flex-col items-center gap-3 p-16 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">This payment couldn&apos;t be loaded.</p>
        <Link to="/payments" search={{}} className="text-sm font-medium text-primary hover:underline">Back to payments</Link>
      </div>
    )
  }

  const p = d.payment
  const s = STATUS_META[p.status] ?? STATUS_META.PENDING
  const rs = refundState(p)
  const online = isOnline(p)
  const g = d.gateway
  const paidWith = payMethodText(g)
  const card = d.card
  const credit = Number(card?.originalWalletAmount ?? p.walletAmount ?? 0)
  const left = Number(card?.walletBalance ?? 0)
  const used = Math.max(0, credit - left)
  const usedPct = credit > 0 ? Math.min(100, (used / credit) * 100) : 0

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <Link to="/payments" search={{}} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All payments</Link>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-60" aria-hidden><span /><span /><span /></div>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg', online ? 'bg-gradient-to-br from-sky-400 to-indigo-600' : 'bg-gradient-to-br from-amber-400 to-orange-600')}>
              {online ? <CreditCard className="h-7 w-7" /> : <QrCode className="h-7 w-7" />}
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Payment #{p.id} · {online ? 'Online' : 'At the store'}</p>
              <p className={cn('mt-1 text-4xl font-bold tabular-nums', p.status === 'REFUNDED' && 'text-white/50 line-through decoration-fuchsia-400/70')}>{money(p.amountPaid)}</p>
              <p className="mt-1 text-sm text-white/70">{p.cardName} · <span title={formatDateTime(p.createdAt)}>{formatDateTime(p.createdAt)}</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold')}><span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />{s.label}</span>
                {rs && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">{rs.label}</span>}
                {p.disputeStatus === 'OPEN' && <span className="rounded-full bg-red-500/30 px-2.5 py-1 text-xs font-medium">Disputed</span>}
                {paidWith && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{paidWith}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.refundMethod === 'RAZORPAY' && p.refundStatus === 'PENDING' && (
              <button type="button" onClick={() => sync.mutate(p.id)} disabled={sync.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-60">
                <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} /> Check refund
              </button>
            )}
            {p.status === 'COMPLETED' && (
              <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setRefunding(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-fuchsia-600/30">
                <RotateCcw className="h-4 w-4" /> {p.refundStatus === 'FAILED' ? 'Try the refund again' : 'Refund'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.section>

      {p.status === 'COMPLETED' && p.refundStatus === 'FAILED' && p.refundError && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><b>The last refund didn&apos;t go through:</b> {p.refundError}</span>
        </div>
      )}

      {p.status === 'REFUNDED' && (
        <Section icon={RotateCcw} title="Refund" className="border-violet-500/30 bg-gradient-to-br from-violet-500/[0.05] to-fuchsia-500/[0.04]"
          right={rs && <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', rs.tone)}>{rs.label}</span>}>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Line label="Given back" value={p.refundAmount != null ? money(p.refundAmount) : 'Not recorded'} strong />
              <Line label="How" value={REFUND_METHOD[(p.refundMethod ?? 'LEGACY') as keyof typeof REFUND_METHOD].short} />
              <Line label="Why" value={reasonLabel(p.refundReason)} />
              <Line label="Card" value={p.cardCancelled === false ? 'Kept by the customer' : 'Cancelled'} />
            </div>
            <div>
              <Line label="When" value={p.refundedAt ? formatDateTime(p.refundedAt) : '—'} />
              <Line label="By" value={p.refundedByName ?? (p.refundedBy ? `Admin #${p.refundedBy}` : '—')} />
              {p.gatewayRefundId && <div className="flex items-center justify-between gap-3 py-1.5 text-sm"><span className="text-muted-foreground">Razorpay refund</span><CopyChip value={p.gatewayRefundId} label="Refund id" /></div>}
              {p.refundStatus && <Line label="Refund status" value={p.refundStatus.toLowerCase()} />}
            </div>
          </div>
          {p.refundNote && <p className="mt-3 rounded-xl bg-background/60 px-3 py-2 text-sm italic text-muted-foreground">“{p.refundNote}”</p>}
          {!p.refundMethod && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">This was marked refunded before Strike could send money back automatically — check the customer actually got their money.</p>}
        </Section>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Section icon={Receipt} title="The money" className="xl:col-span-1">
          <Line label="Card price" value={money(p.cardPrice)} />
          {Number(p.discountApplied ?? 0) > 0 && <Line label={`Discount${p.couponCode ? ` (${p.couponCode})` : ''}`} value={`−${money(p.discountApplied)}`} tone="text-emerald-600" />}
          <div className="my-1 border-t border-dashed border-border" />
          <Line label="Customer paid" value={money(p.amountPaid)} strong />
          <Line label="Credit on the card" value={money(p.walletAmount)} />
          {d.commission && <Line label={`Strike commission (${Number(d.commission.commissionRate)}%)`} value={<>{money(d.commission.commissionAmount)} <span className="text-xs text-muted-foreground">· {d.commission.status.toLowerCase()}</span></>} />}
          {g?.fee != null && <Line label="Razorpay fee (incl. tax)" value={money(g.fee)} />}
        </Section>

        <Section icon={Wallet} title="How the card was used" className="xl:col-span-2"
          right={card && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-foreground/80">{card.status.toLowerCase()}</span>}>
          {!card ? <p className="text-sm text-muted-foreground">No card is linked to this payment.</p> : (
            <>
              <div className="flex h-3.5 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="h-full bg-[#f47230]" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${100 - usedPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="ml-0.5 h-full bg-[#257de0]" />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f47230]" />Spent <b>{money(used)}</b>{d.redemptionTotals ? ` in ${d.redemptionTotals.count} visit${Number(d.redemptionTotals.count) === 1 ? '' : 's'}` : ''}</span>
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#257de0]" />Left <b>{money(left)}</b> of {money(credit)}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Line label="Bought" value={card.purchasedAt ? formatDateTime(card.purchasedAt) : '—'} />
                <Line label="Expires" value={card.expiresAt ? formatDateTime(card.expiresAt) : '—'} />
              </div>
              {(d.redemptions?.length ?? 0) > 0 && (
                <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                  {d.redemptions!.map((r) => (
                    <li key={r.id}>
                      <Link to="/redemptions/$redemptionId" params={{ redemptionId: String(r.id) }} className="flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                        <span className="inline-flex items-center gap-2"><HandCoins className="h-4 w-4 text-muted-foreground" />{formatRelative(r.createdAt)}</span>
                        <span className="inline-flex items-center gap-2"><span className="text-xs capitalize text-muted-foreground">{r.status.toLowerCase()}</span><b className="tabular-nums">{money(r.totalAmount)}</b><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Section icon={UserRound} title="Customer">
          <div className="flex items-center gap-3">
            <Avatar src={p.customerPic} name={p.customerName} className="h-12 w-12 rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{p.customerName || `Customer #${p.userId}`}</p>
              {p.customerMobile && <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{p.customerMobile}</p>}
              {p.customerEmail && <p className="truncate text-xs text-muted-foreground">{p.customerEmail}</p>}
            </div>
          </div>
          <Link to="/users/$userId" params={{ userId: String(p.userId) }} search={{ tab: undefined }} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Open customer <ExternalLink className="h-3 w-3" /></Link>
        </Section>

        <Section icon={Store} title="Store">
          <div className="flex items-center gap-3">
            <Avatar src={p.storeLogo} name={p.storeName ?? p.vendorName} tone="from-amber-400 to-orange-600" className="h-12 w-12 rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{p.storeName || p.vendorName || `Store #${p.storeId}`}</p>
              {p.storeAddress && <p className="line-clamp-2 inline-flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{p.storeAddress}</p>}
              {(p.storePhone || p.vendorMobile) && <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{p.storePhone || p.vendorMobile}</p>}
            </div>
          </div>
          <Link to="/vendors/$vendorId" params={{ vendorId: String(p.vendorId) }} search={{ tab: undefined }} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Open vendor <ExternalLink className="h-3 w-3" /></Link>
        </Section>

        <Section icon={online ? CreditCard : QrCode} title={online ? 'Razorpay' : 'At the store'}>
          {online ? (
            <div className="space-y-2 text-sm">
              {p.gatewayTransactionId ? <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Payment id</span><CopyChip value={p.gatewayTransactionId} label="Payment id" /></div>
                : <p className="text-muted-foreground">No Razorpay payment id stored.</p>}
              {g?.orderId && <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Order id</span><CopyChip value={g.orderId} label="Order id" /></div>}
              {g ? (
                <>
                  <Line label="Razorpay status" value={g.status ?? '—'} />
                  <Line label="Paid with" value={paidWith ?? '—'} />
                  <Line label="Refunded on Razorpay" value={money(g.amountRefunded ?? 0)} />
                </>
              ) : p.gatewayTransactionId && <p className="text-xs text-muted-foreground">Razorpay details aren&apos;t available right now.</p>}
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <Line label="Confirmed by" value={p.confirmationMethod ? (p.confirmationMethod === 'QR' ? 'Scanning the QR' : 'Typing the code') : '—'} />
              <p className="pt-2 text-xs text-muted-foreground">The customer paid the store directly. Refunds are handed back by the store.</p>
            </div>
          )}
        </Section>
      </div>

      <Section icon={History} title="What happened" right={<span className="text-xs text-muted-foreground">{events.length} events</span>}>
        <ol className="relative">
          {events.map((e, i) => (
            <motion.li key={`${e.at}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }} className="relative flex gap-3 pb-4 last:pb-0">
              {i < events.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-24px)] w-px bg-border" aria-hidden />}
              <span className={cn('relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white', e.tone)}><e.icon className="h-3.5 w-3.5" /></span>
              <div className="min-w-0">
                <p className="text-sm font-medium first-letter:uppercase text-foreground">{e.title}</p>
                {e.sub && <p className="break-words text-xs text-muted-foreground">{e.sub}</p>}
                <p className="text-[11px] text-muted-foreground" title={formatDateTime(e.at)}>{formatRelative(e.at)}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </Section>

      {p.status !== 'COMPLETED' && p.status !== 'REFUNDED' && (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {p.status === 'FAILED' ? <Ban className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
          {p.status === 'FAILED' ? 'This payment failed — no money was taken, so there is nothing to refund.' : 'This payment hasn’t finished yet.'}
        </div>
      )}

      <RefundDialog payment={refunding ? p : null} onClose={() => setRefunding(false)} />
    </div>
  )
}

export default PaymentDetailPage
