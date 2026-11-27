import { format, parseISO } from 'date-fns'
import { Activity, AlertTriangle, ShieldCheck, Store, UserCog, Users, type LucideIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import type { AuditActorType, AuditStats } from '../types/audit-log.types'
import { ACTOR_TYPES, humanize, initials } from '../utils/audit-display'

interface AuditOverviewProps {
  stats: AuditStats | undefined
  loading: boolean
  activeActorType?: AuditActorType
  onActorType: (type: AuditActorType | undefined) => void
  onFailedOnly: () => void
  onAction: (action: string) => void
  onActor: (email: string) => void
}

const nf = new Intl.NumberFormat()

function StatCard({
  icon: Icon, label, value, hint, tone, active, onClick, loading,
}: {
  icon: LucideIcon; label: string; value: number | undefined; hint?: string; tone: string
  active?: boolean; onClick?: () => void; loading: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all',
        onClick && 'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'ring-2 ring-primary/60',
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">{nf.format(value ?? 0)}</p>
          )}
          {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Comp>
  )
}

function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string; unit: 'hour' | 'day'
}) {
  if (!active || !payload?.length || !label) return null
  const ok = payload.find((p) => p.dataKey === 'ok')?.value ?? 0
  const failed = payload.find((p) => p.dataKey === 'failed')?.value ?? 0
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1 font-semibold text-foreground">{format(parseISO(label), unit === 'hour' ? 'MMM d, HH:00' : 'EEE, MMM d')}</p>
      <p className="text-muted-foreground"><span className="font-semibold text-foreground">{ok + failed}</span> actions</p>
      {failed > 0 && <p className="text-red-600 dark:text-red-400">{failed} failed</p>}
    </div>
  )
}

export function AuditOverview({ stats, loading, activeActorType, onActorType, onFailedOnly, onAction, onActor }: AuditOverviewProps) {
  const timeline = (stats?.timeline ?? []).map((b) => ({ bucket: b.bucket, ok: b.total - b.failed, failed: b.failed }))
  const unit = stats?.bucketUnit ?? 'hour'
  const byType: Record<AuditActorType, number | undefined> = {
    ADMIN: stats?.admins, STORE_OWNER: stats?.storeOwners, STORE_MANAGER: stats?.storeManagers,
  }
  const typeIcon: Record<AuditActorType, LucideIcon> = { ADMIN: ShieldCheck, STORE_OWNER: Store, STORE_MANAGER: UserCog }
  const typeTone: Record<AuditActorType, string> = {
    ADMIN: 'bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
    STORE_OWNER: 'bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300',
    STORE_MANAGER: 'bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Activity} label="Total actions" value={stats?.total} loading={loading}
          tone="bg-gradient-to-br from-[#ffc400] via-[#ff6a00] to-[#e01a00] text-white shadow-md shadow-orange-500/30"
          onClick={() => onActorType(undefined)} />
        {ACTOR_TYPES.map((t) => (
          <StatCard key={t.value} icon={typeIcon[t.value]} label={t.label} value={byType[t.value]} loading={loading}
            tone={typeTone[t.value]} active={activeActorType === t.value}
            onClick={() => onActorType(activeActorType === t.value ? undefined : t.value)} />
        ))}
        <StatCard icon={AlertTriangle} label="Failed" value={stats?.failed} loading={loading}
          hint={stats && stats.failedSignIns > 0 ? `${stats.failedSignIns} failed sign-in${stats.failedSignIns === 1 ? '' : 's'}` : 'Refused or errored'}
          tone="bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-300" onClick={onFailedOnly} />
        <StatCard icon={Users} label="People active" value={stats?.activePeople} loading={loading}
          tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Activity</h3>
              <p className="text-xs text-muted-foreground">Actions per {unit}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff6a00]" />Succeeded</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Failed</span>
            </div>
          </div>
          {loading && !stats ? (
            <div className="min-h-[220px] flex-1 animate-pulse rounded-xl bg-muted/60" />
          ) : timeline.length === 0 ? (
            <div className="flex min-h-[220px] flex-1 items-center justify-center text-sm text-muted-foreground">No activity in this period</div>
          ) : (
            <div className="min-h-[220px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="audit-ok" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb000" />
                    <stop offset="100%" stopColor="#ff5a00" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} minTickGap={24}
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  tickFormatter={(v: string) => format(parseISO(v), unit === 'hour' ? 'HH:mm' : 'MMM d')} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44}
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.6 }} content={<ChartTooltip unit={unit} />} />
                <Bar dataKey="ok" stackId="a" fill="url(#audit-ok)" radius={[0, 0, 0, 0]} maxBarSize={28} />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Most active people</h3>
            <ul className="space-y-1">
              {(stats?.topActors ?? []).slice(0, 4).map((a) => {
                const name = a.actorName?.trim() || a.actorEmail
                return (
                  <li key={`${a.actorType}-${a.actorEmail}`}>
                    <button type="button" onClick={() => onActor(a.actorEmail)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left hover:bg-muted">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {initials(name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{name}</span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">{nf.format(a.count)}</span>
                    </button>
                  </li>
                )
              })}
              {stats && stats.topActors.length === 0 && <li className="text-sm text-muted-foreground">Nobody yet</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Most common actions</h3>
            <ul className="space-y-2">
              {(stats?.topActions ?? []).slice(0, 4).map((a) => {
                const max = stats?.topActions[0]?.count ?? 1
                return (
                  <li key={a.action}>
                    <button type="button" onClick={() => onAction(a.action)} className="w-full text-left">
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-foreground hover:underline">{humanize(a.action)}</span>
                        <span className="ml-2 tabular-nums text-muted-foreground">{nf.format(a.count)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#ffc400] to-[#ff5a00]"
                          style={{ width: `${Math.max(6, (a.count / max) * 100)}%` }} />
                      </div>
                    </button>
                  </li>
                )
              })}
              {stats && stats.topActions.length === 0 && <li className="text-sm text-muted-foreground">Nothing yet</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
