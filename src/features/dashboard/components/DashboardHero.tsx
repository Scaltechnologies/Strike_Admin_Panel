import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { formatDistanceToNowStrict } from 'date-fns'
import { ArrowUpRight, Bell, Clock, RefreshCw, ShieldCheck, Store, Wallet } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission } from '@/core/auth/auth'
import { ROLE_LABELS } from '@/constants/roles'
import { StrikeLogo } from '@/components/brand/StrikeLogo'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './dashboard-ui'
import { formatInr, riseIn } from '../utils/dashboard-format'

interface DashboardHeroProps {
  todayRevenue?: number
  todayPayments?: number
  pendingVendors?: number
  pendingWithdrawals?: number
  updatedAt: number
  refreshing: boolean
  onRefresh: () => void
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function DashboardHero({
  todayRevenue, todayPayments, pendingVendors = 0, pendingWithdrawals = 0, updatedAt, refreshing, onRefresh,
}: DashboardHeroProps) {
  const user = useAuthStore((s) => s.user)
  const now = useNow(1000)
  const hour = now.getHours()
  const greeting = hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0]
  const role = user ? (ROLE_LABELS[user.role] ?? user.role) : ''

  const actions = [
    { to: '/vendors', label: 'Review vendors', icon: Store, badge: pendingVendors, perm: 'SEC_VENDORS' },
    { to: '/withdrawals', label: 'Withdrawals', icon: Wallet, badge: pendingWithdrawals, perm: 'SEC_WITHDRAWALS' },
    { to: '/notifications', label: 'Send notification', icon: Bell, badge: 0, perm: 'SEC_NOTIFICATIONS' },
    { to: '/audit-logs', label: 'Audit logs', icon: ShieldCheck, badge: 0, perm: 'SEC_AUDIT_LOGS' },
  ].filter((a) => hasPermission(a.perm))

  return (
    <motion.section
      variants={riseIn}
      className="relative overflow-hidden rounded-3xl bg-[#0b0c10] text-white shadow-xl shadow-black/10"
    >
      <div className="auth-aurora pointer-events-none absolute inset-0 opacity-80" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" aria-hidden />
      <StrikeLogo className="auth-float pointer-events-none absolute -right-6 -top-6 h-48 w-48 opacity-[0.18] blur-[1px] sm:h-60 sm:w-60" />

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/60">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
            <span>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="tabular-nums">· {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}{firstName ? ', ' : ''}<span className="text-bolt-gradient">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Here&apos;s what&apos;s happening across Strike right now{role ? ` · ${role}` : ''}
          </p>

          {actions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {actions.map(({ to, label, icon: Icon, badge }) => (
                <Link key={to} to={to}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/85 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.12] hover:text-white">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                  {badge > 0 && (
                    <span className="rounded-full bg-gradient-to-r from-[#ff8a00] to-[#e01a00] px-1.5 py-px text-[10px] font-bold text-white shadow shadow-orange-600/40">
                      {badge}
                    </span>
                  )}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Today&apos;s revenue</p>
            <p className="mt-1 text-2xl font-bold">
              {todayRevenue == null ? '—' : <AnimatedNumber value={todayRevenue} format={formatInr} />}
            </p>
            <p className="mt-0.5 text-xs text-white/55">
              {todayPayments == null ? ' ' : <><AnimatedNumber value={todayPayments} /> payment{todayPayments === 1 ? '' : 's'} today</>}
            </p>
          </div>
          <button type="button" onClick={onRefresh}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white">
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} aria-hidden />
            <span className="flex flex-col items-start leading-tight">
              <span className="font-medium text-white/80">{refreshing ? 'Updating…' : 'Refresh'}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                {updatedAt ? `Updated ${formatDistanceToNowStrict(updatedAt, { addSuffix: true })}` : 'Auto-updates every minute'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </motion.section>
  )
}
