import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, User, Store, Calendar, Hash, CreditCard, RotateCcw, MessageSquare, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'
import { useReversePayment } from '../hooks/usePayments'
import { resolveCustomerName } from '@/features/redemptions/hooks/useRedemptions'
import { resolveVendorName } from '@/features/withdrawals/hooks/useWithdrawals'
import type { PaymentResponse, PaymentStatus, PaymentReversalReason } from '../types/payment.types'
import type { UserDetails } from '@/features/users/types/user.types'
import type { VendorRecord } from '@/features/vendors/types/vendor.types'

function statusStyle(s: PaymentStatus) {
  if (s === 'COMPLETED') return 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
  if (s === 'FAILED') return 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400'
  if (s === 'REFUNDED') return 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
}

const REVERSAL_REASONS: { value: PaymentReversalReason; label: string }[] = [
  { value: 'DUPLICATE_ENTRY', label: 'Duplicate entry' },
  { value: 'CUSTOMER_CANCELLED', label: 'Customer cancelled at purchase' },
  { value: 'OTHER', label: 'Other' },
]

function reasonLabel(reason: string | null): string {
  return REVERSAL_REASONS.find((r) => r.value === reason)?.label ?? reason ?? '—'
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
    </div>
  )
}

interface PaymentDrawerProps {
  payment: PaymentResponse | null
  userMap: Map<number, UserDetails>
  vendorMap: Map<number, VendorRecord>
  onClose: () => void
}

export function PaymentDrawer({ payment, userMap, vendorMap, onClose }: PaymentDrawerProps) {
  return (
    <AnimatePresence>
      {payment && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <DrawerContent
            key={payment.id}
            payment={payment}
            userName={resolveCustomerName(null, payment.userId, userMap)}
            vendorName={resolveVendorName(payment.vendorId, vendorMap)}
            onClose={onClose}
          />
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerContent({ payment, userName, vendorName, onClose }: { payment: PaymentResponse; userName: string; vendorName: string; onClose: () => void }) {
  const [reasonCode, setReasonCode] = useState<PaymentReversalReason>('DUPLICATE_ENTRY')
  const [note, setNote] = useState('')
  const { mutate: reverse, isPending } = useReversePayment()

  const close = useCallback(() => onClose(), [onClose])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [close])

  const canReverse = payment.status === 'COMPLETED'

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
    >
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">Payment #{payment.id}</span>
            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusStyle(payment.status))}>
              {payment.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(payment.createdAt)}</p>
        </div>
        <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <p className="text-xs text-muted-foreground">Amount</p>
        <p className="text-2xl font-bold text-foreground">
          ₹{Number(payment.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        {payment.discountApplied > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Card price ₹{Number(payment.cardPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })} · Discount ₹{Number(payment.discountApplied).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <Row icon={User} label="User" value={userName} />
        <Row icon={Store} label="Vendor" value={vendorName} />
        <Row icon={MessageSquare} label="Card" value={payment.cardName} />
        <Row icon={CreditCard} label="Gateway" value={payment.gateway || '—'} />
        {payment.gatewayTransactionId && (
          <Row icon={Hash} label="Transaction ID" value={<span className="font-mono text-xs">{payment.gatewayTransactionId}</span>} />
        )}
        {payment.couponCode && (
          <Row icon={Hash} label="Coupon Code" value={<span className="font-mono text-xs">{payment.couponCode}</span>} />
        )}
        <Row icon={Calendar} label="Created At" value={formatDateTime(payment.createdAt)} />
        {payment.refundedAt && (
          <Row icon={Calendar} label="Reversed At" value={formatDateTime(payment.refundedAt)} />
        )}
        {payment.refundReason && (
          <Row icon={MessageSquare} label="Reversal Reason" value={
            <span className="inline-block rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-700 dark:bg-violet-400/10 dark:text-violet-400">
              {reasonLabel(payment.refundReason)}
            </span>
          } />
        )}
        {payment.refundNote && (
          <Row icon={MessageSquare} label="Reversal Note" value={payment.refundNote} />
        )}
      </div>

      {canReverse && (
        <div className="border-t border-border p-5 space-y-3">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Reversing cancels the customer&apos;s subscription (blocks further wallet spend) and voids the vendor&apos;s commission for it, if not already settled.</span>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Reason</label>
            <div className="flex flex-col gap-1.5">
              {REVERSAL_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="reversal-reason"
                    value={r.value}
                    checked={reasonCode === r.value}
                    onChange={() => setReasonCode(r.value)}
                    disabled={isPending}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Note (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any extra detail for this reversal…"
              disabled={isPending}
              className="block w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>
          <button
            onClick={() => reverse({ id: payment.id, reasonCode, note: note.trim() || undefined })}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            {isPending ? 'Reversing…' : 'Reverse Payment'}
          </button>
        </div>
      )}
    </motion.aside>
  )
}
