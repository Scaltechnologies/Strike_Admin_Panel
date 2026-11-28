import { useState } from 'react'
import { motion } from 'framer-motion'
import { BellRing, Check, Laptop, Monitor, Moon, Palette, Play, Repeat, Sun, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { useTheme } from '@/core/theme/use-theme'
import type { Theme } from '@/constants/theme'
import { useAlertsStore, type AlertType } from '@/features/alerts/alerts-store'
import { ALERT_META, ALERT_TYPES } from '@/features/alerts/alert-meta'
import { playAlert, type AlertSound } from '@/features/alerts/sound'
import { Card, Explain, SectionHead, Switch } from './SettingsBits'

const SOUNDS: { kind: AlertSound; label: string; used: string }[] = [
  { kind: 'urgent', label: 'Request', used: 'Withdrawals, menu changes, new vendors' },
  { kind: 'attention', label: 'Redemption', used: 'A redemption waiting at a store' },
  { kind: 'sale', label: 'Sale', used: 'A card was sold' },
  { kind: 'info', label: 'Info', used: 'Everything else' },
]

export function AlertsSection() {
  const { settings, setSettings } = useAlertsStore()
  const [playing, setPlaying] = useState<AlertSound | null>(null)
  const [desktop, setDesktop] = useState(() => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission))
  const types = ALERT_TYPES.filter((t) => hasPermission(ALERT_META[t].section) || (t === 'CARD_SOLD' && hasPermission('SEC_CARDS')))

  const play = (k: AlertSound) => {
    playAlert(k, settings.volume)
    setPlaying(k)
    window.setTimeout(() => setPlaying((p) => (p === k ? null : p)), 900)
  }
  const askDesktop = async () => {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setDesktop(p)
    setSettings({ desktop: p === 'granted' })
  }
  const toggleType = (t: AlertType) =>
    setSettings({ silent: settings.silent.includes(t) ? settings.silent.filter((x) => x !== t) : [...settings.silent, t] })

  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={BellRing} tone="bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/30" title="Alerts & sounds"
        body="How this computer tells you about new requests. These choices are saved in this browser only — each admin sets their own." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', settings.sound ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                {settings.sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Play sounds</p>
                <p className="text-xs text-muted-foreground">{settings.sound ? 'A sound plays when something new arrives.' : 'Muted — alerts only appear in the bell.'}</p>
              </div>
            </div>
            <Switch on={settings.sound} label="Play alert sounds" onChange={(v) => setSettings({ sound: v })} />
          </div>
          <div className={cn('flex items-center gap-3', !settings.sound && 'pointer-events-none opacity-50')}>
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <input type="range" min={0} max={1} step={0.05} value={settings.volume} aria-label="Volume"
              onChange={(e) => setSettings({ volume: Number(e.target.value) })} className="flex-1 cursor-pointer accent-[#e01a00]" />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="w-10 text-right text-xs font-semibold tabular-nums">{Math.round(settings.volume * 100)}%</span>
          </div>
          <div className={cn('grid gap-2 sm:grid-cols-2', !settings.sound && 'pointer-events-none opacity-50')}>
            {SOUNDS.map((s) => (
              <button key={s.kind} type="button" onClick={() => play(s.kind)}
                className="group flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
                <span className={cn('relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary')}>
                  {playing === s.kind && <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
                  <Play className="relative h-3.5 w-3.5 fill-current" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{s.label} sound</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{s.used}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><Repeat className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold text-foreground">Keep ringing</p>
                <p className="text-xs text-muted-foreground">Ring again every 30 seconds until you open an urgent request.</p>
              </div>
            </div>
            <Switch on={settings.repeatUrgent} label="Keep ringing for urgent requests" onChange={(v) => setSettings({ repeatUrgent: v })} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><Monitor className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold text-foreground">Desktop pop-ups</p>
                <p className="text-xs text-muted-foreground">
                  {desktop === 'denied' ? 'Blocked in your browser settings — allow notifications for this site to use them.'
                    : desktop === 'unsupported' ? "This browser doesn't support them."
                      : 'Show a pop-up when this tab is in the background.'}
                </p>
              </div>
            </div>
            {desktop === 'granted' ? (
              <Switch on={settings.desktop} label="Desktop pop-ups" onChange={(v) => setSettings({ desktop: v })} />
            ) : desktop === 'default' ? (
              <button type="button" onClick={() => void askDesktop()} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Allow</button>
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Make a sound for</p>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => {
                const on = !settings.silent.includes(t)
                const M = ALERT_META[t]
                return (
                  <motion.button key={t} type="button" whileTap={{ scale: 0.95 }} onClick={() => toggleType(t)} aria-pressed={on}
                    className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      on ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border text-muted-foreground')}>
                    {on ? <Check className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5" />}
                    <M.icon className="h-3.5 w-3.5" /> {M.label}
                  </motion.button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Silenced types still show up in the bell.</p>
          </div>
        </Card>
      </div>
      <Explain icon={Volume2}>Browsers only allow sound after you click somewhere on the page. If you don&apos;t hear anything after a refresh, click anywhere once.</Explain>
    </div>
  )
}

const THEMES: { value: Theme; label: string; icon: typeof Sun; note: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, note: 'Bright and clean' },
  { value: 'dark', label: 'Dark', icon: Moon, note: 'Easier on the eyes at night' },
  { value: 'system', label: 'Match my computer', icon: Laptop, note: 'Follows your device setting' },
]

function ThemePreview({ dark }: { dark: boolean | 'split' }) {
  const half = (d: boolean) => (
    <div className={cn('flex h-full flex-1 gap-1.5 p-2', d ? 'bg-zinc-900' : 'bg-zinc-50')}>
      <div className={cn('w-1/4 rounded-md', d ? 'bg-zinc-800' : 'bg-white shadow-sm')}>
        <div className="m-1.5 h-1.5 w-3/4 rounded bg-[#e01a00]" />
        {[0, 1, 2].map((i) => <div key={i} className={cn('m-1.5 h-1 rounded', d ? 'bg-zinc-700' : 'bg-zinc-200')} />)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-5 rounded-md bg-gradient-to-r from-[#e01a00] to-[#ff6a00] opacity-90" />
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => <div key={i} className={cn('rounded-md', d ? 'bg-zinc-800' : 'bg-white shadow-sm')} />)}
        </div>
      </div>
    </div>
  )
  return (
    <div className="flex h-24 overflow-hidden rounded-xl border border-border">
      {dark === 'split' ? <>{half(false)}{half(true)}</> : half(dark)}
    </div>
  )
}

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={Palette} tone="bg-gradient-to-br from-violet-400 to-fuchsia-600 shadow-fuchsia-500/30" title="Appearance"
        body="How the admin panel looks on this computer. Only you see this choice." />
      <div className="grid gap-3 md:grid-cols-3">
        {THEMES.map((t, i) => {
          const on = theme === t.value
          return (
            <motion.button key={t.value} type="button" onClick={() => setTheme(t.value)} aria-pressed={on}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
              className={cn('relative flex flex-col gap-3 rounded-2xl border-2 bg-card p-3 text-left transition-colors', on ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-primary/40')}>
              <ThemePreview dark={t.value === 'system' ? 'split' : t.value === 'dark'} />
              <div className="flex items-center gap-2 px-1">
                <t.icon className={cn('h-4 w-4', on ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.note}</p>
                </div>
                {on && <motion.span layoutId="theme-check" className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></motion.span>}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
