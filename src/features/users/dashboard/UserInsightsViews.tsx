import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle, BadgePercent, ChevronLeft, ChevronRight, CreditCard, Crown, HandCoins, Receipt, ShoppingBag, Store, TrendingUp, Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { formatDateTime } from '@/utils/helpers/date'
import { AnimatedNumber, Panel, Skeleton, Sparkline } from '@/features/dashboard/components/dashboard-ui'
import { riseIn, staggerContainer, toNumber } from '@/features/dashboard/utils/dashboard-format'
import { avatarGradient, formatInrFull, formatInrShort, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import type { PurchasePage, UserInsights } from '../api/user-insights.api'

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return y && m ? new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : ym
}
const count = (n: number) => Math.round(n).toLocaleString('en-IN')

function Tile({ icon: Icon, label, value, format, sub, gradient, children }: {
  icon: LucideIcon; label: string; value: number; format: (n: number) => string; sub?: React.ReactNode; gradient: string; children?: React.ReactNode
}) {
  return (
    <motion.div variants={riseIn} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.05] dark:hover:shadow-black/30">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110', gradient)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="-mt-1 text-2xl font-bold tracking-tight text-foreground"><AnimatedNumber value={value} format={format} /></p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
      {children}
    </motion.div>
  )
}

export function UserKpis({ data, loading }: { data?: UserInsights; loading: boolean }) {
  if (loading || !data) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
  }
  const spark = (data.monthly ?? []).map((m) => toNumber(m.spent))
  const cards = data.cards
  const red = data.redemptions
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Tile icon={ShoppingBag} label="Total spent" value={toNumber(data.totalSpent)} format={formatInrShort} gradient="from-[#ffc400] via-[#ff6a00] to-[#e01a00]"
        sub={`${count(toNumber(data.purchases))} card purchase${toNumber(data.purchases) === 1 ? '' : 's'}`}>
        {spark.length > 1 && <div className="-mb-1 mt-2"><Sparkline values={spark} color="#ff6a00" /></div>}
      </Tile>
      <Tile icon={Receipt} label="Average purchase" value={toNumber(data.averageOrder)} format={formatInrShort} gradient="from-violet-500 to-fuchsia-600"
        sub={data.lastPurchaseAt ? <>Last on {formatDateTime(data.lastPurchaseAt)}</> : 'No purchases yet'} />
      <Tile icon={Wallet} label="Wallet balance" value={toNumber(cards?.walletBalance)} format={formatInrShort} gradient="from-sky-400 to-indigo-600"
        sub={cards ? (
          toNumber(cards.expiringSoon) > 0
            ? <span className="font-medium text-amber-600 dark:text-amber-400">{cards.expiringSoon} card{cards.expiringSoon === 1 ? '' : 's'} expire within a week</span>
            : `${cards.active} active of ${cards.total} cards`
        ) : undefined} />
      <Tile icon={HandCoins} label="Used at stores" value={toNumber(red?.amount)} format={formatInrShort} gradient="from-emerald-400 to-teal-600"
        sub={red ? `${count(red.completed)} redemption${red.completed === 1 ? '' : 's'}${red.pending ? ` · ${red.pending} waiting` : ''}` : undefined} />
      <Tile icon={BadgePercent} label="Saved with offers" value={toNumber(data.discountsSaved)} format={formatInrShort} gradient="from-pink-400 to-rose-600"
        sub={toNumber(data.refunds) > 0 ? <span className="font-medium text-red-600 dark:text-red-400">{data.refunds} refund{data.refunds === 1 ? '' : 's'} · {formatInrShort(toNumber(data.refundedAmount))}</span> : 'Coupons and discounts'} />
    </motion.div>
  )
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? 0
  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-1.5 font-semibold text-foreground">{monthLabel(label)}</p>
      <p className="text-muted-foreground">Spent <span className="font-semibold text-foreground">{formatInrFull(get('spent'))}</span></p>
      <p className="text-muted-foreground">Cards bought <span className="font-semibold text-foreground">{get('purchases')}</span></p>
    </div>
  )
}

export function UserSpendTrend({ data, loading }: { data?: UserInsights; loading: boolean }) {
  const rows = (data?.monthly ?? []).map((m) => ({ month: m.month, spent: toNumber(m.spent), purchases: toNumber(m.purchases) }))
  return (
    <Panel title="Spending by month" subtitle="Money spent on cards (bars) and cards bought (line)" icon={<TrendingUp className="h-4 w-4" />} className="h-full">
      {loading ? <Skeleton className="h-[240px] w-full rounded-xl" /> : rows.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">Hasn&apos;t bought a card yet</div>
      ) : (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="user-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis yAxisId="l" tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis yAxisId="r" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              <Bar yAxisId="l" dataKey="spent" fill="url(#user-bar)" radius={[6, 6, 0, 0]} maxBarSize={34} animationDuration={1100} />
              <Line yAxisId="r" type="monotone" dataKey="purchases" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} animationDuration={1300} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

export function FavouriteVendors({ data, loading }: { data?: UserInsights; loading: boolean }) {
  const list = data?.favouriteVendors ?? []
  const max = Math.max(1, ...list.map((v) => toNumber(v.spent)))
  const canOpen = hasPermission('SEC_VENDORS')
  const methods = data?.paymentMethods ?? []
  const methodTotal = methods.reduce((s, m) => s + toNumber(m.amount), 0)
  return (
    <Panel title="Favourite vendors" subtitle="Where they spend the most" icon={<Crown className="h-4 w-4" />} className="h-full">
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div> : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No purchases yet</p>
      ) : (
        <>
          <ol className="space-y-1.5">
            {list.map((v, i) => {
              const body = (
                <>
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow', avatarGradient(v.vendorId ?? i))}>
                    {vendorInitials(v.name ?? `V ${v.vendorId}`)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{v.name ?? `Vendor #${v.vendorId}`}</span>
                      <span className="shrink-0 text-sm font-semibold text-foreground">{formatInrShort(v.spent)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <motion.span className="block h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-600" initial={{ width: 0 }}
                          animate={{ width: `${(toNumber(v.spent) / max) * 100}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.08 }} />
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{v.purchases} bought</span>
                    </span>
                  </span>
                </>
              )
              return (
                <motion.li key={v.vendorId ?? i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                  {canOpen && v.vendorId != null ? (
                    <Link to="/vendors/$vendorId" params={{ vendorId: String(v.vendorId) }} search={{ tab: undefined }}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">{body}</Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl p-2">{body}</div>
                  )}
                </motion.li>
              )
            })}
          </ol>
          {methods.length > 0 && (
            <div className="mt-4 rounded-xl bg-muted/50 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">How they pay</p>
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {methods.map((m) => (
                  <motion.span key={m.method} className={m.method === 'PAY_AT_STORE' ? 'bg-[#ff6a00]' : 'bg-indigo-500'}
                    initial={{ width: 0 }} animate={{ width: `${methodTotal ? (toNumber(m.amount) / methodTotal) * 100 : 0}%` }} transition={{ duration: 1, delay: 0.3 }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {methods.map((m) => (
                  <span key={m.method} className="flex items-center gap-1.5 text-muted-foreground">
                    {m.method === 'PAY_AT_STORE' ? <Store className="h-3.5 w-3.5 text-[#ff6a00]" /> : <CreditCard className="h-3.5 w-3.5 text-indigo-500" />}
                    {m.method === 'PAY_AT_STORE' ? 'At store' : 'Online'} <span className="font-semibold text-foreground">{m.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

const PURCHASE_STATUS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  REFUNDED: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
}

export function PurchasesTable({ data, loading, page, onPage }: { data?: PurchasePage; loading: boolean; page: number; onPage: (p: number) => void }) {
  const rows = data?.content ?? []
  const canVendors = hasPermission('SEC_VENDORS')
  if (loading && rows.length === 0) return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  if (rows.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No card purchases yet</p>
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2.5">When</th><th className="px-3 py-2.5">Card</th><th className="px-3 py-2.5">Vendor</th>
              <th className="px-3 py-2.5 text-right">Price</th><th className="px-3 py-2.5 text-right">Discount</th><th className="px-3 py-2.5 text-right">Paid</th>
              <th className="px-3 py-2.5">How</th><th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{p.createdAt ? formatDateTime(p.createdAt) : '—'}</td>
                <td className="px-3 py-2.5 font-medium text-foreground">{p.cardName ?? '—'}<span className="ml-1 text-[11px] font-normal text-muted-foreground">#{p.id}</span></td>
                <td className="px-3 py-2.5">
                  {canVendors && p.vendorId != null ? (
                    <Link to="/vendors/$vendorId" params={{ vendorId: String(p.vendorId) }} search={{ tab: undefined }} className="text-primary hover:underline">{p.vendorName ?? `Vendor #${p.vendorId}`}</Link>
                  ) : (p.vendorName ?? (p.vendorId != null ? `Vendor #${p.vendorId}` : '—'))}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{formatInrFull(p.cardPrice)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {toNumber(p.discount) > 0 ? <span className="text-emerald-600 dark:text-emerald-400">−{formatInrFull(p.discount)}{p.couponCode && <span className="ml-1 rounded bg-emerald-100 px-1 font-mono text-[10px] dark:bg-emerald-400/10">{p.couponCode}</span>}</span> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">{formatInrFull(p.amountPaid)}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.paymentMethod === 'PAY_AT_STORE' ? 'At store' : 'Online'}</td>
                <td className="px-3 py-2.5">
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', PURCHASE_STATUS[p.status] ?? 'bg-muted text-muted-foreground')}>{p.status.toLowerCase()}</span>
                  {p.refundReason && <span className="ml-1 inline-flex items-center gap-0.5 text-[11px] text-muted-foreground" title={p.refundReason}><AlertTriangle className="h-3 w-3" />{p.refundReason.slice(0, 24)}</span>}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {(data?.totalPages ?? 0) > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{data?.totalElements} purchases</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0} aria-label="Previous page" className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <span className="px-2 tabular-nums">{page + 1} / {data?.totalPages}</span>
            <button type="button" onClick={() => onPage(page + 1)} disabled={page >= (data?.totalPages ?? 1) - 1} aria-label="Next page" className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
