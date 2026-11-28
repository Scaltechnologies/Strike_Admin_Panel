import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Activity, BellRing, FileText, Inbox, LayoutDashboard, Send, Smartphone, Users, Workflow, Zap, type LucideIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { useCenterOverview } from './api/notification-center.api'
import { ActivityFeed, DevicesList } from './components/center/ActivityAndDevices'
import { AutomaticEvents } from './components/center/AutomaticEvents'
import { CenterOverview } from './components/center/CenterOverview'
import { Composer } from './components/center/Composer'
import { TemplatesPanel } from './components/templates/TemplatesPanel'
import type { NotificationsTab } from './utils/notify-meta'

const TABS: { id: NotificationsTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'send', label: 'Send a message', icon: Send },
  { id: 'automatic', label: 'Automatic', icon: Workflow },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'devices', label: 'Phones', icon: Smartphone },
  { id: 'templates', label: 'All templates', icon: FileText },
]

function HeaderStat({ icon: Icon, label, value, hint, tone, suffix, onClick }: { icon: LucideIcon; label: string; value: number | undefined; hint?: string; tone: string; suffix?: string; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick}
      className={cn('flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left backdrop-blur-md transition-all', onClick && 'hover:-translate-y-0.5 hover:bg-white/[0.12]')}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg', tone)}><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        {value == null ? <span className="block text-xl font-bold leading-none text-white">—</span>
          : <span className="block text-xl font-bold leading-none text-white"><AnimatedNumber value={value} />{suffix}</span>}
        <span className="mt-1 block truncate text-[11px] text-white/60">{label}</span>
        {hint && <span className="block truncate text-[10px] text-white/40">{hint}</span>}
      </span>
    </Comp>
  )
}

export function NotificationsPage({ tab = 'overview' }: { tab?: NotificationsTab }) {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const overview = useCenterOverview(days)
  const o = overview.data
  const go = (id: NotificationsTab) => void navigate({ to: '/notifications', search: { tab: id === 'overview' ? undefined : id }, replace: true })
  const reach = o?.reach
  const pushReach = reach && Number(reach.customers) ? Math.round((Number(reach.customersWithPush ?? 0) / Number(reach.customers)) * 100) : undefined

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <motion.span animate={{ rotate: [0, -12, 12, -6, 0] }} transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.8 }}
          className="pointer-events-none absolute -right-4 -top-4 text-white/[0.05]" aria-hidden><BellRing className="h-44 w-44" /></motion.span>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-300 via-[#ff4d1c] to-[#e01a00] shadow-lg shadow-orange-600/40"><BellRing className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">Push notifications pop up on phones; in-app messages wait in the bell inside the app. Send your own, control the automatic ones, and see what reached people.</p>
              </div>
            </div>
            <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => go('send')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b0c10] shadow-lg"><Send className="h-4 w-4" /> Send a message</motion.button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <HeaderStat icon={BellRing} label="Push delivered today" value={o?.push?.sent_today} hint={o ? `${o.push?.sent ?? 0} in ${days} days` : undefined} tone="bg-gradient-to-br from-[#e01a00] to-[#ff6a00]" onClick={() => go('activity')} />
            <HeaderStat icon={Inbox} label="In-app today" value={o?.inApp?.sent_today} hint={o ? `${o.inApp?.unread_now ?? 0} unread right now` : undefined} tone="bg-gradient-to-br from-violet-500 to-fuchsia-600" onClick={() => go('activity')} />
            <HeaderStat icon={Users} label="Customers reachable by push" value={pushReach} suffix="%" hint={reach ? `${reach.customersWithPush ?? 0} of ${reach.customers}` : undefined} tone="bg-gradient-to-br from-sky-400 to-indigo-600" onClick={() => go('devices')} />
            <HeaderStat icon={Smartphone} label="Vendors reachable by push" value={reach ? Number(reach.vendorsWithPush ?? 0) : undefined} hint={reach ? `of ${reach.vendors} vendors` : undefined} tone="bg-gradient-to-br from-emerald-400 to-teal-600" onClick={() => go('devices')} />
            <HeaderStat icon={Zap} label="Pushes that didn’t arrive" value={o?.push?.failed} hint={`last ${days} days`} tone="bg-gradient-to-br from-amber-400 to-orange-600" onClick={() => go('overview')} />
          </div>
        </div>
      </motion.section>

      <nav aria-label="Notification sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
        <div role="tablist" className="flex min-w-max gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => go(id)}
                className={cn('relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {on && <motion.span layoutId="ntf-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#e01a00] to-[#ff6a00] shadow-md shadow-red-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                <Icon className="relative h-4 w-4" /><span className="relative">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'overview' && <CenterOverview data={o} loading={overview.isLoading} days={days} onDays={setDays} go={go} />}
          {tab === 'send' && <Composer />}
          {tab === 'automatic' && <AutomaticEvents />}
          {tab === 'activity' && <ActivityFeed />}
          {tab === 'devices' && <DevicesList />}
          {tab === 'templates' && <TemplatesPanel />}
        </ErrorBoundary>
      </motion.div>
    </div>
  )
}

export default NotificationsPage
