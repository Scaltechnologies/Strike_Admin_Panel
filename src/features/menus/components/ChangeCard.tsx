import { forwardRef, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Clock, Crown, Drumstick, Leaf, Loader2, PencilLine, UserCog, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelative, formatDateTime } from '@/utils/helpers/date'
import { avatarGradient, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { useApproveChange, useRejectChange, type ItemFields, type MenuChange } from '../api/menu-admin.api'
import {
  ACTION_META, FIELD_LABELS, QUICK_REASONS, STATUS_META, changedFields, formatField, formatPrice, itemMovedOn, priceDelta, usableImage,
} from '../utils/menu-meta'
import { ItemFormDialog, type CategoryOption } from './ItemFormDialog'

/** One menu change a store asked for, with everything needed to decide on it. */
export const ChangeCard = forwardRef<HTMLDivElement, {
  change: MenuChange
  categoryNames: Record<string, string>
  categoryOptions: CategoryOption[]
  selected?: boolean
  onSelect?: (id: number, on: boolean) => void
  showStore?: boolean
}>(function ChangeCard({ change: c, categoryNames, categoryOptions, selected, onSelect, showStore = true }, ref) {
  const meta = ACTION_META[c.action]
  const status = STATUS_META[c.status]
  const pending = c.status === 'PENDING'
  const approve = useApproveChange()
  const reject = useRejectChange()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [editing, setEditing] = useState(false)
  const busy = approve.isPending || reject.isPending
  const moved = pending && itemMovedOn(c)
  const Icon = meta.icon

  // What the item will look like once approved (for "edit & approve").
  const proposed: ItemFields = { ...(c.current ?? c.before ?? {}), ...c.changes }

  return (
    <motion.article ref={ref} layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/[0.04]',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border')}>
      <span className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', meta.tone)} aria-hidden />

      <header className="flex flex-wrap items-start gap-3 px-5 pb-3 pt-4">
        {onSelect && pending && (
          <input type="checkbox" checked={!!selected} onChange={(e) => onSelect(c.id, e.target.checked)} aria-label={`Select change ${c.id}`}
            className="mt-2.5 h-4 w-4 cursor-pointer rounded accent-[#e01a00]" />
        )}
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', meta.tone)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{c.requestedByName ?? 'The store'}</span>{' '}
            <span className="text-muted-foreground">{meta.verb}</span>{' '}
            <span className="font-semibold">{c.action === 'CREATE' ? c.changes.name ?? c.itemName : c.itemName}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className={cn('flex items-center gap-1 rounded-full px-1.5 py-px font-semibold',
              c.requestedByType === 'MANAGER' ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300')}>
              {c.requestedByType === 'MANAGER' ? <UserCog className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
              {c.requestedByType === 'MANAGER' ? 'Store manager' : 'Store owner'}
            </span>
            {showStore && (
              <Link to="/menus/$storeId" params={{ storeId: String(c.storeId) }} className="flex items-center gap-1.5 font-medium text-foreground/80 hover:text-primary hover:underline">
                <span className={cn('flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br text-[8px] font-bold text-white', avatarGradient(c.storeId))}>
                  {vendorInitials(c.storeName)}
                </span>
                {c.storeName ?? `Store #${c.storeId}`}
              </Link>
            )}
            {c.createdAt && (
              <span className="flex items-center gap-1" title={formatDateTime(c.createdAt)}>
                <Clock className="h-3 w-3" /> {pending ? `waiting ${formatRelative(c.createdAt).replace(' ago', '')}` : `asked ${formatRelative(c.createdAt)}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.chip)}>{meta.label}</span>
          {!pending && <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', status.chip)}><status.icon className="h-3 w-3" />{status.label}</span>}
        </div>
      </header>

      <div className="px-5 pb-4">
        <ChangeBody change={c} categoryNames={categoryNames} />
        {moved && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            Heads up: this item changed after the store asked. Approving applies only the fields shown above.
          </p>
        )}
        {!pending && (c.reviewNote || c.reviewedByName) && (
          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            {c.reviewedByName && <span className="font-medium text-foreground">{c.reviewedByName}</span>}
            {c.reviewedAt && <span> · {formatRelative(c.reviewedAt)}</span>}
            {c.reviewNote && <span className="mt-0.5 block italic">“{c.reviewNote}”</span>}
          </p>
        )}
      </div>

      {pending && (
        <footer className="border-t border-border bg-muted/20 px-5 py-3">
          <AnimatePresence initial={false} mode="wait">
            {rejecting ? (
              <motion.div key="reject" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-foreground">Why not? The store sees this.</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((r) => (
                    <button key={r} type="button" onClick={() => setReason(r)}
                      className={cn('rounded-full border px-2.5 py-1 text-[11px] transition-colors', reason === r ? 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300' : 'border-border text-muted-foreground hover:bg-muted')}>
                      {r}
                    </button>
                  ))}
                </div>
                <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Or write your own reason…" autoFocus
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setRejecting(false)} className="h-8 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="button" disabled={!reason.trim() || busy} onClick={() => reject.mutate({ id: c.id, note: reason.trim() })}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50">
                    {reject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Reject
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center justify-end gap-2">
                <button type="button" disabled={busy} onClick={() => setRejecting(true)}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-400/10">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                {(c.action === 'CREATE' || c.action === 'UPDATE') && (
                  <button type="button" disabled={busy} onClick={() => setEditing(true)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                    <PencilLine className="h-3.5 w-3.5" /> Adjust &amp; approve
                  </button>
                )}
                <motion.button type="button" disabled={busy} whileTap={{ scale: 0.96 }} onClick={() => approve.mutate({ id: c.id })}
                  className="btn-shine flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-xs font-semibold text-white shadow-md shadow-emerald-500/25 disabled:opacity-60">
                  {approve.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {c.action === 'DELETE' ? 'Approve removal' : 'Approve'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>
      )}

      <ItemFormDialog open={editing} onOpenChange={setEditing} note
        title={`Adjust before approving`} description="Change anything that's wrong. It goes live as you save it here."
        initial={proposed} categories={categoryOptions} submitLabel="Approve with changes" submitting={approve.isPending}
        onSubmit={(fields, note) => approve.mutate({ id: c.id, changes: fields, note }, { onSuccess: () => setEditing(false) })} />
    </motion.article>
  )
})

function ChangeBody({ change: c, categoryNames }: { change: MenuChange; categoryNames: Record<string, string> }) {
  if (c.action === 'CREATE') return <ItemPreview item={c.changes} categoryNames={categoryNames} tone="new" />
  if (c.action === 'DELETE') return <ItemPreview item={c.current ?? c.before} categoryNames={categoryNames} tone="remove" />
  if (c.action === 'IMAGE') {
    const before = usableImage(c.before?.imageUrl)
    const after = usableImage(c.changes?.imageUrl)
    return (
      <div className="flex items-center gap-4">
        <Photo url={before} label="Now" dim />
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        <Photo url={after} label="New photo" />
      </div>
    )
  }
  const diffs = changedFields(c)
  if (diffs.length === 0) return <p className="text-xs text-muted-foreground">Nothing different from the current item.</p>
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {diffs.map((d, i) => {
        const delta = d.field === 'price' ? priceDelta(d.before, d.after) : null
        return (
          <motion.div key={d.field} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
            className="grid grid-cols-[110px_1fr] items-center gap-3 border-b border-border px-3 py-2.5 text-sm last:border-0 sm:grid-cols-[130px_1fr]">
            <span className="text-xs font-medium text-muted-foreground">{FIELD_LABELS[d.field]}</span>
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="max-w-full truncate rounded-md bg-rose-50 px-2 py-0.5 text-rose-700 line-through decoration-rose-400/70 dark:bg-rose-400/10 dark:text-rose-300">
                {formatField(d.field, d.before, categoryNames)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-full truncate rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                {formatField(d.field, d.after, categoryNames)}
              </span>
              {delta != null && delta !== 0 && (
                <span className={cn('rounded-full px-1.5 py-px text-[10px] font-bold', delta > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
                  Math.abs(delta) >= 30 && 'animate-pulse')}>
                  {delta > 0 ? '+' : ''}{delta}%
                </span>
              )}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function ItemPreview({ item, categoryNames, tone }: { item: ItemFields; categoryNames: Record<string, string>; tone: 'new' | 'remove' }) {
  const img = usableImage(item.imageUrl)
  const veg = item.itemType !== 'NON_VEG'
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3',
      tone === 'remove' ? 'border-rose-200 bg-rose-50/50 dark:border-rose-400/20 dark:bg-rose-400/5' : 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-400/20 dark:bg-emerald-400/5')}>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
<SafeImage url={img} fallback={veg ? <Leaf className="h-6 w-6 text-emerald-500" /> : <Drumstick className="h-6 w-6 text-rose-500" />} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('flex items-center gap-1.5 font-semibold text-foreground', tone === 'remove' && 'line-through decoration-rose-400')}>
            <VegMark veg={veg} /> {item.name ?? 'Unnamed item'}
          </p>
          <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatPrice(item.price)}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatField('categoryId', item.categoryId, categoryNames)}
          {item.availabilityStatus === 'OUT_OF_STOCK' ? ' · out of stock' : ''}
        </p>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
        {tone === 'remove' && <p className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">Will be taken off the menu</p>}
      </div>
    </div>
  )
}

export function VegMark({ veg }: { veg: boolean }) {
  return (
    <span className={cn('inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]', veg ? 'border-emerald-600' : 'border-rose-600')} aria-label={veg ? 'Veg' : 'Non-veg'}>
      <span className={cn('h-1.5 w-1.5 rounded-full', veg ? 'bg-emerald-600' : 'bg-rose-600')} />
    </span>
  )
}

function Photo({ url, label, dim }: { url: string | null; label: string; dim?: boolean }) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <div className={cn('flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted', dim && 'opacity-60')}>
<SafeImage url={url} fallback={<span className="text-[11px] text-muted-foreground">No photo</span>} />
      </div>
      <figcaption className="text-[11px] text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

/** A photo that falls back to an icon when the link is missing or broken. */
function SafeImage({ url, fallback }: { url: string | null; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false)
  return url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <>{fallback}</>
}
