import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Activity, CalendarCheck, Clock, KeyRound, LayoutDashboard, LogIn, Mail, Phone, ShieldCheck, SlidersHorizontal,
  Sparkles, UserPen, type LucideIcon,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS, type Role } from '@/constants/roles'
import { formatDate, formatRelative } from '@/utils/helpers/date'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { initials } from '@/features/audit-logs/utils/audit-display'
import { useMe, useMyOverview } from './api/profile.api'
import { accountHealth, greeting, type ProfileTab } from './utils/profile-meta'
import { ProfileOverview } from './components/ProfileOverview'
import { AccountTab } from './components/AccountTab'
import { SecurityTab } from './components/SecurityTab'
import { ActivityTab } from './components/ActivityTab'
import { AccessTab } from './components/AccessTab'
import { PreferencesTab } from './components/PreferencesTab'

const TABS: { id: ProfileTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'account', label: 'My details', icon: UserPen },
  { id: 'security', label: 'Password & sign-ins', icon: KeyRound },
  { id: 'activity', label: 'My activity', icon: Activity },
  { id: 'access', label: 'What I can access', icon: ShieldCheck },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
]

function HeroStat({ icon: Icon, label, value, suffix, hint, tone, onClick }: {
  icon: LucideIcon; label: string; value: number | undefined; suffix?: string; hint?: string; tone: string; onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/[0.12]">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg', tone)}><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <span className="block text-xl font-bold leading-none text-white">{value == null ? '—' : <><AnimatedNumber value={value} />{suffix}</>}</span>
        <span className="mt-1 block truncate text-[11px] text-white/60">{label}</span>
        {hint && <span className="block truncate text-[10px] text-white/40">{hint}</span>}
      </span>
    </button>
  )
}

export function ProfilePage({ tab = 'overview' }: { tab?: ProfileTab }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [days, setDays] = useState(30)
  const me = useMe()
  const overview = useMyOverview(days)
  const o = overview.data
  // Captured once per mount so render stays pure; "days ago" maths doesn't need to tick.
  const [now] = useState(() => Date.now())
  const go = (id: ProfileTab) => void navigate({ to: '/profile', search: { tab: id === 'overview' ? undefined : id }, replace: true })

  const health = useMemo(() => accountHealth({
    phone: user?.phone,
    createdAt: me.data?.createdAt,
    passwordChangedAt: o?.account.passwordChangedAt ?? null,
    failedWeek: Number(o?.signIns.failedWeek ?? 0),
    devices: Number(o?.signIns.devices ?? 0),
    now,
  }), [user?.phone, me.data?.createdAt, o, now])

  if (!user) return null
  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role
  const isSuper = user.role === 'SUPER_ADMIN'
  const lastLogin = me.data?.lastLoginAt ?? user.lastLoginAt
  const previous = o?.account.previousSignIn?.createdAt
  const hello = greeting(new Date(now).getHours())

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-5">
              <div className="relative shrink-0">
                <motion.span aria-hidden className="absolute -inset-1.5 rounded-[1.6rem] bg-[conic-gradient(from_0deg,#ff6a00,#e01a00,#a855f7,#0ea5e9,#ff6a00)] opacity-80 blur-[2px]"
                  animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 14, ease: 'linear' }} />
                <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-300 via-[#ff4d1c] to-[#e01a00] text-2xl font-bold shadow-lg shadow-orange-600/40">
                  {initials(user.name)}
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0b0c10] bg-emerald-500" title="Signed in now">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-white/50"><Sparkles className="h-3.5 w-3.5 text-amber-300" />{hello}</p>
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{user.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/60">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold',
                    isSuper ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/30' : 'bg-sky-400/15 text-sky-200 ring-1 ring-sky-300/30')}>
                    <ShieldCheck className="h-3.5 w-3.5" />{roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                  {user.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{user.phone}</span>}
                  {me.data?.createdAt && <span className="inline-flex items-center gap-1.5"><CalendarCheck className="h-3.5 w-3.5" />Admin since {formatDate(me.data.createdAt)}</span>}
                  {(previous || lastLogin) && (
                    <span className="inline-flex items-center gap-1.5" title="The sign-in before this one">
                      <Clock className="h-3.5 w-3.5" />Previous sign-in {formatRelative(previous ?? lastLogin!)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => go('account')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/15"><UserPen className="h-4 w-4" /> Edit details</motion.button>
              <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => go('security')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b0c10] shadow-lg"><KeyRound className="h-4 w-4" /> Security</motion.button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <HeroStat icon={ShieldCheck} label="Account safety score" value={o ? health.score : undefined} suffix="%"
              hint={o ? `${health.checks.filter((c) => !c.ok).length || 'No'} thing${health.checks.filter((c) => !c.ok).length === 1 ? '' : 's'} to fix` : undefined}
              tone={health.score >= 75 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : health.score >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}
              onClick={() => go('security')} />
            <HeroStat icon={Activity} label={`Changes I made · ${days} days`} value={o?.activity.actions} hint={o ? `${o.activity.actionsToday} today` : undefined}
              tone="bg-gradient-to-br from-[#e01a00] to-[#ff6a00]" onClick={() => go('activity')} />
            <HeroStat icon={CalendarCheck} label="Days I was active" value={o?.activity.daysActive} hint={o ? `of the last ${days} days` : undefined}
              tone="bg-gradient-to-br from-violet-500 to-fuchsia-600" onClick={() => go('overview')} />
            <HeroStat icon={LogIn} label="Sign-ins" value={o?.signIns.signIns} hint={o ? (o.signIns.failed ? `${o.signIns.failed} failed attempt${o.signIns.failed === 1 ? '' : 's'}` : 'no failed attempts') : undefined}
              tone="bg-gradient-to-br from-sky-400 to-indigo-600" onClick={() => go('security')} />
          </div>
        </div>
      </motion.section>

      <nav aria-label="Profile sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
        <div role="tablist" className="flex min-w-max gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => go(id)}
                className={cn('relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {on && <motion.span layoutId="profile-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#e01a00] to-[#ff6a00] shadow-md shadow-red-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                <Icon className="relative h-4 w-4" /><span className="relative">{label}</span>
                {id === 'security' && o && health.score < 75 && <span className="relative h-2 w-2 rounded-full bg-amber-400" aria-label="Needs attention" />}
              </button>
            )
          })}
        </div>
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'overview' && <ProfileOverview data={o} loading={overview.isLoading} days={days} onDays={setDays} health={health} go={go} />}
          {tab === 'account' && <AccountTab me={me.data} />}
          {tab === 'security' && <SecurityTab data={o} health={health} go={go} />}
          {tab === 'activity' && <ActivityTab areas={o?.areas ?? []} />}
          {tab === 'access' && <AccessTab />}
          {tab === 'preferences' && <PreferencesTab />}
        </ErrorBoundary>
      </motion.div>
    </div>
  )
}

export default ProfilePage
