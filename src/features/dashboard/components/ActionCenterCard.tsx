import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { formatDistanceToNowStrict, isValid } from 'date-fns'
import { parseServerDate } from '@/utils/helpers/date'
import { BellRing, CheckCircle2, ChevronRight, Percent, Store, Wallet } from 'lucide-react'
import { hasPermission } from '@/core/auth/auth'
import { cn } from '@/lib/utils'
import type { DashboardData } from '../types/dashboard.types'
import { AnimatedNumber, Panel, Skeleton } from './dashboard-ui'
import { formatInrCompact, toNumber } from '../utils/dashboard-format'

const ago = (iso: string) => {
  const d = parseServerDate(iso)
  return isValid(d) ? formatDistanceToNowStrict(d, { addSuffix: true }) : ''
}

export function ActionCenterCard({ data, loading }: { data?: DashboardData; loading: boolean }) {
  const pendingVendors = toNumber(data?.pendingActions?.pendingVendors ?? data?.stats?.vendors?.pending)
  const pendingWithdrawals = toNumber(data?.pendingActions?.pendingWithdrawals)
  const toSettle = toNumber(data?.revenue?.commissionPending ?? data?.stats?.pendingCommission)
  const approvals = (data?.pendingApprovals ?? []).slice(0, 4)
  const canVendors = hasPermission('SEC_VENDORS')
  const canWithdrawals = hasPermission('SEC_WITHDRAWALS')
  const allClear = pendingVendors === 0 && pendingWithdrawals === 0

  const tiles = [
    { label: 'Vendors to approve', value: pendingVendors, icon: Store, to: canVendors ? '/vendors' : undefined, tone: 'from-amber-400 to-orange-500', format: undefined },
    { label: 'Withdrawals to review', value: pendingWithdrawals, icon: Wallet, to: canWithdrawals ? '/withdrawals' : undefined, tone: 'from-violet-500 to-fuchsia-600', format: undefined },
    { label: 'Commission to settle', value: toSettle, icon: Percent, to: undefined, tone: 'from-emerald-500 to-teal-600', format: formatInrCompact },
  ]

  return (
    <Panel
      title="Needs your attention"
      subtitle={allClear && !loading ? 'Nothing waiting right now' : 'Waiting for a decision'}
      icon={<BellRing className="h-4 w-4" />}
      className="h-full"
    >
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-24 w-full" /></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {tiles.map(({ label, value, icon: Icon, to, tone, format }) => {
              const body = (
                <>
                  <span className={cn('mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow', tone)}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <p className="text-lg font-bold leading-none text-foreground">
                    <AnimatedNumber value={value} format={format} />
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
                  {value > 0 && !format && (
                    <span className="absolute right-2 top-2 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                    </span>
                  )}
                </>
              )
              const cls = 'relative rounded-xl border border-border bg-background/60 p-3 transition-all'
              return to ? (
                <Link key={label} to={to} className={cn(cls, 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md')}>{body}</Link>
              ) : (
                <div key={label} className={cls}>{body}</div>
              )
            })}
          </div>

          {approvals.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Newest sign-ups to approve</p>
              <ul className="space-y-1">
                {approvals.map((v, i) => (
                  <motion.li key={v.vendorId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
                    {(() => {
                      const content = (
                        <>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                            {(v.hotelName || '?').slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{v.hotelName || `Vendor #${v.vendorId}`}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {[v.mobile, ago(v.registeredAt)].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          {canVendors && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}
                        </>
                      )
                      return canVendors ? (
                        <Link to="/vendors" className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">{content}</Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl p-2">{content}</div>
                      )
                    })()}
                  </motion.li>
                ))}
              </ul>
            </div>
          ) : allClear ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 rounded-xl bg-emerald-50 py-6 text-center dark:bg-emerald-400/5">
              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.2 }}>
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </motion.span>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">All caught up</p>
              <p className="text-xs text-muted-foreground">No vendors or withdrawals are waiting.</p>
            </motion.div>
          ) : null}
        </div>
      )}
    </Panel>
  )
}
