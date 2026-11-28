import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertOctagon, AlertTriangle, ArrowRight, BellRing, CheckCircle2, CreditCard, History, Info, Palette, Percent, Power, UtensilsCrossed, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/core/theme/use-theme'
import { useAlertsStore } from '@/features/alerts/alerts-store'
import type { SettingsOverview } from '../api/settings-overview.api'
import { APPROVAL_LABEL, PAYMENT_META, healthChecks, type HealthLevel, type SettingsTab } from '../utils/settings-meta'
import { HistoryList } from './InfoSections'
import { Card, ChangedStamp } from './SettingsBits'

const LEVEL: Record<HealthLevel, { icon: LucideIcon; tone: string; ring: string }> = {
  critical: { icon: AlertOctagon, tone: 'text-red-600 bg-red-500/10', ring: 'border-red-500/30 hover:border-red-500/60' },
  warning: { icon: AlertTriangle, tone: 'text-amber-600 bg-amber-500/10', ring: 'border-amber-500/30 hover:border-amber-500/60' },
  info: { icon: Info, tone: 'text-sky-600 bg-sky-500/10', ring: 'border-border hover:border-sky-500/40' },
}

function Tile({ icon: Icon, tone, title, value, note, at, by, alert, onClick, delay }: {
  icon: LucideIcon; tone: string; title: string; value: string; note: string; at?: string | null; by?: string | null; alert?: boolean; onClick: () => void; delay: number
}) {
  return (
    <motion.button type="button" onClick={onClick} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
      className={cn('group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-lg',
        alert ? 'border-red-500/40' : 'border-border')}>
      <span className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-xl transition-opacity group-hover:opacity-25', tone)} />
      <div className="flex items-center justify-between">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', tone)}><Icon className="h-5 w-5" /></span>
        <ArrowRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className={cn('mt-0.5 text-lg font-bold tracking-tight', alert ? 'text-red-600' : 'text-foreground')}>{value}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note}</p>
      </div>
      {at !== undefined && <ChangedStamp at={at} by={by} className="mt-auto" />}
    </motion.button>
  )
}

export function OverviewSection({ data, loading, go }: { data: SettingsOverview | undefined; loading: boolean; go: (t: SettingsTab) => void }) {
  const sound = useAlertsStore((s) => s.settings.sound)
  const volume = useAlertsStore((s) => s.settings.volume)
  const { theme } = useTheme()
  const health = healthChecks(data, sound)
  const needs = health.filter((h) => h.level !== 'info').length

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Health check</p>
            <p className="text-xs text-muted-foreground">Settings that could stop people buying or using cards.</p>
          </div>
          {data && (
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', needs ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600')}>
              {needs ? `${needs} to look at` : 'All good'}
            </span>
          )}
        </div>
        <div className="p-4">
          {loading ? <div className="h-16 animate-pulse rounded-xl bg-muted" /> : health.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 rounded-xl bg-emerald-500/[0.07] px-4 py-3">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.1 }}>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </motion.span>
              <div>
                <p className="text-sm font-semibold text-foreground">Everything is set up well</p>
                <p className="text-xs text-muted-foreground">The apps are open, payments are ready and nothing is waiting on you.</p>
              </div>
            </motion.div>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              <AnimatePresence initial={false}>
                {health.map((h, i) => {
                  const L = LEVEL[h.level]
                  return (
                    <motion.li key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <button type="button" onClick={() => go(h.tab)}
                        className={cn('group flex h-full w-full items-start gap-3 rounded-xl border bg-card px-3.5 py-3 text-left transition-colors', L.ring)}>
                        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', L.tone)}><L.icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{h.title}</span>
                          <span className="block text-xs text-muted-foreground">{h.body}</span>
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Tile delay={0} icon={Power} tone="from-rose-500 to-red-700" title="App access" alert={data?.maintenance.on}
          value={!data ? '…' : data.maintenance.on ? 'Closed for maintenance' : 'Open to everyone'}
          note={data?.maintenance.on ? data.maintenance.message : 'Customers and vendors can use the apps.'}
          at={data?.maintenance.changedAt ?? null} by={data?.maintenance.changedBy} onClick={() => go('access')} />
        <Tile delay={0.05} icon={CreditCard} tone="from-sky-400 to-indigo-600" title="Payments"
          value={!data ? '…' : PAYMENT_META[data.paymentMode.mode]?.label ?? data.paymentMode.mode}
          note={!data ? '' : data.razorpay.configured ? `Razorpay ${data.razorpay.mode === 'LIVE' ? 'live' : 'test'} keys saved.` : 'Razorpay keys not saved yet.'}
          at={data?.paymentMode.changedAt ?? null} by={data?.paymentMode.changedBy} onClick={() => go('payments')} />
        <Tile delay={0.1} icon={Percent} tone="from-orange-400 to-red-600" title="Default commission"
          value={!data ? '…' : `${Number(data.commission.rate)}%`}
          note={!data ? '' : `${data.commission.onDefault} of ${data.commission.vendors} vendors pay the default. New vendors start on it.`}
          at={data?.commission.changedAt ?? null} by={data?.commission.changedBy} onClick={() => go('commission')} />
        <Tile delay={0.15} icon={UtensilsCrossed} tone="from-amber-400 to-orange-600" title="Menu approvals"
          value={!data ? '…' : APPROVAL_LABEL[data.menuApproval.mode] ?? data.menuApproval.mode}
          note={!data ? '' : `${data.menuApproval.pending} waiting · ${data.menuApproval.trusted} trusted vendor${data.menuApproval.trusted === 1 ? '' : 's'} skip approval.`}
          at={data?.menuApproval.changedAt ?? null} by={data?.menuApproval.changedBy} onClick={() => go('menus')} />
        <Tile delay={0.2} icon={BellRing} tone="from-amber-400 to-orange-600" title="Alert sounds (this computer)"
          value={sound ? `On · ${Math.round(volume * 100)}% volume` : 'Muted'}
          note="Sounds for new withdrawals, menu changes, redemptions and sales." onClick={() => go('alerts')} />
        <Tile delay={0.25} icon={Palette} tone="from-violet-400 to-fuchsia-600" title="Appearance (this computer)"
          value={theme === 'system' ? 'Matches your computer' : theme === 'dark' ? 'Dark' : 'Light'}
          note="Light, dark, or follow your device." onClick={() => go('appearance')} />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><History className="h-4 w-4 text-primary" /> Recent changes</p>
          <button type="button" onClick={() => go('history')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">See all <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
        {data ? <HistoryList entries={data.history} limit={5} /> : <div className="h-32 animate-pulse rounded-xl bg-muted" />}
      </Card>
    </div>
  )
}
