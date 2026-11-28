import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BellRing, Check, CheckCircle2, Inbox, Loader2, Search, Send, Smartphone, Sparkles, Store, User, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { apiMessage, useAudiences, usePeople, useSend, type AudienceKind, type PersonHit, type SendResult } from '../../api/notification-center.api'
import { AUDIENCES, QUICK_STARTS } from '../../utils/notify-meta'

const ORDER: AudienceKind[] = ['ALL_CUSTOMERS', 'ACTIVE_CARD', 'NO_CARD', 'EXPIRING_SOON', 'INACTIVE_30', 'STORE_CUSTOMERS', 'ONE_CUSTOMER', 'ALL_VENDORS', 'ONE_VENDOR']

function useDebounced<T>(v: T, ms = 250) {
  const [d, setD] = useState(v)
  useEffect(() => { const t = window.setTimeout(() => setD(v), ms); return () => window.clearTimeout(t) }, [v, ms])
  return d
}

function Picker({ kind, picked, onPick }: { kind: 'USER' | 'VENDOR' | 'STORE'; picked: PersonHit | null; onPick: (p: PersonHit | null) => void }) {
  const [q, setQ] = useState('')
  const search = useDebounced(q)
  const hits = usePeople(kind, search, !picked)
  if (picked) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/[0.05] px-3 py-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{picked.name || `#${picked.id}`}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {kind === 'STORE' ? `${picked.devices} customer${picked.devices === 1 ? '' : 's'}` : `${picked.mobile ?? ''} · ${picked.devices ? `${picked.devices} phone${picked.devices === 1 ? '' : 's'} for push` : 'no phone for push — in-app only'}`}
          </span>
        </span>
        <button type="button" onClick={() => onPick(null)} aria-label="Change" className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
    )
  }
  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={kind === 'STORE' ? 'Search a store by name' : 'Search by name or mobile'}
          className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <ul className="mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-border">
        {(hits.data ?? []).length === 0 ? <li className="px-3 py-3 text-center text-xs text-muted-foreground">{hits.isLoading ? 'Searching…' : 'Nobody found'}</li>
          : hits.data!.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onPick(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
                <span className="truncate">{p.name || `#${p.id}`} <span className="text-xs text-muted-foreground">{p.mobile}</span></span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{kind === 'STORE' ? `${p.devices} customers` : p.devices ? `${p.devices} 📱` : 'no push'}</span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}

function PushPreview({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[26px] bg-gradient-to-b from-indigo-900 via-purple-900 to-zinc-900 p-3 pt-6 shadow-xl">
      <p className="mb-3 text-center text-3xl font-light text-white/90">9:41</p>
      <motion.div layout className="rounded-2xl bg-white/85 p-3 shadow-lg backdrop-blur dark:bg-zinc-800/90">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-[#e01a00] text-[8px] font-black text-white">S</span>STRIKE · now
        </div>
        <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">{title || 'Your title'}</p>
        <p className="line-clamp-3 text-[12px] leading-snug text-zinc-700 dark:text-zinc-300">{message || 'Your message shows here.'}</p>
      </motion.div>
    </div>
  )
}

function InAppPreview({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[26px] border border-border bg-background p-3 shadow-xl">
      <p className="mb-2 px-1 text-sm font-bold text-foreground">Notifications</p>
      <motion.div layout className="flex gap-2.5 rounded-xl bg-primary/[0.06] p-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><BellRing className="h-4 w-4" /></span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">{title || 'Your title'}<span className="h-1.5 w-1.5 rounded-full bg-primary" /></p>
          <p className="line-clamp-4 text-[12px] leading-snug text-muted-foreground">{message || 'Your message shows here.'}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Just now</p>
        </div>
      </motion.div>
      {[0, 1].map((i) => (
        <div key={i} className="mt-2 flex gap-2.5 px-2.5 opacity-50">
          <span className="h-8 w-8 rounded-full bg-muted" /><div className="flex-1 space-y-1 pt-1"><div className="h-2 w-2/3 rounded bg-muted" /><div className="h-2 w-1/2 rounded bg-muted" /></div>
        </div>
      ))}
    </div>
  )
}

export function Composer() {
  const [kind, setKind] = useState<AudienceKind>('ALL_CUSTOMERS')
  const [store, setStore] = useState<PersonHit | null>(null)
  const [person, setPerson] = useState<PersonHit | null>(null)
  const [push, setPush] = useState(true)
  const [inApp, setInApp] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audiences = useAudiences(kind === 'STORE_CUSTOMERS' ? store?.id : undefined)
  const send = useSend()

  const count = audiences.data?.find((a) => a.kind === kind)
  const single = kind === 'ONE_CUSTOMER' || kind === 'ONE_VENDOR'
  const people = single ? (person ? 1 : 0) : count?.people ?? 0
  const withPush = single ? (person && person.devices > 0 ? 1 : 0) : count?.withPush ?? 0
  const recipientWord = AUDIENCES[kind].recipient === 'VENDOR' ? 'vendor' : 'customer'
  const ready = title.trim() && message.trim() && (push || inApp) && (!single || person) && (kind !== 'STORE_CUSTOMERS' || store) && people > 0

  const pick = (k: AudienceKind) => { setKind(k); setPerson(null); setResult(null); setError(null) }
  const doSend = () => {
    setError(null)
    send.mutate(
      { audience: kind, storeId: store?.id, recipientId: person?.id, channels: [...(push ? ['PUSH' as const] : []), ...(inApp ? ['IN_APP' as const] : [])], title: title.trim(), message: message.trim() },
      { onSuccess: (r) => { setResult(r); setConfirm(false) }, onError: (e) => { setError(apiMessage(e, "Couldn't send it.")); setConfirm(false) } },
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Users className="h-4 w-4 text-primary" /> 1 · Who gets it</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ORDER.map((k) => {
              const a = AUDIENCES[k]
              const c = audiences.data?.find((x) => x.kind === k)
              const on = kind === k
              const Icon = k.startsWith('ONE') ? User : k === 'STORE_CUSTOMERS' ? Store : Users
              return (
                <motion.button key={k} type="button" whileHover={{ y: -2 }} onClick={() => pick(k)}
                  className={cn('relative flex flex-col gap-1 rounded-xl border-2 p-3 text-left transition-colors', on ? 'border-primary bg-primary/[0.05]' : 'border-border hover:border-primary/40')}>
                  {on && <motion.span layoutId="aud-check" className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-2.5 w-2.5" /></motion.span>}
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{a.label}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{a.who}</span>
                  {c && <span className="mt-0.5 text-[11px] font-medium text-foreground/80">{c.people.toLocaleString('en-IN')} people · {c.withPush.toLocaleString('en-IN')} with push</span>}
                </motion.button>
              )
            })}
          </div>
          <AnimatePresence initial={false}>
            {(kind === 'STORE_CUSTOMERS' || single) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-3">
                  {kind === 'STORE_CUSTOMERS' && <Picker key="store" kind="STORE" picked={store} onPick={setStore} />}
                  {single && <Picker key={kind} kind={kind === 'ONE_VENDOR' ? 'VENDOR' : 'USER'} picked={person} onPick={setPerson} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Smartphone className="h-4 w-4 text-primary" /> 2 · How it reaches them</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {([[push, setPush, BellRing, 'Push notification', 'Pops up on their phone, even when the app is closed. Only people who allowed notifications get it.'],
              [inApp, setInApp, Inbox, 'In-app message', 'Waits in the bell inside the app — everyone sees it next time they open Strike.']] as const).map(([on, set, Icon, t, sub]) => (
              <button key={t} type="button" onClick={() => set(!on)} aria-pressed={on}
                className={cn('flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors', on ? 'border-primary bg-primary/[0.05]' : 'border-border hover:border-primary/40')}>
                <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{on && <Check className="h-3 w-3" />}</span>
                <span><span className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Icon className="h-3.5 w-3.5" />{t}</span><span className="block text-[11px] leading-snug text-muted-foreground">{sub}</span></span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-primary" /> 3 · What it says</h2>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_STARTS.map((s) => (
                <button key={s.label} type="button" onClick={() => { setTitle(s.title); setMessage(s.message) }} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground">{s.label}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">Title <span className={cn('tabular-nums', title.length > 50 && 'text-amber-600', title.length > 65 && 'text-red-600')}>{title.length}/65</span></span>
            <input value={title} maxLength={65} onChange={(e) => setTitle(e.target.value)} placeholder="Short and clear — e.g. New offer just for you"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">Message <span className={cn('tabular-nums', message.length > 200 && 'text-amber-600')}>{message.length}/240</span></span>
            <textarea rows={3} value={message} maxLength={240} onChange={(e) => setMessage(e.target.value)} placeholder="One or two sentences. Phones show about 2 lines in a push."
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
        </section>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Sent to {result.people.toLocaleString('en-IN')} {recipientWord}{result.people === 1 ? '' : 's'}</p>
                <p className="text-muted-foreground">
                  {result.push && `Push: ${result.push.sent} delivered${result.push.failed ? `, ${result.push.failed} couldn’t be reached (no phone with notifications on)` : ''}. `}
                  {result.inApp && `In-app: ${result.inApp.total === 1 && !single && (kind === 'ALL_CUSTOMERS' || kind === 'ALL_VENDORS') ? 'posted to everyone’s inbox' : `${result.inApp.sent} inbox${result.inApp.sent === 1 ? '' : 'es'}`}.`}
                </p>
                <button type="button" onClick={() => { setResult(null); setTitle(''); setMessage('') }} className="mt-1 text-xs font-medium text-primary hover:underline">Write another</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
          <div className="flex flex-col gap-4">
            {push && <PushPreview title={title} message={message} />}
            {inApp && <InAppPreview title={title} message={message} />}
            {!push && !inApp && <p className="py-8 text-center text-sm text-muted-foreground">Choose push, in-app or both.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-foreground"><b>{people.toLocaleString('en-IN')}</b> {recipientWord}{people === 1 ? '' : 's'}{push ? <> · <b>{withPush.toLocaleString('en-IN')}</b> can get the push</> : null}</p>
          {push && people > 0 && withPush < people && <p className="mt-1 text-[11px] text-muted-foreground">The rest haven’t allowed notifications{inApp ? ' — they’ll still see the in-app message.' : '. Add in-app so everyone sees it.'}</p>}
          <button type="button" disabled={!ready || send.isPending} onClick={() => setConfirm(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e01a00] to-[#ff6a00] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 disabled:opacity-50">
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send now
          </button>
        </div>
      </aside>

      <ConfirmationDialog open={confirm} title={`Send to ${people.toLocaleString('en-IN')} ${recipientWord}${people === 1 ? '' : 's'}?`}
        description={`“${title.trim()}” goes out ${push && inApp ? 'as a push and an in-app message' : push ? 'as a push' : 'as an in-app message'} straight away. This can’t be taken back.`}
        confirmLabel="Send now" isLoading={send.isPending} onConfirm={doSend} onCancel={() => setConfirm(false)} />
    </div>
  )
}
