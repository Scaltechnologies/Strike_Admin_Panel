import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, Inbox, Loader2, Pencil, Search, Siren, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { useEvents, useSaveWording, useSwitchEvent, useWording, type EventRow } from '../../api/notification-center.api'
import { AUDIENCE_LABEL, EVENTS, eventMeta, type Group } from '../../utils/notify-meta'

const GROUPS: Group[] = ['Customers', 'Vendors', 'Admins', 'Account & security']

function Toggle({ on, label, icon: Icon, onChange, busy }: { on: boolean; label: string; icon: typeof BellRing; onChange: (v: boolean) => void; busy?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={busy} onClick={() => onChange(!on)}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
        on ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border bg-muted/50 text-muted-foreground line-through')}>
      <Icon className="h-3.5 w-3.5" />{label}
      <span className={cn('relative ml-0.5 h-3.5 w-6 rounded-full transition-colors', on ? 'bg-emerald-500' : 'bg-muted-foreground/30')}>
        <motion.span layout className={cn('absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white', on ? 'right-0.5' : 'left-0.5')} />
      </span>
    </button>
  )
}

function WordingEditor({ ev, onClose }: { ev: EventRow; onClose: () => void }) {
  const meta = eventMeta(ev.type)
  const code = meta.template ?? ev.type
  const wording = useWording(code)
  const save = useSaveWording()
  const [draft, setDraft] = useState<Record<'PUSH' | 'IN_APP', { title: string; body: string } | null>>({ PUSH: null, IN_APP: null })
  const value = (ch: 'PUSH' | 'IN_APP') => draft[ch] ?? { title: wording.data?.[ch]?.title ?? '', body: wording.data?.[ch]?.body ?? '' }
  const set = (ch: 'PUSH' | 'IN_APP', patch: Partial<{ title: string; body: string }>) => setDraft((d) => ({ ...d, [ch]: { ...value(ch), ...patch } }))

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Wording · {meta.label}</DialogTitle>
        <DialogDescription>{meta.when}. Leave a box empty to keep the app’s built-in text.</DialogDescription>
      </DialogHeader>
      {meta.vars && meta.vars.length > 0 && (
        <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          You can use: {meta.vars.map((v) => <code key={v} className="mx-0.5 rounded bg-background px-1 py-0.5 text-[11px] text-foreground">{`{{${v}}}`}</code>)}
        </p>
      )}
      {wording.isLoading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : (['PUSH', 'IN_APP'] as const).map((ch) => {
        const v = value(ch)
        const existing = wording.data?.[ch]
        const dirty = draft[ch] != null && (v.title !== (existing?.title ?? '') || v.body !== (existing?.body ?? ''))
        return (
          <div key={ch} className="rounded-2xl border border-border p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {ch === 'PUSH' ? <BellRing className="h-4 w-4 text-[#e01a00]" /> : <Inbox className="h-4 w-4 text-violet-600" />}
              {ch === 'PUSH' ? 'Push notification' : 'In-app message'}
              <span className="text-xs font-normal text-muted-foreground">{existing ? '· custom wording' : '· built-in wording'}</span>
            </p>
            <input value={v.title} maxLength={ch === 'PUSH' ? 65 : 80} onChange={(e) => set(ch, { title: e.target.value })} placeholder="Title"
              className="mb-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <textarea rows={2} value={v.body} maxLength={ch === 'PUSH' ? 240 : 500} onChange={(e) => set(ch, { body: e.target.value })} placeholder="Message"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {dirty && (
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setDraft((d) => ({ ...d, [ch]: null }))} className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted">Undo</button>
                <button type="button" disabled={!v.body.trim() || save.isPending}
                  onClick={() => save.mutate({ code, channel: ch, name: `${meta.label} (${ch === 'PUSH' ? 'Push' : 'In-App'})`, title: v.title.trim(), body: v.body.trim(), existingId: existing?.id },
                    { onSuccess: () => setDraft((d) => ({ ...d, [ch]: null })) })}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  {save.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Save
                </button>
              </div>
            )}
          </div>
        )
      })}
      <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Done</button></div>
    </div>
  )
}

function Row({ ev, i, onEdit }: { ev: EventRow; i: number; onEdit: (ev: EventRow) => void }) {
  const meta = eventMeta(ev.type)
  const sw = useSwitchEvent()
  const readPct = ev.inApp ? Math.round((ev.inAppRead / ev.inApp) * 100) : null
  const off = !ev.pushOn && !ev.inAppOn
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 15) * 0.02 }}
      className={cn('group rounded-2xl border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md', off ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-border')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            {meta.label}
            {meta.urgent && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600"><Siren className="h-3 w-3" />Loud alarm on vendor phones</span>}
            {ev.audiences.map((a) => <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70">{AUDIENCE_LABEL[a]}</span>)}
          </p>
          <p className="text-xs text-muted-foreground">{meta.when} · <code className="text-[10px]">{ev.type}</code></p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Toggle on={ev.pushOn} label="Push" icon={BellRing} busy={sw.isPending} onChange={(v) => sw.mutate({ type: ev.type, push: v })} />
          <Toggle on={ev.inAppOn} label="In-app" icon={Inbox} busy={sw.isPending} onChange={(v) => sw.mutate({ type: ev.type, inApp: v })} />
          <button type="button" onClick={() => onEdit(ev)} title="Change the wording" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span><b className="tabular-nums text-foreground">{ev.pushSent}</b> push delivered</span>
        {ev.pushFailed > 0 && <span><b className="tabular-nums text-red-600">{ev.pushFailed}</b> couldn’t reach</span>}
        <span><b className="tabular-nums text-foreground">{ev.inApp}</b> in-app{readPct != null && ` (${readPct}% read)`}</span>
        {ev.pushMuted + ev.inAppMuted > 0 && <span><b className="tabular-nums text-amber-600">{ev.pushMuted + ev.inAppMuted}</b> held back</span>}
        <span title={ev.lastAt ? formatDateTime(ev.lastAt) : undefined}>last sent {ev.lastAt ? formatRelative(ev.lastAt) : '— not yet'}</span>
      </p>
    </motion.li>
  )
}

export function AutomaticEvents() {
  const [days, setDays] = useState(30)
  const events = useEvents(days)
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<'all' | 'off'>('all')
  const [editing, setEditing] = useState<EventRow | null>(null)
  // Events the app can send but hasn’t sent in this period still get a row (and a switch).
  const all = useMemo(() => {
    // Template names that differ from their event (e.g. VENDOR_WELCOME for VENDOR_REGISTERED) aren't events themselves.
    const aliases = new Set(Object.values(EVENTS).map((m) => m.template).filter((t): t is string => !!t))
    const seen = new Map((events.data ?? []).map((e) => [e.type, e]))
    for (const type of Object.keys(EVENTS)) {
      if (type === 'ANNOUNCEMENT' || seen.has(type)) continue
      seen.set(type, { type, pushSent: 0, pushFailed: 0, pushMuted: 0, inApp: 0, inAppRead: 0, inAppMuted: 0, sms: 0, email: 0, total: 0, lastAt: null, audiences: [], templates: [], pushOn: true, inAppOn: true })
    }
    return [...seen.values()].filter((e) => e.type !== 'OTP' && e.type !== 'ANNOUNCEMENT' && e.type !== 'CUSTOM' && !/OTP/.test(e.type)
      && !aliases.has(e.type)
      && (e.type in EVENTS || e.pushSent + e.pushFailed + e.pushMuted + e.inApp + e.inAppMuted > 0 || !e.pushOn || !e.inAppOn))
  }, [events.data])
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return all.filter((e) => {
      const m = eventMeta(e.type)
      if (only === 'off' && e.pushOn && e.inAppOn) return false
      return !t || m.label.toLowerCase().includes(t) || m.when.toLowerCase().includes(t) || e.type.toLowerCase().includes(t)
    })
  }, [all, q, only])
  const offCount = all.filter((e) => !e.pushOn || !e.inAppOn).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <p className="px-1 text-sm text-muted-foreground">Messages the app sends on its own when something happens. Switch push or in-app off for any of them, or change the wording. Sign-in codes always go out.</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. refund, payout, expiring"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="flex rounded-xl border border-border p-0.5 text-xs">
            {([['all', 'All'], ['off', `Switched off · ${offCount}`]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setOnly(k)} className={cn('rounded-lg px-3 py-1.5 font-medium', only === k ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>{l}</button>
            ))}
          </div>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {events.isLoading ? <div className="flex flex-col gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div> : (
        GROUPS.map((g) => {
          const list = rows.filter((r) => eventMeta(r.type).group === g)
          if (list.length === 0) return null
          return (
            <section key={g}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g} · {list.length}</h3>
              <ul className="flex flex-col gap-2"><AnimatePresence initial={false}>{list.map((e, i) => <Row key={e.type} ev={e} i={i} onEdit={setEditing} />)}</AnimatePresence></ul>
            </section>
          )
        })
      )}

      <Dialog open={editing != null} onOpenChange={(o) => { if (!o) setEditing(null) }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">{editing && <WordingEditor key={editing.type} ev={editing} onClose={() => setEditing(null)} />}</DialogContent>
      </Dialog>
    </div>
  )
}
