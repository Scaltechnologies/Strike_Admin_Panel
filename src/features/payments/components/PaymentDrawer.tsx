import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, User, Store, Calendar, Hash, CreditCard, RotateCcw, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'
import { useRefundPayment } from '../hooks/usePayments'
import type { PaymentResponse, PaymentStatus } from '../types/payment.types'

function statusStyle(s: PaymentStatus) {
  if (s === 'COMPLETED') return 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
  if (s === 'FAILED') return 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400'
  if (s === 'REFUNDED') return 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
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
  onClose: () => void
}

export function PaymentDrawer({ payment, onClose }: PaymentDrawerProps) {
  return (
    <AnimatePresence>
      {payment && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <DrawerContent key={payment.id} payment={payment} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerContent({ payment, onClose }: { payment: PaymentResponse; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const { mutate: refund, isPending } = useRefundPayment()

  const close = useCallback(() => onClose(), [onClose])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [close])

  const canRefund = payment.status === 'COMPLETED'

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
        {payment.refundAmount && (
          <p className="mt-0.5 text-xs text-violet-600 dark:text-violet-400">
            Refunded: ₹{Number(payment.refundAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <Row icon={User} label="User" value={`User #${payment.userId}`} />
        <Row icon={Store} label="Vendor" value={`Vendor #${payment.vendorId}`} />
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
          <Row icon={Calendar} label="Refunded At" value={formatDateTime(payment.refundedAt)} />
        )}
        {payment.refundReason && (
          <Row icon={MessageSquare} label="Refund Reason" value={
            <span className="inline-block rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-700 dark:bg-violet-400/10 dark:text-violet-400">
              {payment.refundReason}
            </span>
          } />
        )}
      </div>

      {canRefund && (
        <div className="border-t border-border p-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Refund Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund…"
              disabled={isPending}
              className="block w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>
          <button
            onClick={() => refund({ id: payment.id, reason })}
            disabled={isPending || !reason.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            {isPending ? 'Processing…' : 'Process Refund'}
          </button>
        </div>
      )}
    </motion.aside>
  )
}
