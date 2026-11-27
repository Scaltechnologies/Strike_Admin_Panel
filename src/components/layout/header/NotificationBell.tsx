import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { formatDistanceToNowStrict, isToday } from 'date-fns'
import { Bell, BellRing, CheckCheck, Monitor, Repeat, Settings2, Volume2, VolumeX, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { useAlertsStore, isUnread, type AdminAlert, type AlertType } from '@/features/alerts/alerts-store'
import { ALERT_META, ALERT_TYPES } from '@/features/alerts/alert-meta'
import { playAlert } from '@/features/alerts/sound'

type Tab = 'all' | 'action'

const WAITING_LINKS: { key: 'withdrawals' | 'menuChanges' | 'vendors' | 'redemptions'; label: string; path: string; tone: string }[] = [
  { key: 'withdrawals', label: 'Withdrawals', path: '/withdrawals', tone: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300' },
  { key: 'menuChanges', label: 'Menu changes', path: '/menus', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' },
  { key: 'vendors', label: 'Vendors to approve', path: '/vendors', tone: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300' },
  { key: 'redemptions', label: 'Redemptions', path: '/redemptions', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300' },
]

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [showSettings, setShowSettings] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const bell = useAnimationControls()

  const { alerts, waiting, lastReadAt, readIds, pulse, settings, audioLocked, markAllRead, markRead, setSettings } = useAlertsStore()
  const unread = useMemo(() => alerts.filter((a) => isUnread(a, lastReadAt, readIds)), [alerts, lastReadAt, readIds])
  const list = tab === 'action' ? alerts.filter((a) => a.actionNeeded) : alerts
  const waitingTotal = Object.values(waiting).reduce<number>((s, n) => s + (n ?? 0), 0)
  // Card sales show for Payments or Cards access (as on the server).
  const visibleTypes = ALERT_TYPES.filter((t) => hasPermission(ALERT_META[t].section) || (t === 'CARD_SOLD' && hasPermission('SEC_CARDS')))

  // Shake the bell when something new arrives.
  useEffect(() => {
    if (pulse > 0) void bell.start({ rotate: [0, -22, 20, -16, 12, -6, 0], transition: { duration: 0.9 } })
  }, [pulse, bell])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const go = (a: AdminAlert) => { markRead(a); setOpen(false); router.history.push(a.link) }
  const goPath = (path: string) => { setOpen(false); router.history.push(path) }
  const askDesktop = async () => {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setSettings({ desktop: p === 'granted' })
  }
  const desktopState = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  const toggleSilent = (t: AlertType) => setSettings({ silent: settings.silent.includes(t) ? settings.silent.filter((x) => x !== t) : [...settings.silent, t] })

  const today = list.filter((a) => isToday(new Date(a.createdAt)))
  const earlier = list.filter((a) => !isToday(new Date(a.createdAt)))

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`} aria-expanded={open} aria-haspopup="dialog"
        className={cn('relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          unread.length ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
        <motion.span animate={bell} style={{ transformOrigin: '50% 10%' }} className="flex">
          {unread.length ? <BellRing className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
        </motion.span>
        <AnimatePresence>
          {unread.length > 0 && (
            <motion.span key="count" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-[#e01a00] px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-background">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/50" aria-hidden />
              <span className="relative tabular-nums">{unread.length > 99 ? '99+' : unread.length}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.96, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute right-0 top-10 z-50 flex max-h-[min(640px,calc(100vh-80px))] w-[400px] max-w-[calc(100vw-24px)] origin-top-right flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
            role="dialog" aria-label="Notifications">
            <div className="relative shrink-0 overflow-hidden bg-[#0b0c10] px-4 pb-3 pt-4 text-white">
              <div className="auth-aurora pointer-events-none absolute inset-0 opacity-60" aria-hidden><span /><span /><span /></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">Notifications</h2>
                  <p className="text-[11px] text-white/60">{unread.length ? `${unread.length} new` : 'You’re all caught up'}{waitingTotal ? ` · ${waitingTotal} waiting for action` : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSettings({ sound: !settings.sound })} aria-label={settings.sound ? 'Mute sounds' : 'Turn sounds on'} title={settings.sound ? 'Sound on' : 'Sound off'}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10">
                    {settings.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setShowSettings((s) => !s)} aria-label="Alert settings" aria-expanded={showSettings}
                    className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10', showSettings && 'bg-white/15')}>
                    <Settings2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setOpen(false)} aria-label="Close notifications" className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {waitingTotal > 0 && (
                <div className="relative mt-3 flex flex-wrap gap-1.5">
                  {WAITING_LINKS.filter((w) => (waiting[w.key] ?? 0) > 0).map((w) => (
                    <button key={w.key} onClick={() => goPath(w.path)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold transition-transform hover:scale-105', w.tone)}>
                      {waiting[w.key]} {w.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {settings.sound && audioLocked && (
              <button onClick={() => { playAlert('info', settings.volume); useAlertsStore.getState().setAudioLocked(false) }}
                className="flex shrink-0 items-center gap-2 bg-amber-50 px-4 py-2 text-left text-xs font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-200">
                <Volume2 className="h-4 w-4 shrink-0" /> Your browser has muted this tab — click here once to turn alert sounds on.
              </button>
            )}

            <AnimatePresence initial={false}>
              {showSettings && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden border-b border-border bg-muted/30">
                  <div className="flex flex-col gap-3 p-4 text-xs">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <input type="range" min={0} max={1} step={0.05} value={settings.volume} aria-label="Volume"
                        onChange={(e) => setSettings({ volume: Number(e.target.value) })} className="flex-1 accent-[#e01a00]" />
                      <span className="w-9 text-right tabular-nums text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['urgent', 'attention', 'sale', 'info'] as const).map((k) => (
                        <button key={k} onClick={() => playAlert(k, settings.volume)} className="rounded-lg border border-border bg-card px-2.5 py-1 font-medium capitalize hover:bg-muted">
                          ▶ {k === 'urgent' ? 'Request' : k === 'sale' ? 'Sale' : k === 'attention' ? 'Redemption' : 'Info'} sound
                        </button>
                      ))}
                    </div>
                    <Toggle icon={Repeat} label="Keep ringing every 30 s until I open an urgent request" on={settings.repeatUrgent} onChange={(v) => setSettings({ repeatUrgent: v })} />
                    {desktopState === 'granted' ? (
                      <Toggle icon={Monitor} label="Desktop notifications when this tab is in the background" on={settings.desktop} onChange={(v) => setSettings({ desktop: v })} />
                    ) : desktopState !== 'unsupported' && (
                      <button onClick={() => void askDesktop()} disabled={desktopState === 'denied'}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left font-medium hover:bg-muted disabled:opacity-60">
                        <Monitor className="h-4 w-4" />
                        {desktopState === 'denied' ? 'Desktop notifications are blocked in your browser settings' : 'Turn on desktop notifications'}
                      </button>
                    )}
                    <div>
                      <p className="mb-1.5 font-medium text-muted-foreground">Play a sound for</p>
                      <div className="flex flex-wrap gap-1.5">
                        {visibleTypes.map((t) => {
                          const on = !settings.silent.includes(t)
                          const M = ALERT_META[t]
                          return (
                            <button key={t} onClick={() => toggleSilent(t)} aria-pressed={on}
                              className={cn('flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors', on ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border text-muted-foreground line-through')}>
                              <M.icon className="h-3 w-3" /> {M.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <div role="tablist" className="flex gap-1 rounded-lg bg-muted/60 p-0.5">
                {([['all', 'All'], ['action', 'Needs action']] as const).map(([v, label]) => (
                  <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
                    className={cn('relative rounded-md px-3 py-1 text-xs font-medium transition-colors', tab === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    {tab === v && <motion.span layoutId="bell-tab" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              {unread.length > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="min-h-[120px] flex-1 overflow-y-auto">
              {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Bell className="h-6 w-6 text-muted-foreground" /></span>
                  <p className="text-sm font-medium text-foreground">{tab === 'action' ? 'Nothing needs you right now' : 'No notifications yet'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">New requests and sales show up here with a sound.</p>
                </div>
              ) : (
                <>
                  <Group label="Today" items={today} lastReadAt={lastReadAt} readIds={readIds} onOpen={go} />
                  <Group label="Earlier" items={earlier} lastReadAt={lastReadAt} readIds={readIds} onOpen={go} />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Group({ label, items, lastReadAt, readIds, onOpen }: {
  label: string; items: AdminAlert[]; lastReadAt: string; readIds: string[]; onOpen: (a: AdminAlert) => void
}) {
  if (items.length === 0) return null
  return (
    <section>
      <p className="sticky top-0 z-10 bg-popover/95 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">{label}</p>
      <ul>
        {items.map((a, i) => {
          const meta = ALERT_META[a.type]
          const unread = isUnread(a, lastReadAt, readIds)
          return (
            <motion.li key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.025 }}>
              <button onClick={() => onOpen(a)} className={cn('group flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60', unread && 'bg-primary/[0.04]')}>
                <span className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', meta.tone)}>
                  <meta.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn('text-[13px] leading-snug', unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>{a.title}</span>
                    {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{a.message}</span>
                  <span className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(a.createdAt), { addSuffix: true })}
                    {a.actionNeeded && <span className="rounded-full bg-amber-100 px-1.5 py-px font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Needs action</span>}
                  </span>
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}

function Toggle({ icon: Icon, label, on, onChange }: { icon: typeof Bell; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left font-medium hover:bg-muted">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', on ? 'bg-emerald-500' : 'bg-muted-foreground/30')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  )
}
