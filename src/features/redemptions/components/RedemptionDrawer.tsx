import { useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Store as StoreIcon, User, Hash, Calendar, MessageSquare, ShoppingBag, Wallet } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDateTime } from '@/utils/helpers/date'
import { resolveCustomerName } from '../hooks/useRedemptions'
import type { RedemptionRecord, RedemptionStatus } from '../types/redemption.types'
import type { StoreRecord } from '@/features/stores/types/store.types'
import type { UserDetails } from '@/features/users/types/user.types'

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

function statusMeta(status: RedemptionStatus): { variant: string; label: string } {
  switch (status) {
    case 'PENDING': return { variant: 'pending', label: 'Pending' }
    case 'COMPLETED': return { variant: 'completed', label: 'Completed' }
    case 'REJECTED': return { variant: 'rejected', label: 'Rejected' }
    case 'FAILED': return { variant: 'failed', label: 'Failed' }
    case 'REVERSED': return { variant: 'reversed', label: 'Reversed' }
    default: return { variant: 'default', label: status }
  }
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

interface RedemptionDrawerProps {
  redemption: RedemptionRecord | null
  store: StoreRecord | undefined
  userMap: Map<number, UserDetails>
  onClose: () => void
}

export function RedemptionDrawer({ redemption, store, userMap, onClose }: RedemptionDrawerProps) {
  return (
    <AnimatePresence>
      {redemption && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <DrawerContent key={redemption.id} redemption={redemption} store={store} userMap={userMap} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerContent({ redemption, store, userMap, onClose }: {
  redemption: RedemptionRecord
  store: StoreRecord | undefined
  userMap: Map<number, UserDetails>
  onClose: () => void
}) {
  const close = useCallback(() => onClose(), [onClose])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [close])

  const meta = statusMeta(redemption.status)

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">Redemption #{redemption.id}</span>
            <StatusBadge status={meta.variant} label={meta.label} size="sm" dot />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {store?.name ?? `Store #${redemption.storeId}`}
          </p>
        </div>
        <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Amount highlight */}
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <p className="text-xs text-muted-foreground">Redemption Amount</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(redemption.totalAmount)}</p>
        {redemption.remainingBalance != null && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Wallet balance after: {formatCurrency(redemption.remainingBalance)}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <Row
          icon={StoreIcon}
          label="Store"
          value={store ? `${store.name}${store.address ? ` — ${store.address}` : ''}` : `Store #${redemption.storeId}`}
        />
        <Row icon={User} label="Customer" value={resolveCustomerName(redemption.customerName, redemption.userId, userMap)} />
        <Row icon={Hash} label="Subscription" value={<span className="font-mono">#{redemption.subscriptionId}</span>} />
        <Row icon={Wallet} label="Initiated By" value={<span className="uppercase">{redemption.initiatedBy ?? '—'}</span>} />
        <Row icon={Calendar} label="Requested At" value={formatDateTime(redemption.createdAt)} />
        {redemption.approvedAt && <Row icon={Calendar} label="Approved At" value={formatDateTime(redemption.approvedAt)} />}
        {redemption.rejectedAt && <Row icon={Calendar} label="Rejected At" value={formatDateTime(redemption.rejectedAt)} />}
        {redemption.failureReason && (
          <Row icon={MessageSquare} label="Reason" value={
            <span className="inline-block rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-400/10 dark:text-red-400">
              {redemption.failureReason}
            </span>
          } />
        )}

        {redemption.items.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5" />
              Items Redeemed
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-2.5 py-1.5 text-left font-medium text-muted-foreground">Item</th>
                    <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {redemption.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-1.5 text-foreground">{item.menuItemName}</td>
                      <td className="px-2.5 py-1.5 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="px-2.5 py-1.5 text-right font-medium text-foreground">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
