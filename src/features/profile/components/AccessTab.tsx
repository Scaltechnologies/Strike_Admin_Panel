import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowUpRight, Crown, Info, Lock, ShieldCheck, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { SECTIONS, SECTION_NOTES } from '@/constants/sections'
import { Panel } from '@/features/dashboard/components/dashboard-ui'

const GROUPS = Array.from(new Set(SECTIONS.map((s) => s.group)))

export function AccessTab() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  const isSuper = user.role === 'SUPER_ADMIN'
  const mine = new Set(user.permissions)
  const can = (code: string) => isSuper || mine.has(code)
  const count = SECTIONS.filter((s) => can(s.code)).length
  const pct = Math.round((count / SECTIONS.length) * 100)

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={cn('flex flex-wrap items-center gap-4 rounded-2xl border p-5',
          isSuper ? 'border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-400/20 dark:from-amber-400/5 dark:to-orange-400/5' : 'border-border bg-card')}>
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg',
          isSuper ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/30' : 'bg-gradient-to-br from-sky-400 to-indigo-600 shadow-indigo-500/30')}>
          {isSuper ? <Crown className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">{isSuper ? 'You’re a Super Admin' : `You can open ${count} of ${SECTIONS.length} sections`}</p>
          <p className="text-sm text-muted-foreground">
            {isSuper ? 'You can open every section and also add, change and switch off other admins.'
              : 'In each section you can open, you can both view and make changes. Ask a Super Admin if you need more.'}
          </p>
        </div>
        <div className="w-full sm:w-48">
          <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Access</span><span className="font-semibold text-foreground">{pct}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#e01a00] to-[#ff6a00]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((group, gi) => {
          const items = SECTIONS.filter((s) => s.group === group)
          return (
            <Panel key={group} title={group} subtitle={`${items.filter((s) => can(s.code)).length} of ${items.length} open to you`}>
              <ul className="space-y-1.5">
                {items.map((s, i) => {
                  const ok = can(s.code)
                  const note = SECTION_NOTES[s.code]
                  const body = (
                    <>
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                        {ok ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm font-medium', ok ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
                        {note && <span className="block text-xs text-muted-foreground">{note}</span>}
                      </span>
                      {ok ? <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        : <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">No access</span>}
                    </>
                  )
                  return (
                    <motion.li key={s.code} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: gi * 0.04 + i * 0.03 }}>
                      {ok ? <Link to={s.paths[0]} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50">{body}</Link>
                        : <div className="flex items-center gap-3 rounded-xl p-2 opacity-70">{body}</div>}
                    </motion.li>
                  )
                })}
              </ul>
            </Panel>
          )
        })}
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Profile is always open to every admin. Access changes made by a Super Admin apply on your next page load.
      </p>
    </div>
  )
}
