import { useState, type FormEvent } from 'react'
import { Drumstick, Leaf, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ItemFields } from '../api/menu-admin.api'

export interface CategoryOption {
  id: number
  name: string
}

interface ItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initial: ItemFields
  categories: CategoryOption[]
  submitLabel: string
  submitting?: boolean
  onSubmit: (fields: ItemFields, note?: string) => void
  /** Show a note box (sent to the store with an approval). */
  note?: boolean
}

/** Add or edit a menu item; also used to adjust a store's request before approving it. */
export function ItemFormDialog(props: ItemFormProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description && <DialogDescription>{props.description}</DialogDescription>}
        </DialogHeader>
        {/* The content unmounts when closed, so each opening starts from `initial`. */}
        <ItemForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

function ItemForm({ onOpenChange, initial, categories, submitLabel, submitting, onSubmit, note }: ItemFormProps) {
  const [name, setName] = useState(initial.name ?? '')
  const [price, setPrice] = useState(initial.price != null ? String(initial.price) : '')
  const [itemType, setItemType] = useState<'VEG' | 'NON_VEG'>(initial.itemType === 'NON_VEG' ? 'NON_VEG' : 'VEG')
  const [categoryId, setCategoryId] = useState<string>(initial.categoryId != null ? String(initial.categoryId) : '')
  const [desc, setDesc] = useState(initial.description ?? '')
  const [inStock, setInStock] = useState(initial.availabilityStatus !== 'OUT_OF_STOCK')
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? '')
  const [noteText, setNoteText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const p = Number(price)
    if (!name.trim()) return setError('Give the item a name')
    if (!Number.isFinite(p) || p <= 0) return setError('Enter a price above ₹0')
    if (!categoryId) return setError('Pick a category')
    setError(null)
    onSubmit({
      name: name.trim(),
      price: Math.round(p * 100) / 100,
      itemType,
      categoryId: Number(categoryId),
      description: desc.trim() || null,
      availabilityStatus: inStock ? 'AVAILABLE' : 'OUT_OF_STOCK',
      imageUrl: imageUrl.trim() || null,
    }, noteText.trim() || undefined)
  }

  const field = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const known = categories.some((c) => String(c.id) === categoryId)

  return (
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Masala Dosa" autoFocus />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Price (₹)</span>
              <input className={field} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              <select className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Choose…</option>
                {!known && categoryId && <option value={categoryId}>Category #{categoryId}</option>}
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-border p-0.5" role="radiogroup" aria-label="Veg or non-veg">
              {([['VEG', 'Veg', Leaf, 'bg-emerald-600'], ['NON_VEG', 'Non-veg', Drumstick, 'bg-rose-600']] as const).map(([v, label, Icon, on]) => (
                <button key={v} type="button" role="radio" aria-checked={itemType === v} onClick={() => setItemType(v)}
                  className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    itemType === v ? cn(on, 'text-white shadow-sm') : 'text-muted-foreground hover:text-foreground')}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>{inStock ? 'In stock' : 'Out of stock'}</span>
              <button type="button" role="switch" aria-checked={inStock} aria-label="In stock" onClick={() => setInStock((s) => !s)}
                className={cn('relative h-5 w-9 rounded-full transition-colors', inStock ? 'bg-emerald-500' : 'bg-muted-foreground/30')}>
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', inStock ? 'left-[18px]' : 'left-0.5')} />
              </button>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Description <span className="font-normal">(optional)</span></span>
            <textarea className={cn(field, 'h-20 resize-none py-2')} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Photo link <span className="font-normal">(optional)</span></span>
            <input className={field} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={500} placeholder="https://…" />
          </label>
          {note && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Note to the store <span className="font-normal">(optional)</span></span>
              <input className={field} value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={300} placeholder="e.g. Rounded the price to ₹99" />
            </label>
          )}
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="h-9 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={submitting}
              className="btn-shine flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 px-4 text-sm font-semibold text-white shadow-md shadow-orange-500/25 disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
            </button>
          </DialogFooter>
        </form>
  )
}
