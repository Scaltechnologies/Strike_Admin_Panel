import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Tag, Percent, Calendar, Users, Hash, Building2,
  Edit2, CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'
import { useActivateCoupon, useDeactivateCoupon } from '../hooks/useCoupons'
import { CouponForm } from './CouponForm'
import type { CouponResponse } from '../types/coupon.types'

interface DetailRowProps {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

interface CouponDrawerProps {
  coupon: CouponResponse | null
  onClose: () => void
}

export function CouponDrawer({ coupon, onClose }: CouponDrawerProps) {
  return (
    <AnimatePresence>
      {coupon && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <DrawerContent key={coupon.id} coupon={coupon} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerContent({ coupon, onClose }: { coupon: CouponResponse; onClose: () => void }) {
  const [showEdit, setShowEdit] = useState(false)
  const { mutate: activate, isPending: activating } = useActivateCoupon()
  const { mutate: deactivate, isPending: deactivating } = useDeactivateCoupon()
  const isPending = activating || deactivating

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  const discountLabel =
    coupon.discountType === 'PERCENTAGE'
      ? `${coupon.discountValue}% off`
      : `₹${coupon.discountValue} flat off`

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-foreground">{coupon.code}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                coupon.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400',
              )}
            >
              {coupon.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{coupon.title}</p>
        </div>
        <button
          onClick={close}
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Discount highlight */}
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-foreground">{discountLabel}</span>
          {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount && (
            <span className="text-xs text-muted-foreground">
              (max ₹{coupon.maxDiscountAmount})
            </span>
          )}
        </div>
        {coupon.minPurchaseAmount && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Min purchase: ₹{coupon.minPurchaseAmount}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          <DetailRow
            icon={Hash}
            label="Coupon ID"
            value={<span className="font-mono">#{coupon.id}</span>}
          />

          <DetailRow
            icon={Building2}
            label="Vendor"
            value={
              coupon.vendorId
                ? <span className="font-mono">Vendor #{coupon.vendorId}</span>
                : <span className="text-muted-foreground">All vendors</span>
            }
          />

          <DetailRow
            icon={Users}
            label="Usage"
            value={
              <span>
                {coupon.usedCount} used
                {coupon.maxUses ? ` / ${coupon.maxUses} max` : ' (unlimited)'}
              </span>
            }
          />

          <DetailRow
            icon={Calendar}
            label="Valid From"
            value={formatDateTime(coupon.validFrom)}
          />

          <DetailRow
            icon={Calendar}
            label="Valid Until"
            value={formatDateTime(coupon.validUntil)}
          />

          {coupon.description && (
            <DetailRow
              icon={Tag}
              label="Description"
              value={coupon.description}
            />
          )}

          <DetailRow
            icon={Calendar}
            label="Created"
            value={formatDateTime(coupon.createdAt)}
          />
        </div>

        {/* Usage progress */}
        {coupon.maxUses && (
          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Usage Progress</p>
              <p className="text-xs font-medium text-foreground">
                {Math.round((coupon.usedCount / coupon.maxUses) * 100)}%
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {coupon.usedCount} / {coupon.maxUses} uses
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-border px-5 py-4">
        <button
          onClick={() => setShowEdit(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          onClick={() => coupon.isActive ? deactivate(coupon.id) : activate(coupon.id)}
          disabled={isPending}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60',
            coupon.isActive
              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400/20'
              : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20',
          )}
        >
          {coupon.isActive ? (
            <><XCircle className="h-3.5 w-3.5" />{isPending ? 'Deactivating…' : 'Deactivate'}</>
          ) : (
            <><CheckCircle2 className="h-3.5 w-3.5" />{isPending ? 'Activating…' : 'Activate'}</>
          )}
        </button>
      </div>

      {showEdit && (
        <CouponForm coupon={coupon} onClose={() => setShowEdit(false)} />
      )}
    </motion.aside>
  )
}
