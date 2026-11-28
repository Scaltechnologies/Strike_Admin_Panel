import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Calculator, Dices, Globe2, Loader2, Percent, Store, Ticket } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toLocalInputValue, toServerDateTime } from '@/utils/helpers/date'
import { apiMessage, useSaveCoupon, type CouponRow } from '../api/coupon-insights.api'
import type { CreateCouponRequest, DiscountType } from '../types/coupon.types'
import { discountBig, discountText, money, randomCode, rulesText } from '../utils/coupon-meta'
import { VendorCombobox } from './VendorCombobox'

const INPUT = 'block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring'

const localNow = () => toLocalInputValue(new Date().toISOString())
const localIn = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(23, 59, 0, 0); return toLocalInputValue(d.toISOString()) }
const endOfMonth = () => { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59); return toLocalInputValue(e.toISOString()) }

type Form = {
  code: string; title: string; description: string; discountType: DiscountType; discountValue: string; maxDiscountAmount: string
  minPurchaseAmount: string; maxUses: string; vendorId: number | undefined; validFrom: string; validUntil: string
}

function initial(c?: CouponRow | null): Form {
  if (c) {
    return {
      code: c.code, title: c.title, description: c.description ?? '', discountType: (c.discountType as DiscountType) ?? 'PERCENTAGE',
      discountValue: String(c.discountValue), maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : '',
      minPurchaseAmount: c.minPurchaseAmount ? String(c.minPurchaseAmount) : '', maxUses: c.maxUses ? String(c.maxUses) : '',
      vendorId: c.vendorId ?? undefined, validFrom: toLocalInputValue(c.validFrom), validUntil: toLocalInputValue(c.validUntil),
    }
  }
  return { code: randomCode(), title: '', description: '', discountType: 'PERCENTAGE', discountValue: '10', maxDiscountAmount: '', minPurchaseAmount: '', maxUses: '', vendorId: undefined, validFrom: localNow(), validUntil: localIn(30) }
}

export function CouponEditor({ open, coupon, onClose }: { open: boolean; coupon?: CouponRow | null; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-4xl">
        {open && <EditorBody key={coupon?.id ?? 'new'} coupon={coupon} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function EditorBody({ coupon, onClose }: { coupon?: CouponRow | null; onClose: () => void }) {
  const [f, setF] = useState<Form>(() => initial(coupon))
  const [scope, setScope] = useState<'all' | 'one'>(coupon?.vendorId ? 'one' : 'all')
  const [error, setError] = useState<string | null>(null)
  const [price, setPrice] = useState('1000')
  const save = useSaveCoupon()
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }))

  const value = Number(f.discountValue)
  const cap = f.maxDiscountAmount ? Number(f.maxDiscountAmount) : null
  const min = f.minPurchaseAmount ? Number(f.minPurchaseAmount) : null
  const problems: string[] = []
  if (!/^[A-Z0-9_-]{3,50}$/.test(f.code)) problems.push('Code: 3–50 letters, numbers, - or _')
  if (!f.title.trim()) problems.push('Give it a name')
  if (!(value > 0)) problems.push('Discount must be more than 0')
  if (f.discountType === 'PERCENTAGE' && value > 100) problems.push('A percentage can’t be over 100')
  if (!f.validFrom || !f.validUntil || f.validUntil <= f.validFrom) problems.push('The end must be after the start')
  if (scope === 'one' && !f.vendorId) problems.push('Pick the store')

  const p = Math.max(0, Number(price) || 0)
  const eligible = min == null || p >= min
  const off = !eligible ? 0 : f.discountType === 'PERCENTAGE' ? Math.min(cap ?? Infinity, (p * (value || 0)) / 100) : Math.min(p, value || 0)
  const preview = { discountType: f.discountType, discountValue: value || 0, maxDiscountAmount: cap, minPurchaseAmount: min, maxUses: f.maxUses ? Number(f.maxUses) : null, vendorId: scope === 'one' ? f.vendorId ?? null : null, storeName: null, vendorName: null }

  const submit = () => {
    setError(null)
    const req: CreateCouponRequest = {
      code: f.code.trim().toUpperCase(),
      title: f.title.trim(),
      ...(f.description.trim() && { description: f.description.trim() }),
      discountType: f.discountType,
      discountValue: value,
      ...(f.discountType === 'PERCENTAGE' && cap ? { maxDiscountAmount: cap } : {}),
      ...(min ? { minPurchaseAmount: min } : {}),
      ...(f.maxUses ? { maxUses: Number(f.maxUses) } : {}),
      ...(scope === 'one' && f.vendorId ? { vendorId: f.vendorId } : {}),
      validFrom: toServerDateTime(f.validFrom),
      validUntil: toServerDateTime(f.validUntil),
    }
    save.mutate({ id: coupon?.id, req }, { onSuccess: onClose, onError: (e) => setError(apiMessage(e, "Couldn't save the coupon.")) })
  }

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" />{coupon ? `Edit ${coupon.code}` : 'New coupon'}</DialogTitle>
        <DialogDescription>Customers type the code at checkout. Each customer can use a coupon once.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Code customers type</span>
              <span className="flex gap-1.5">
                <input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} className={cn(INPUT, 'font-mono font-bold tracking-wider')} maxLength={50} />
                <button type="button" onClick={() => set('code', randomCode())} title="Make a random code" className="flex shrink-0 items-center rounded-xl border border-border px-2.5 text-muted-foreground hover:bg-muted"><Dices className="h-4 w-4" /></button>
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Name (shown to customers)</span>
              <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Diwali festival offer" className={INPUT} maxLength={255} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Short description (optional)</span>
            <input value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Save on any card this week" className={INPUT} maxLength={500} />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Discount</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-border p-0.5">
                {(['PERCENTAGE', 'FLAT'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => set('discountType', t)}
                    className={cn('relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors', f.discountType === t ? 'text-white' : 'text-muted-foreground')}>
                    {f.discountType === t && <motion.span layoutId="disc-type" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                    <span className="relative">{t === 'PERCENTAGE' ? '% off' : '₹ off'}</span>
                  </button>
                ))}
              </div>
              <span className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.discountType === 'PERCENTAGE' ? '%' : '₹'}</span>
                <input inputMode="decimal" value={f.discountValue} onChange={(e) => set('discountValue', e.target.value.replace(/[^\d.]/g, ''))} className={cn(INPUT, 'w-28 pl-7 font-semibold')} />
              </span>
              {(f.discountType === 'PERCENTAGE' ? [5, 10, 15, 20, 25] : [25, 50, 100, 200]).map((q) => (
                <button key={q} type="button" onClick={() => set('discountValue', String(q))}
                  className={cn('rounded-full border px-2.5 py-1 text-xs', Number(f.discountValue) === q ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}>
                  {f.discountType === 'PERCENTAGE' ? `${q}%` : `₹${q}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {f.discountType === 'PERCENTAGE' && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Most it can take off (₹)</span>
                <input inputMode="decimal" value={f.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value.replace(/[^\d.]/g, ''))} placeholder="No cap" className={INPUT} />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Card must cost at least (₹)</span>
              <input inputMode="decimal" value={f.minPurchaseAmount} onChange={(e) => set('minPurchaseAmount', e.target.value.replace(/[^\d.]/g, ''))} placeholder="Any amount" className={INPUT} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">How many customers can use it</span>
              <input inputMode="numeric" value={f.maxUses} onChange={(e) => set('maxUses', e.target.value.replace(/\D/g, ''))} placeholder="No limit" className={INPUT} />
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Where it works</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {([['all', Globe2, 'Every store', 'Strike-wide offer'], ['one', Store, 'One store only', 'For a single vendor']] as const).map(([k, Icon, t, sub]) => (
                <button key={k} type="button" onClick={() => setScope(k)}
                  className={cn('flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors', scope === k ? 'border-primary bg-primary/[0.04]' : 'border-border hover:border-primary/40')}>
                  <Icon className={cn('h-4 w-4', scope === k ? 'text-primary' : 'text-muted-foreground')} />
                  <span><span className="block text-sm font-semibold text-foreground">{t}</span><span className="block text-[11px] text-muted-foreground">{sub}</span></span>
                </button>
              ))}
            </div>
            {scope === 'one' && <div className="mt-2"><VendorCombobox value={f.vendorId} onChange={(v) => set('vendorId', v)} /></div>}
          </div>

          <div>
            <span className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              When it works
              {([['7 days', () => localIn(7)], ['30 days', () => localIn(30)], ['End of month', endOfMonth]] as const).map(([l, fn]) => (
                <button key={l} type="button" onClick={() => setF((s) => ({ ...s, validFrom: s.validFrom || localNow(), validUntil: fn() }))}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] font-normal hover:bg-muted">{l}</button>
              ))}
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="datetime-local" value={f.validFrom} onChange={(e) => set('validFrom', e.target.value)} aria-label="Starts" className={INPUT} />
              <input type="datetime-local" value={f.validUntil} min={f.validFrom} onChange={(e) => set('validUntil', e.target.value)} aria-label="Ends" className={INPUT} />
            </div>
          </div>
        </div>

        {/* preview */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What customers see</p>
          <motion.div layout className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#e01a00] via-[#ff4d1c] to-[#ff8a00] p-5 text-white shadow-xl shadow-orange-500/25">
            <div className="flex items-start justify-between">
              <Percent className="h-5 w-5 text-white/70" />
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">{scope === 'one' ? 'This store' : 'All stores'}</span>
            </div>
            <motion.p key={`${f.discountType}-${f.discountValue}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-3 text-4xl font-black tracking-tight">
              {discountBig({ discountType: f.discountType, discountValue: value || 0 })} <span className="text-lg font-bold">off</span>
            </motion.p>
            <p className="mt-1 truncate text-sm font-semibold">{f.title || 'Your offer name'}</p>
            <p className="text-xs text-white/80">{discountText(preview)}</p>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-white/50 px-3 py-2">
              <span className="font-mono text-sm font-bold tracking-widest">{f.code || 'CODE'}</span>
              <span className="text-[10px] uppercase text-white/70">Tap to apply</span>
            </div>
          </motion.div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{rulesText(preview)}</p>

          <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calculator className="h-3.5 w-3.5" /> On a card of
              <span className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">₹</span>
                <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} aria-label="Card price" className="w-20 rounded-lg border border-border bg-background py-0.5 pl-5 pr-1 text-xs font-semibold text-foreground outline-none" />
              </span>
            </p>
            {eligible ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-[11px] text-muted-foreground">They save</p><p className="font-bold text-emerald-600">{money(off)}</p></div>
                <div><p className="text-[11px] text-muted-foreground">They pay</p><p className="font-bold text-foreground">{money(p - off)}</p></div>
              </div>
            ) : <p className="text-xs text-amber-700 dark:text-amber-300">Below the {money(min)} minimum — the code won’t work.</p>}
          </div>
        </div>
      </div>

      {(error || (problems.length > 0 && f.title)) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error ?? problems.join(' · ')}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
        <button type="button" onClick={submit} disabled={problems.length > 0 || save.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50">
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{coupon ? 'Save changes' : 'Create coupon'}
        </button>
      </div>
    </div>
  )
}
