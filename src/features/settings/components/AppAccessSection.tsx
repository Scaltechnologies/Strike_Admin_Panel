import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Ban, CheckCircle2, Construction, Loader2, Power, Radio, RotateCcw, Save, ShieldCheck, Smartphone, Store, Wifi,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { formatRelative } from '@/utils/helpers/date'
import { checkAppStatus, useSaveMaintenance, type AppStatus, type SettingsOverview } from '../api/settings-overview.api'
import { MESSAGE_TEMPLATES } from '../utils/settings-meta'
import { Card, ChangedStamp, Explain, SectionHead, Switch } from './SettingsBits'

const MAX = 300

/** A phone-shaped preview of what the app shows right now. */
function Phone({ label, icon: Icon, closed, message }: { label: string; icon: typeof Smartphone; closed: boolean; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[300px] w-[150px] rounded-[28px] border-[6px] border-zinc-900 bg-zinc-900 shadow-xl dark:border-zinc-700">
        <span className="absolute left-1/2 top-1.5 z-10 h-3 w-14 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-700" />
        <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-white dark:bg-zinc-950">
          <AnimatePresence mode="wait" initial={false}>
            {closed ? (
              <motion.div key="closed" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
                <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e01a00]/10 text-[#e01a00]">
                  <Construction className="h-6 w-6" />
                </motion.span>
                <p className="text-[11px] font-bold text-zinc-900 dark:text-white">We&apos;ll be right back</p>
                <p className="line-clamp-6 break-words text-[9px] leading-snug text-zinc-500">{message}</p>
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                className="flex h-full flex-col gap-2 p-3 pt-6">
                <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-16 rounded-xl bg-gradient-to-br from-[#e01a00] to-[#ff6a00] opacity-90" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-2 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" />
                    </div>
                  </div>
                ))}
                <div className="mt-auto flex justify-around rounded-xl bg-zinc-100 py-1.5 dark:bg-zinc-900">
                  {[0, 1, 2, 3].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span>
    </div>
  )
}

function LiveCheck() {
  const [state, setState] = useState<{ loading: boolean; result?: { status: AppStatus; ms: number }; error?: boolean; at?: string }>({ loading: false })
  const run = async () => {
    setState((s) => ({ ...s, loading: true, error: false }))
    try {
      const result = await checkAppStatus()
      setState({ loading: false, result, at: new Date().toISOString() })
    } catch {
      setState({ loading: false, error: true, at: new Date().toISOString() })
    }
  }
  const r = state.result
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
      <button type="button" onClick={run} disabled={state.loading}
        className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60">
        {state.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
        Check what the apps see now
      </button>
      {state.error && <span className="text-xs text-red-600">Couldn&apos;t reach the server — the apps can&apos;t either right now.</span>}
      {r && (
        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold', r.status.maintenanceMode ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600')}>
            {r.status.maintenanceMode ? <Ban className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {r.status.maintenanceMode ? 'Apps see: closed' : 'Apps see: open'}
          </span>
          answered in {r.ms} ms {state.at && `· ${formatRelative(state.at)}`}
        </motion.span>
      )}
    </div>
  )
}

export function AppAccessSection({ data }: { data: SettingsOverview | undefined }) {
  const save = useSaveMaintenance()
  const [confirm, setConfirm] = useState<null | boolean>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const m = data?.maintenance
  const on = !!m?.on
  const message = draft ?? m?.message ?? ''
  const dirty = draft != null && draft.trim() !== (m?.message ?? '').trim()

  const confirmSwitch = () => {
    if (confirm == null) return
    save.mutate(
      { enabled: confirm, ...(dirty ? { message: message.trim() } : {}) },
      { onSuccess: () => { setConfirm(null); setDraft(null) } },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={Power} tone="bg-gradient-to-br from-rose-500 to-red-700 shadow-red-500/30" title="App access"
        body="Close the customer and vendor apps for everyone while you fix or upgrade something. The admin panel always stays open." />

      <Card className={cn('relative overflow-hidden', on && 'border-red-500/40')}>
        {on && <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(239,68,68,0.05)_14px_28px)]" aria-hidden />}
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', on ? 'bg-red-500' : 'bg-emerald-500')} />
                  <span className={cn('relative inline-flex h-3 w-3 rounded-full', on ? 'bg-red-500' : 'bg-emerald-500')} />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">{on ? 'The apps are closed' : 'The apps are open'}</p>
                  <p className="text-xs text-muted-foreground">
                    {on ? `Closed ${m?.changedAt ? formatRelative(m.changedAt) : ''} — customers and vendors see your message.` : 'Customers and vendors are using the apps normally.'}
                  </p>
                  <ChangedStamp at={m?.changedAt} by={m?.changedBy} className="mt-1" />
                </div>
              </div>
              <Switch on={on} label={on ? 'Open the apps' : 'Close the apps for maintenance'} tone="bg-red-500" disabled={!data || save.isPending}
                onChange={(v) => setConfirm(v)} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="maint-msg" className="text-sm font-medium text-foreground">Message the apps show</label>
                <span className={cn('text-[11px] tabular-nums', message.length > MAX ? 'text-red-600' : 'text-muted-foreground')}>{message.length}/{MAX}</span>
              </div>
              <textarea id="maint-msg" rows={3} value={message} maxLength={MAX + 50} onChange={(e) => setDraft(e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MESSAGE_TEMPLATES.map((t) => (
                  <button key={t} type="button" onClick={() => setDraft(t)} title={t}
                    className={cn('max-w-[260px] truncate rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                      message === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground')}>
                    {t}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {dirty && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 flex items-center gap-2">
                      <button type="button" disabled={save.isPending || message.trim().length === 0 || message.length > MAX}
                        onClick={() => save.mutate({ message: message.trim() }, { onSuccess: () => setDraft(null) })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save message
                      </button>
                      <button type="button" onClick={() => setDraft(null)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                        <RotateCcw className="h-3.5 w-3.5" /> Undo
                      </button>
                      <span className="text-[11px] text-muted-foreground">{on ? 'The apps will show it straight away.' : 'Used the next time you close the apps.'}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Explain icon={Ban} tone="danger">
                <b>Closed while on:</b> the customer app and vendor app — browsing, buying cards, redeeming, sign-in and menus.
              </Explain>
              <Explain icon={ShieldCheck} tone="ok">
                <b>Still works:</b> this admin panel, Razorpay confirming payments already made, and images. Nobody loses money or balance.
              </Explain>
            </div>
            <LiveCheck />
          </div>

          <div className="flex justify-center gap-4 lg:pl-2">
            <Phone label="Customer app" icon={Smartphone} closed={on} message={message || (m?.message ?? '')} />
            <Phone label="Vendor app" icon={Store} closed={on} message={message || (m?.message ?? '')} />
          </div>
        </div>
      </Card>

      <Explain icon={Wifi}>
        Someone who already has an app open is stopped the next time the app loads anything (within about 5 seconds of you switching). Apps check again every time they start. When you open the apps again, people get back in as soon as they reopen or return to the app.
      </Explain>

      <ConfirmationDialog
        open={confirm != null}
        title={confirm ? 'Close the apps for everyone?' : 'Open the apps again?'}
        description={confirm
          ? `Every customer and vendor will be locked out within seconds and see: “${message.trim() || m?.message}”. Only this admin panel stays open.`
          : 'Customers and vendors can use the apps again straight away.'}
        confirmLabel={confirm ? 'Close the apps' : 'Open the apps'}
        variant={confirm ? 'destructive' : 'default'}
        onConfirm={confirmSwitch}
        onCancel={() => setConfirm(null)}
        isLoading={save.isPending}
      />
    </div>
  )
}
