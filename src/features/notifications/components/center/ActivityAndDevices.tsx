import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, ChevronLeft, ChevronRight, Inbox, Mail, MessageSquare, Search, Smartphone, Trash2, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { useDevices, useFeed, useRemoveDevice, type DeviceRow, type FeedRow } from '../../api/notification-center.api'
import { AUDIENCE_LABEL, CHANNEL_META, STATUS_META, eventMeta, failText } from '../../utils/notify-meta'

const CH_ICON: Record<string, LucideIcon> = { PUSH: BellRing, IN_APP: Inbox, SMS: MessageSquare, EMAIL: Mail }

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v)
  useEffect(() => { const t = window.setTimeout(() => setD(v), ms); return () => window.clearTimeout(t) }, [v, ms])
  return d
}

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
      <span className="tabular-nums text-muted-foreground">Page {page + 1} of {pages}</span>
      <button type="button" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
    </div>
  )
}

function FeedItem({ r, i }: { r: FeedRow; i: number }) {
  const Icon = CH_ICON[r.channel] ?? BellRing
  const ch = CHANNEL_META[r.channel] ?? CHANNEL_META.PUSH
  const st = STATUS_META[r.status] ?? { label: r.status.toLowerCase(), tone: 'bg-muted text-foreground/70' }
  const who = r.recipientId == null ? `All ${r.recipientType ? AUDIENCE_LABEL[r.recipientType].toLowerCase() : ''}s` : r.recipientName || `${r.recipientType ? AUDIENCE_LABEL[r.recipientType] : 'Person'} #${r.recipientId}`
  return (
    <motion.li layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 15) * 0.015 }}
      className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow', ch.tone)}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-semibold text-foreground">{r.title || eventMeta(r.type ?? '').label}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', st.tone)}>{st.label}</span>
          {r.channel === 'IN_APP' && r.recipientId != null && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', r.read ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'bg-muted text-muted-foreground')}>{r.read ? 'Read' : 'Not read yet'}</span>}
        </div>
        {r.message && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.message}</p>}
        {r.status === 'FAILED' && <p className="mt-0.5 text-[11px] text-red-600">{failText(r.errorDetail)}</p>}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {ch.label} · to <b className="font-medium text-foreground/80">{who}</b>{r.type && r.type !== 'ANNOUNCEMENT' ? ` · ${eventMeta(r.type).label}` : r.type === 'ANNOUNCEMENT' ? ' · sent by an admin' : ''} · <span title={formatDateTime(r.createdAt)}>{formatRelative(r.createdAt)}</span>
        </p>
      </div>
    </motion.li>
  )
}

export function ActivityFeed() {
  const [f, setF] = useState({ channel: '', audience: '', status: '', type: '', q: '' })
  const [page, setPage] = useState(0)
  const q = useDebounced(f.q)
  const feed = useFeed({ ...f, q }, page)
  const set = (patch: Partial<typeof f>) => { setF((s) => ({ ...s, ...patch })); setPage(0) }
  const rows = feed.data?.content ?? []
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search title, message or person"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {f.q && <button type="button" onClick={() => set({ q: '' })} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <select value={f.audience} onChange={(e) => set({ audience: e.target.value })} aria-label="Who" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">Everyone</option><option value="USER">Customers</option><option value="VENDOR">Vendors</option><option value="ADMIN">Admins</option>
          </select>
          <select value={f.status} onChange={(e) => set({ status: e.target.value })} aria-label="Result" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">Any result</option><option value="SENT">Delivered</option><option value="FAILED">Didn’t arrive</option><option value="MUTED">Switched off</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[['', 'All channels'], ['PUSH', 'Push'], ['IN_APP', 'In-app'], ['SMS', 'SMS'], ['EMAIL', 'Email']].map(([k, l]) => (
            <button key={k || 'all'} type="button" onClick={() => set({ channel: k })}
              className={cn('relative rounded-full px-3 py-1 text-xs font-medium transition-colors', f.channel === k ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              {f.channel === k && <motion.span layoutId="feed-ch" className="absolute inset-0 rounded-full bg-gradient-to-r from-[#e01a00] to-[#ff6a00]" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              <span className="relative">{l}</span>
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-muted-foreground">{feed.data ? `${feed.data.totalElements.toLocaleString('en-IN')} messages · refreshes every 30 s` : ''}</span>
        </div>
      </div>
      {feed.isLoading ? <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
        : rows.length === 0 ? <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">Nothing matches.</p>
          : <ul className={cn('flex flex-col gap-2 transition-opacity', feed.isFetching && 'opacity-70')}><AnimatePresence initial={false}>{rows.map((r, i) => <FeedItem key={r.key} r={r} i={i} />)}</AnimatePresence></ul>}
      <Pager page={page} pages={feed.data?.totalPages ?? 0} onPage={setPage} />
    </div>
  )
}

export function DevicesList() {
  const [f, setF] = useState({ audience: '', active: 'true', q: '' })
  const [page, setPage] = useState(0)
  const [remove, setRemove] = useState<DeviceRow | null>(null)
  const q = useDebounced(f.q)
  const devices = useDevices({ ...f, q }, page)
  const del = useRemoveDevice()
  const set = (patch: Partial<typeof f>) => { setF((s) => ({ ...s, ...patch })); setPage(0) }
  const rows = devices.data?.content ?? []
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search owner name, mobile or phone model"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={f.audience} onChange={(e) => set({ audience: e.target.value })} aria-label="Whose" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="">Customers and vendors</option><option value="USER">Customers</option><option value="VENDOR">Vendors</option>
        </select>
        <select value={f.active} onChange={(e) => set({ active: e.target.value })} aria-label="State" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="true">Getting pushes</option><option value="false">Stopped</option><option value="">All</option>
        </select>
      </div>
      <p className="px-1 text-xs text-muted-foreground">A phone appears here once someone signs in and allows notifications. Removing one stops pushes to it until they open the app again.</p>
      {devices.isLoading ? <div className="grid gap-2 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
        : rows.length === 0 ? <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">No phones here.</p> : (
          <ul className="grid gap-2 md:grid-cols-2">
            {rows.map((d, i) => (
              <motion.li key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 15) * 0.02 }}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', d.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}><Smartphone className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{d.ownerName || `${AUDIENCE_LABEL[d.recipientType]} #${d.recipientId}`} <span className="text-xs font-normal text-muted-foreground">· {AUDIENCE_LABEL[d.recipientType]}</span></p>
                  <p className="truncate text-xs text-muted-foreground">{[d.platform === 'ANDROID' ? 'Android' : d.platform === 'IOS' ? 'iPhone' : d.platform, d.deviceName, d.appVersion && `app ${d.appVersion}`].filter(Boolean).join(' · ')}</p>
                  <p className="text-[11px] text-muted-foreground">{d.active ? 'Getting pushes' : 'Stopped'} · last seen {d.lastSeenAt ? formatRelative(d.lastSeenAt) : 'never'}</p>
                </div>
                {d.active && (
                  <button type="button" onClick={() => setRemove(d)} title="Stop pushes to this phone" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      <Pager page={page} pages={devices.data?.totalPages ?? 0} onPage={setPage} />
      <ConfirmationDialog open={remove != null} title="Stop pushes to this phone?" description={`${remove?.ownerName ?? 'This person'} won’t get push notifications on this phone until they open the app again. In-app messages still work.`}
        confirmLabel="Stop pushes" variant="destructive" isLoading={del.isPending} onCancel={() => setRemove(null)} onConfirm={() => remove && del.mutate(remove.id, { onSettled: () => setRemove(null) })} />
    </div>
  )
}
