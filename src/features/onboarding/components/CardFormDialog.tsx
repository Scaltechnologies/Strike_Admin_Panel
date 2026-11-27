import { useState, type FormEvent } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { StrikeCardVisual } from '@/features/cards/components/StrikeCardVisual'
import { useSaveCard } from '../onboarding.api'

export interface CardFormInitial {
  id?: number
  name?: string
  description?: string | null
  cardPrice?: number
  walletAmount?: number
  validityInDays?: number | null
  categoryIds?: number[]
}

/** Create (or edit) a card for a store, with a live preview of how it looks. */
export function CardFormDialog({ open, onOpenChange, storeId, storeName, categories, initial }: {
  open: boolean; onOpenChange: (o: boolean) => void; storeId: number; storeName: string
  categories: { id: number; name: string }[]; initial?: CardFormInitial
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <Body storeId={storeId} storeName={storeName} categories={categories} initial={initial} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

const VALIDITY = [30, 90, 180, 365]

function Body({ storeId, storeName, categories, initial, onClose }: {
  storeId: number; storeName: string; categories: { id: number; name: string }[]; initial?: CardFormInitial; onClose: () => void
}) {
  const save = useSaveCard()
  const [name, setName] = useState(initial?.name ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.cardPrice != null ? String(initial.cardPrice) : '')
  const [wallet, setWallet] = useState(initial?.walletAmount != null ? String(initial.walletAmount) : '')
  const [days, setDays] = useState(initial?.validityInDays != null ? String(initial.validityInDays) : '30')
  const [cats, setCats] = useState<number[]>(initial?.categoryIds ?? categories.map((c) => c.id))
  const [error, setError] = useState<string | null>(null)
  const p = Number(price)
  const w = Number(wallet)
  const bonus = p > 0 && w > p ? Math.round(((w - p) / p) * 100) : 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Give the card a name')
    if (!(p > 0)) return setError('Price must be above ₹0')
    if (!(w > 0)) return setError('Wallet amount must be above ₹0')
    if (!(Number(days) >= 1)) return setError('Validity must be at least 1 day')
    if (!cats.length) return setError('Pick at least one menu category the card works on')
    setError(null)
    const card = { storeId, name: name.trim(), description: desc.trim() || undefined, cardPrice: p, walletAmount: w, validityInDays: Math.round(Number(days)), categoryIds: cats }
    save.mutate({ cardId: initial?.id, card }, { onSuccess: onClose })
  }

  const field = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> {initial?.id ? 'Edit card' : 'Create a card'} · {storeName}</DialogTitle>
        <DialogDescription>Customers buy it in the app and spend the wallet at this store on the categories you pick.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">Card name</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gold Dining Card" autoFocus /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">Customer pays (₹)</span>
              <input className={field} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="1000" /></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">Gets to spend (₹)</span>
              <input className={field} value={wallet} onChange={(e) => setWallet(e.target.value)} inputMode="decimal" placeholder="1200" /></label>
          </div>
          {bonus > 0 && <p className="-mt-1 text-xs font-semibold text-emerald-600">+{bonus}% extra value for the customer</p>}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Valid for</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {VALIDITY.map((d) => (
                <button key={d} type="button" onClick={() => setDays(String(d))}
                  className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium', days === String(d) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}>
                  {d === 365 ? '1 year' : `${d} days`}
                </button>
              ))}
              <input className={cn(field, 'h-8 w-20 text-xs')} value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} aria-label="Days" /> <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Works on these menu categories</span>
            {categories.length === 0 ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">This store has no menu yet — upload the menu first.</p> : (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const on = cats.includes(c.id)
                  return (
                    <button key={c.id} type="button" aria-pressed={on} onClick={() => setCats((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                      className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted')}>
                      {c.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">Description (optional)</span>
            <textarea className={cn(field, 'h-16 resize-none py-2')} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} /></label>
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">Preview</p>
          <StrikeCardVisual card={{ id: initial?.id ?? storeId, name: name || 'Card name', vendorName: storeName, walletAmount: w || 0, cardPrice: p || 0, validityInDays: Number(days) || null, isActive: true }} />
          <div className="mt-auto flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={save.isPending || !categories.length}
              className="btn-shine flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 px-5 text-sm font-semibold text-white shadow-md disabled:opacity-50">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {initial?.id ? 'Save card' : 'Create card'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
