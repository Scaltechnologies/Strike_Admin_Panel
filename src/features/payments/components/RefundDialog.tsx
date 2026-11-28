import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, Ban, Banknote, CheckCircle2, CircleSlash, CreditCard, Handshake, Loader2, RotateCcw, ShieldCheck, Store, type LucideIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import {
  apiMessage, useRefund, useRefundPreview, type PaymentRow, type RefundMethod, type RefundReason,
} from '../api/payment-insights.api'
import { REASONS, REFUND_METHOD, money, payMethodText } from '../utils/payment-meta'

const METHOD_ICON: Record<RefundMethod, LucideIcon> = { RAZORPAY: CreditCard, STORE_CASH: Store, OUTSIDE: Handshake, NONE: CircleSlash }

type AmountMode = 'full' | 'unused' | 'custom'

interface Props {
  payment: Pick<PaymentRow, 'id' | 'cardName' | 'amountPaid' | 'customerName' | 'storeName' | 'paymentMethod'> | null
  onClose: () => void
}

/** The refund flow: what's been used, how the money goes back, how much, why — then one clear confirm. */
export function RefundDialog({ payment, onClose }: Props) {
  return (
    <Dialog open={payment != null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {payment && <RefundBody key={payment.id} payment={payment} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function RefundBody({ payment, onClose }: { payment: NonNullable<Props['payment']>; onClose: () => void }) {
  const preview = useRefundPreview(payment.id)
  const refund = useRefund()
  const p = preview.data
  const [method, setMethod] = useState<RefundMethod | null>(null)
  const [amountMode, setAmountMode] = useState<AmountMode | null>(null)
  const [custom, setCustom] = useState('')
  const [cancelCard, setCancelCard] = useState(true)
  const [reason, setReason] = useState<RefundReason>('CUSTOMER_CANCELLED')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | { status: string | null; refundId: string | null; amount: number | null; method: RefundMethod | null; cancelled: boolean | null }>(null)

  const methods = useMemo<RefundMethod[]>(() => {
    if (!p) return []
    if (!p.online) return ['STORE_CASH', 'OUTSIDE', 'NONE']
    return p.canUseRazorpay ? ['RAZORPAY', 'OUTSIDE', 'NONE'] : ['OUTSIDE', 'NONE']
  }, [p])
  const m: RefundMethod = method ?? p?.defaultMethod ?? 'OUTSIDE'
  const paid = Number(p?.amountPaid ?? payment.amountPaid)
  const suggested = Number(p?.suggestedAmount ?? paid)
  const gatewayLeft = p?.gateway?.amount != null ? Number(p.gateway.amount) - Number(p.gateway.amountRefunded ?? 0) : null
  const maxAmount = m === 'RAZORPAY' && gatewayLeft != null ? Math.min(paid, gatewayLeft) : paid
  const mode: AmountMode = amountMode ?? (suggested < paid ? 'unused' : 'full')
  const amount = m === 'NONE' ? 0 : mode === 'full' ? maxAmount : mode === 'unused' ? Math.min(suggested, maxAmount) : Number(custom)
  const amountOk = m === 'NONE' || (Number.isFinite(amount) && amount > 0 && amount <= maxAmount + 1e-9)
  const mustCancel = m === 'NONE'
  const willCancel = mustCancel || cancelCard
  const credit = Number(p?.walletAmount ?? 0)
  const used = Number(p?.walletUsed ?? 0)
  const usedPct = credit > 0 ? Math.min(100, (used / credit) * 100) : 0
  const paidWith = payMethodText(p?.gateway)

  const submit = () => {
    setError(null)
    refund.mutate(
      { id: payment.id, body: { reasonCode: reason, note: note.trim() || undefined, refundMethod: m, cancelCard: willCancel, amount: m === 'NONE' ? undefined : Math.round(amount * 100) / 100 } },
      {
        onSuccess: (r) => setDone({ status: r.refundStatus, refundId: r.gatewayRefundId, amount: r.refundAmount, method: r.refundMethod, cancelled: r.cardCancelled }),
        onError: (e) => setError(apiMessage(e, "Couldn't refund this payment.")),
      },
    )
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
        <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </motion.span>
        <div>
          <h3 className="text-xl font-bold text-foreground">{done.method === 'NONE' ? 'Card cancelled' : `${money(done.amount ?? 0)} refunded`}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {done.method === 'RAZORPAY' && (done.status === 'PROCESSED'
              ? 'Razorpay has processed the refund. The customer’s bank usually shows it within 5–7 working days.'
              : 'Razorpay accepted the refund. It usually reaches the customer in 5–7 working days — you can check its progress on the payment page.')}
            {done.method === 'STORE_CASH' && 'We’ve told the store to hand the cash back to the customer.'}
            {done.method === 'OUTSIDE' && 'Recorded as paid back outside Strike.'}
            {done.method === 'NONE' && 'The card no longer works. No money was given back.'}
            {done.cancelled ? ' The card is cancelled.' : ''} The customer has been notified.
          </p>
        </div>
        {done.refundId && <code className="rounded-lg bg-muted px-3 py-1.5 text-xs">Razorpay refund id · {done.refundId}</code>}
        <button type="button" onClick={onClose} className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90">Done</button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-violet-600" /> Refund payment #{payment.id}</DialogTitle>
        <DialogDescription>
          {payment.cardName} · {money(paid)} paid{payment.customerName ? ` by ${payment.customerName}` : ''}{payment.storeName ? ` at ${payment.storeName}` : ''}
        </DialogDescription>
      </DialogHeader>

      {preview.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : preview.isError || !p ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">{apiMessage(preview.error, "Couldn't load this payment.")}</div>
      ) : (
        <>
          {/* Card usage */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">How much of the card was used</span>
              <span className="text-muted-foreground">{p.cardStatus ? `Card is ${p.cardStatus.toLowerCase()}` : 'Card not found'}</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <motion.div initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="h-full bg-[#f47230]" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${100 - usedPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="ml-0.5 h-full bg-[#257de0]" />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f47230]" />Spent {money(used)}</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#257de0]" />Left {money(p.walletBalance ?? 0)} of {money(credit)} credit</span>
            </div>
            {paidWith && <p className="mt-2 text-xs text-muted-foreground">Paid with <b className="text-foreground">{paidWith}</b>{gatewayLeft != null && Number(p.gateway?.amountRefunded ?? 0) > 0 ? ` · ${money(Number(p.gateway?.amountRefunded))} already refunded on Razorpay` : ''}</p>}
          </div>

          {p.warnings.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {p.warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />{w}
                </li>
              ))}
            </ul>
          )}

          {/* Method */}
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">How does the money go back?</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {methods.map((x) => {
                const Icon = METHOD_ICON[x]
                const on = m === x
                return (
                  <motion.button key={x} type="button" whileHover={{ y: -2 }} onClick={() => setMethod(x)} aria-pressed={on}
                    className={cn('flex flex-col gap-1.5 rounded-xl border-2 p-3 text-left transition-colors', on ? 'border-violet-500 bg-violet-500/[0.06]' : 'border-border hover:border-violet-400/50')}>
                    <Icon className={cn('h-4 w-4', on ? 'text-violet-600' : 'text-muted-foreground')} />
                    <span className="text-[13px] font-semibold leading-tight text-foreground">{REFUND_METHOD[x].label}</span>
                    <span className="text-[11px] leading-snug text-muted-foreground">{REFUND_METHOD[x].explain}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <AnimatePresence initial={false}>
            {m !== 'NONE' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="mb-2 text-sm font-semibold text-foreground">How much?</p>
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    ['full', `Everything · ${money(maxAmount)}`],
                    ...(suggested < paid ? [['unused', `Unspent share · ${money(Math.min(suggested, maxAmount))}`] as const] : []),
                    ['custom', 'Other amount'],
                  ] as const).map(([k, label]) => (
                    <button key={k} type="button" onClick={() => setAmountMode(k)}
                      className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', mode === k ? 'border-violet-500 bg-violet-500 text-white' : 'border-border hover:bg-muted')}>
                      {label}
                    </button>
                  ))}
                  {mode === 'custom' && (
                    <span className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                      <input autoFocus inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00"
                        className={cn('w-32 rounded-lg border bg-background py-1.5 pl-6 pr-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring', amountOk || !custom ? 'border-border' : 'border-red-500')} />
                    </span>
                  )}
                </div>
                {mode === 'unused' && <p className="mt-1.5 text-[11px] text-muted-foreground">The part of what they paid that matches the credit still left on the card.</p>}
                {!amountOk && custom && <p className="mt-1.5 text-[11px] text-red-600">Enter between ₹0.01 and {money(maxAmount)}.</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancel card */}
          <label className={cn('flex items-start gap-3 rounded-xl border border-border px-3.5 py-3', mustCancel ? 'opacity-70' : 'cursor-pointer hover:bg-muted/40')}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-violet-600" checked={willCancel} disabled={mustCancel} onChange={(e) => setCancelCard(e.target.checked)} />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground"><Ban className="h-3.5 w-3.5" /> Cancel the card</span>
              <span className="block text-xs text-muted-foreground">The remaining {money(p.walletBalance ?? 0)} can’t be spent any more, and the store’s commission on this sale is cancelled. Untick only for a goodwill refund where they keep the card.</span>
            </span>
          </label>

          {/* Reason */}
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Why?</p>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button key={r.value} type="button" title={r.hint} onClick={() => setReason(r.value)}
                  className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', reason === r.value ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea rows={2} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={reason === 'OTHER' ? 'What happened? (needed for “Something else”)' : 'Note for the records (optional)'}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.06] p-4 text-sm">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-violet-600" /> What will happen</p>
            <ul className="space-y-1 text-[13px] text-foreground/85">
              {m === 'RAZORPAY' && <li>• {money(amount || 0)} is sent back through Razorpay{paidWith ? ` to ${paidWith}` : ''}.</li>}
              {m === 'STORE_CASH' && <li>• The store is told to hand {money(amount || 0)} back to the customer.</li>}
              {m === 'OUTSIDE' && <li>• {money(amount || 0)} is recorded as paid back outside Strike (no money moves).</li>}
              {m === 'NONE' && <li>• No money goes back.</li>}
              {willCancel ? <li>• The card is cancelled and the store’s commission on it is cancelled.</li> : <li>• The customer keeps the card and its balance.</li>}
              <li>• The customer gets a notification, and this is saved in the audit log.</li>
            </ul>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-3 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}
            </motion.div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Not now</button>
            <button type="button" onClick={submit}
              disabled={refund.isPending || !amountOk || (reason === 'OTHER' && !note.trim()) || p.status !== 'COMPLETED'}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-opacity hover:opacity-95 disabled:opacity-50">
              {refund.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : m === 'NONE' ? <Ban className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
              {m === 'NONE' ? 'Cancel the card' : `Refund ${money(amount || 0)}`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
