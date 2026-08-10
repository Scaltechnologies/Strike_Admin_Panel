import { useState, useEffect } from 'react'
import { X, Tag, Percent, DollarSign, Calendar, Users, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateCoupon, useUpdateCoupon } from '../hooks/useCoupons'
import { VendorCombobox } from './VendorCombobox'
import type { CouponResponse, CreateCouponRequest, DiscountType } from '../types/coupon.types'

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

function toLocalDatetimeValue(iso: string): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

function toIsoFromLocal(local: string): string {
  if (!local) return ''
  return new Date(local).toISOString().slice(0, 19)
}

interface CouponFormProps {
  coupon?: CouponResponse | null
  onClose: () => void
}

const EMPTY_FORM = {
  code: '',
  title: '',
  description: '',
  discountType: 'PERCENTAGE' as DiscountType,
  discountValue: '',
  maxDiscountAmount: '',
  minPurchaseAmount: '',
  maxUses: '',
  vendorId: '',
  validFrom: '',
  validUntil: '',
}

export function CouponForm({ coupon, onClose }: CouponFormProps) {
  const isEdit = !!coupon

  const [form, setForm] = useState(() => {
    if (coupon) {
      return {
        code: coupon.code,
        title: coupon.title,
        description: coupon.description ?? '',
        discountType: (coupon.discountType as DiscountType) ?? 'PERCENTAGE',
        discountValue: String(coupon.discountValue),
        maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '',
        minPurchaseAmount: coupon.minPurchaseAmount ? String(coupon.minPurchaseAmount) : '',
        maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
        vendorId: coupon.vendorId ? String(coupon.vendorId) : '',
        validFrom: toLocalDatetimeValue(coupon.validFrom),
        validUntil: toLocalDatetimeValue(coupon.validUntil),
      }
    }
    return EMPTY_FORM
  })

  const { mutate: create, isPending: creating } = useCreateCoupon()
  const { mutate: update, isPending: updating } = useUpdateCoupon()
  const isPending = creating || updating

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function buildRequest(): CreateCouponRequest {
    return {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      ...(form.description.trim() && { description: form.description.trim() }),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      ...(form.maxDiscountAmount && { maxDiscountAmount: Number(form.maxDiscountAmount) }),
      ...(form.minPurchaseAmount && { minPurchaseAmount: Number(form.minPurchaseAmount) }),
      ...(form.maxUses && { maxUses: Number(form.maxUses) }),
      ...(form.vendorId && { vendorId: Number(form.vendorId) }),
      validFrom: toIsoFromLocal(form.validFrom),
      validUntil: toIsoFromLocal(form.validUntil),
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req = buildRequest()
    if (isEdit && coupon) {
      update({ id: coupon.id, req }, { onSuccess: onClose })
    } else {
      create(req, { onSuccess: onClose })
    }
  }

  const canSubmit =
    form.code.trim() &&
    form.title.trim() &&
    form.discountValue &&
    form.validFrom &&
    form.validUntil &&
    !isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-semibold text-foreground">{isEdit ? 'Edit Coupon' : 'Create Coupon'}</p>
            <p className="text-xs text-muted-foreground">
              {isEdit ? `Editing ${coupon?.code}` : 'Create a new discount coupon'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="space-y-4">
            {/* Code */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Tag className="h-3 w-3" />
                Coupon Code <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setField('code', e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                disabled={isPending}
                className={cn(INPUT_CLS, 'font-mono uppercase')}
              />
              <p className="mt-1 text-xs text-muted-foreground">Uppercase letters, digits, _ or - only</p>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g. 20% off on first order"
                disabled={isPending}
                className={INPUT_CLS}
              />
            </div>

            {/* Discount type + value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Percent className="h-3 w-3" />
                  Discount Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) => setField('discountType', e.target.value)}
                  disabled={isPending}
                  className={INPUT_CLS}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Value <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setField('discountValue', e.target.value)}
                  placeholder={form.discountType === 'PERCENTAGE' ? '20' : '50'}
                  disabled={isPending}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
            </div>

            {/* Max discount / Min purchase */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Max Discount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.maxDiscountAmount}
                  onChange={(e) => setField('maxDiscountAmount', e.target.value)}
                  placeholder="100"
                  disabled={isPending}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Min Purchase (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minPurchaseAmount}
                  onChange={(e) => setField('minPurchaseAmount', e.target.value)}
                  placeholder="200"
                  disabled={isPending}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
            </div>

            {/* Max uses / Vendor ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Max Uses
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setField('maxUses', e.target.value)}
                  placeholder="Unlimited"
                  disabled={isPending}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Store className="h-3 w-3" />
                  Vendor
                </label>
                <VendorCombobox
                  value={form.vendorId ? Number(form.vendorId) : undefined}
                  onChange={(vendorId) => setField('vendorId', vendorId != null ? String(vendorId) : '')}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Valid From <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.validFrom}
                  onChange={(e) => setField('validFrom', e.target.value)}
                  disabled={isPending}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Valid Until <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.validUntil}
                  onChange={(e) => setField('validUntil', e.target.value)}
                  disabled={isPending}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Optional description…"
                disabled={isPending}
                className={cn(INPUT_CLS, 'resize-none')}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </div>
  )
}
