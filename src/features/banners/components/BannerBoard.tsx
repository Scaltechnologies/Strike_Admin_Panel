import { useMemo, useState } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import { BellRing, CalendarRange, Copy, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useDeleteBanner, useDuplicateBanner, useToggleBanner } from '../api/banner-studio.api'
import type { BannerResponse } from '../types/banner.types'
import { APP_RATIO, STATE_META, addDays, bannerState, dayLabel, daysBetween, indiaToday, runText, whenText } from '../utils/banner-meta'

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={on ? 'Switch off' : 'Switch on'} disabled={disabled} onClick={(e) => { e.stopPropagation(); onChange(!on) }}
      className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50', on ? 'bg-emerald-500' : 'bg-muted-foreground/25')}>
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow', on ? 'right-0.5' : 'left-0.5')} />
    </button>
  )
}

function Row({ b, position, draggable, onEdit, onAsk }: {
  b: BannerResponse; position?: number; draggable: boolean; onEdit: (b: BannerResponse) => void
  onAsk: (a: { kind: 'delete' | 'push' | 'on'; b: BannerResponse }) => void
}) {
  const controls = useDragControls()
  const toggle = useToggleBanner()
  const dup = useDuplicateBanner()
  const s = bannerState(b)
  const meta = STATE_META[s]
  const when = whenText(b)
  const body = (
    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 pr-3 shadow-sm transition-shadow hover:shadow-md">
      {draggable ? (
        <button type="button" onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder"
          className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      ) : <span className="w-1" />}
      {position != null && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">{position}</span>}
      <button type="button" onClick={() => onEdit(b)} className="relative shrink-0 overflow-hidden rounded-xl bg-muted" style={{ width: 154, aspectRatio: APP_RATIO }}>
        <img src={b.imageUrl} alt="" className={cn('h-full w-full object-cover transition-transform duration-500 group-hover:scale-105', s !== 'LIVE' && 'opacity-70 saturate-50')} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{b.title}</p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarRange className="h-3 w-3" />{runText(b)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.tone)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot, s === 'LIVE' && 'animate-pulse')} />{meta.label}
          </span>
          {when && <span className="text-[11px] text-muted-foreground">{when}</span>}
          {b.vendorId && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Vendor banner</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" title="Edit" onClick={() => onEdit(b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
          <button type="button" title="Make a copy" onClick={() => dup.mutate(b.id)} disabled={dup.isPending} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
          {b.isActive && !b.vendorId && (
            <button type="button" title="Send a push to every customer" onClick={() => onAsk({ kind: 'push', b })} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><BellRing className="h-3.5 w-3.5" /></button>
          )}
          <button type="button" title="Delete" onClick={() => onAsk({ kind: 'delete', b })} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        <Switch on={b.isActive} disabled={toggle.isPending} onChange={(on) => (on ? onAsk({ kind: 'on', b }) : toggle.mutate({ id: b.id, on: false }))} />
      </div>
    </div>
  )
  if (!draggable) return <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{body}</motion.li>
  return (
    <Reorder.Item value={b} dragListener={false} dragControls={controls} as="li" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', zIndex: 10 }} className="relative">
      {body}
    </Reorder.Item>
  )
}

/** Banners in carousel order: the ones showing or coming up can be dragged; ended/off ones below. */
export function BannerBoard({ banners, onEdit, onReorder, saving }: {
  banners: BannerResponse[]; onEdit: (b: BannerResponse) => void; onReorder: (ids: number[]) => void; saving: boolean
}) {
  const toggle = useToggleBanner()
  const del = useDeleteBanner()
  const [ask, setAsk] = useState<null | { kind: 'delete' | 'push' | 'on'; b: BannerResponse }>(null)
  const [pushOnSwitch, setPushOnSwitch] = useState(false)
  const upcoming = useMemo(() => banners.filter((b) => ['LIVE', 'SCHEDULED'].includes(bannerState(b))), [banners])
  const rest = useMemo(() => banners.filter((b) => !['LIVE', 'SCHEDULED'].includes(bannerState(b))), [banners])
  const [draft, setDraft] = useState<BannerResponse[] | null>(null)
  const order = draft ?? upcoming
  const dirty = draft != null && draft.map((b) => b.id).join() !== upcoming.map((b) => b.id).join()
  const positions = new Map(order.filter((b) => bannerState(b) === 'LIVE').map((b, i) => [b.id, i + 1] as const))

  const confirm = () => {
    if (!ask) return
    if (ask.kind === 'delete') del.mutate(ask.b.id, { onSettled: () => setAsk(null) })
    if (ask.kind === 'push') toggle.mutate({ id: ask.b.id, on: true, push: true }, { onSettled: () => setAsk(null) })
    if (ask.kind === 'on') toggle.mutate({ id: ask.b.id, on: true, push: !ask.b.vendorId && pushOnSwitch }, { onSettled: () => { setAsk(null); setPushOnSwitch(false) } })
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">In the carousel <span className="font-normal text-muted-foreground">· drag to change the order</span></h2>
          <AnimatePresence>
            {dirty && (
              <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-2">
                <button type="button" onClick={() => setDraft(null)} className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted">Undo</button>
                <button type="button" disabled={saving} onClick={() => { onReorder([...order.map((b) => b.id), ...rest.map((b) => b.id)]); setDraft(null) }}
                  className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60">Save order</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {order.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">Nothing is showing or coming up. Add a banner or switch one on.</p>
        ) : (
          <Reorder.Group axis="y" values={order} onReorder={setDraft} as="ul" className="flex flex-col gap-2">
            {order.map((b) => {
              return <Row key={b.id} b={b} position={positions.get(b.id)} draggable onEdit={onEdit} onAsk={setAsk} />
            })}
          </Reorder.Group>
        )}
      </section>

      {rest.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Not showing <span className="font-normal text-muted-foreground">· ended or switched off</span></h2>
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>{rest.map((b) => <Row key={b.id} b={b} draggable={false} onEdit={onEdit} onAsk={setAsk} />)}</AnimatePresence>
          </ul>
        </section>
      )}

      <ConfirmationDialog
        open={ask != null}
        title={ask?.kind === 'delete' ? `Delete “${ask.b.title}”?` : ask?.kind === 'push' ? 'Send a push to every customer?' : `Switch on “${ask?.b.title ?? ''}”?`}
        description={ask?.kind === 'delete' ? 'It disappears from the app and can’t be brought back.'
          : ask?.kind === 'push' ? `Every customer gets a notification: “${ask.b.title}${ask.b.description ? ` — ${ask.b.description}` : ''}”.`
            : 'It shows in the app on the days it’s set for.'}
        confirmLabel={ask?.kind === 'delete' ? 'Delete' : ask?.kind === 'push' ? 'Send push' : 'Switch on'}
        variant={ask?.kind === 'delete' ? 'destructive' : 'default'}
        isLoading={del.isPending || toggle.isPending}
        onConfirm={confirm}
        onCancel={() => { setAsk(null); setPushOnSwitch(false) }}
      >
        {ask?.kind === 'on' && !ask.b.vendorId && (
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#e01a00]" checked={pushOnSwitch} onChange={(e) => setPushOnSwitch(e.target.checked)} />
            Also send a push to every customer
          </label>
        )}
      </ConfirmationDialog>
    </div>
  )
}

/** Next 5 weeks: one bar per banner for the days it shows. */
export function BannerSchedule({ banners }: { banners: BannerResponse[] }) {
  const today = indiaToday()
  const DAYS = 35
  const end = addDays(today, DAYS - 1)
  const [hover, setHover] = useState<number | null>(null)
  const rows = banners.filter((b) => b.isActive && (!b.validUntil || b.validUntil >= today))
  const pct = (day: string) => (Math.min(DAYS, Math.max(0, daysBetween(today, day))) / DAYS) * 100
  const weeks = Array.from({ length: 5 }, (_, i) => addDays(today, i * 7))
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><CalendarRange className="h-4 w-4 text-primary" /> Next 5 weeks</h2>
        <span className="text-xs text-muted-foreground">{dayLabel(today)} – {dayLabel(end, true)}</span>
      </div>
      {rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No switched-on banners in the next 5 weeks.</p> : (
        <div className="relative">
          <div className="relative mb-2 ml-[calc(30%+0.5rem)] h-4 text-[10px] text-muted-foreground">
            {weeks.map((w) => <span key={w} className="absolute -translate-x-1/2" style={{ left: `${pct(w)}%` }}>{dayLabel(w)}</span>)}
          </div>
          <ul className="space-y-1.5">
            {rows.map((b, i) => {
              const from = b.validFrom && b.validFrom > today ? b.validFrom : today
              const to = b.validUntil && b.validUntil < end ? addDays(b.validUntil, 1) : addDays(end, 1)
              const s = bannerState(b)
              return (
                <li key={b.id} className="flex items-center gap-2" onMouseEnter={() => setHover(b.id)} onMouseLeave={() => setHover(null)}>
                  <span className="w-[30%] truncate pr-2 text-xs text-foreground">{b.title}</span>
                  <div className="relative h-6 flex-1 rounded-md border-l-2 border-[#e01a00] bg-muted/50">
                    {weeks.slice(1).map((w) => <span key={w} className="absolute top-0 h-full w-px bg-border" style={{ left: `${pct(w)}%` }} />)}
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 20 }}
                      className={cn('absolute top-1 h-4 origin-left rounded', hover === b.id && 'ring-2 ring-offset-1 ring-offset-card')}
                      style={{ left: `${pct(from)}%`, width: `${Math.max(1.5, pct(to) - pct(from))}%`, background: STATE_META[s].bar }}
                      title={`${b.title}: ${runText(b)}`} />
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATE_META.LIVE.bar }} />Showing</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATE_META.SCHEDULED.bar }} />Starts later</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-0.5 bg-[#e01a00]" />Today</span>
          </div>
        </div>
      )}
    </section>
  )
}
