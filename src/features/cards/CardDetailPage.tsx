import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowUpRight, CalendarClock, CalendarDays, CheckCircle2, Clock, Gift, HandCoins, IndianRupee, Layers, PieChart as PieIcon,
  Receipt, RefreshCw, ShoppingBag, Store, Tag, TrendingUp, UserRound, Users, UtensilsCrossed, Wallet, type LucideIcon,
} from 'lucide-react'
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErrorState } from '@/components/common/ErrorState'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { hasPermission } from '@/core/auth/auth'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative } from '@/utils/helpers/date'
import { AnimatedNumber, Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { formatCount, staggerContainer, riseIn, toNumber } from '@/features/dashboard/utils/dashboard-format'
import { formatInrFull, formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { UserAvatar } from '@/features/users/components/UserAvatar'
import { useCardInsights, type CardInsights } from './api/card-insights.api'
import { StrikeCardVisual } from './components/StrikeCardVisual'
import { bonusPercent, cardTheme, HOLDER_STATUS, validityLabel } from './utils/card-meta'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthLabel = (ym?: string) => {
  const [y, m] = (ym ?? '').split('-')
  return m ? `${MONTHS[Number(m) - 1]} ${y.slice(2)}` : ym ?? ''
}

export function CardDetailPage({ cardId }: { cardId: number }) {
  const insights = useCardInsights(cardId)
  const data = insights.data

  if (insights.isError) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <BackLink />
        <ErrorState title="Couldn't open this card" description="It may have been deleted, or the connection failed." onRetry={() => void insights.refetch()} />
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <BackLink />
        <button type="button" onClick={() => void insights.refetch()} aria-label="Refresh"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <RefreshCw className={cn('h-3.5 w-3.5', insights.isFetching && 'animate-spin')} /> Refresh
        </button>
      </div>

      <CardHero data={data} />
      <CardKpis data={data} loading={insights.isLoading} />

      <ErrorBoundary fallback={<TabError />}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2"><SalesTrend data={data} loading={insights.isLoading} /></div>
          <HolderMix data={data} loading={insights.isLoading} />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <WalletPanel data={data} loading={insights.isLoading} />
          <div className="xl:col-span-2"><RecentBuyers data={data} loading={insights.isLoading} /></div>
        </div>
        <div><CardRules data={data} loading={insights.isLoading} /></div>
      </ErrorBoundary>
    </motion.div>
  )
}

function BackLink() {
  return (
    <Link to="/cards" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> All cards
    </Link>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function CardHero({ data }: { data?: CardInsights }) {
  const card = data?.card
  const canVendor = hasPermission('SEC_VENDORS')
  if (!card) {
    return <Skeleton className="h-[340px] w-full rounded-3xl" />
  }
  const theme = cardTheme(card)
  const bonus = bonusPercent(card.cardPrice, card.walletAmount)
  const vendor = card.vendorName ?? card.storeName ?? (card.vendorId != null ? `Vendor #${card.vendorId}` : 'Unknown vendor')

  return (
    <motion.section variants={riseIn} className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl" style={{ background: theme.accent }} aria-hidden />
      <div className="auth-aurora pointer-events-none absolute inset-0 opacity-50" aria-hidden><span /><span /><span /></div>
      <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,440px)_1fr]">
        <div className="mx-auto w-full max-w-[440px]">
          <motion.div initial={{ opacity: 0, rotateY: -50, y: 30 }} animate={{ opacity: 1, rotateY: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.1 }}>
            <StrikeCardVisual card={card} size="lg" flippable />
          </motion.div>
          <p className="mt-3 text-center text-[11px] text-white/45">Tap the card to turn it over · move your mouse over it to tilt</p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              card.isActive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/70')}>
              <span className={cn('h-1.5 w-1.5 rounded-full', card.isActive ? 'animate-pulse bg-emerald-400' : 'bg-white/50')} />
              {card.isActive ? 'On sale in the app' : 'Paused — not on sale'}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white/70">#{card.id}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">{theme.label} style</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{card.name}</h1>
          {card.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">{card.description}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
            {canVendor && card.vendorId != null ? (
              <Link to="/vendors/$vendorId" params={{ vendorId: String(card.vendorId) }} search={{ tab: undefined }}
                className="inline-flex items-center gap-1.5 font-medium text-white hover:underline">
                <Store className="h-4 w-4" /> {vendor} <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Store className="h-4 w-4" /> {vendor}</span>
            )}
            {card.storeName && card.storeName !== vendor && <span className="inline-flex items-center gap-1.5"><Store className="h-4 w-4 opacity-60" /> {card.storeName}</span>}
            {card.createdAt && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 opacity-60" /> Created {formatDate(card.createdAt)}</span>}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <HeroFact icon={IndianRupee} label="Customer pays" value={formatInrFull(card.cardPrice)} />
            <HeroFact icon={Wallet} label="Gets to spend" value={formatInrFull(card.walletAmount)} />
            <HeroFact icon={Gift} label="Extra value" value={bonus > 0 ? `+${bonus}%` : '—'} highlight={bonus > 0} />
            <HeroFact icon={CalendarClock} label="Valid for" value={validityLabel(card.validityInDays)} />
          </div>

          {(data?.categories?.length ?? 0) > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-white/45">Works on</span>
              {data!.categories!.map((c) => (
                <span key={c.id} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/85">{c.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function HeroFact({ icon: Icon, label, value, highlight }: { icon: LucideIcon; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3 backdrop-blur-md', highlight && 'border-emerald-400/30 bg-emerald-400/10')}>
      <p className="flex items-center gap-1.5 text-[11px] text-white/55"><Icon className="h-3.5 w-3.5" /> {label}</p>
      <p className={cn('mt-1 text-lg font-bold tabular-nums', highlight ? 'text-emerald-300' : 'text-white')}>{value}</p>
    </div>
  )
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

function CardKpis({ data, loading }: { data?: CardInsights; loading: boolean }) {
  const s = data?.stats
  const spark = (data?.monthly ?? []).map((m) => toNumber(m.revenue))
  const tiles: { label: string; value: number; format?: (n: number) => string; icon: LucideIcon; tone: string; hint?: string }[] = [
    { label: 'Times sold', value: toNumber(s?.sold), icon: ShoppingBag, tone: 'from-amber-400 to-orange-600', hint: s?.lastSoldAt ? `last ${formatRelative(s.lastSoldAt)}` : 'not sold yet' },
    { label: 'Different buyers', value: toNumber(s?.buyers), icon: Users, tone: 'from-pink-400 to-rose-600' },
    { label: 'Revenue', value: toNumber(s?.revenue), format: formatInrShort, icon: IndianRupee, tone: 'from-emerald-400 to-teal-600', hint: spark.length > 1 ? undefined : 'after discounts' },
    { label: 'Average paid', value: toNumber(s?.averagePaid), format: formatInrFull, icon: Receipt, tone: 'from-sky-400 to-indigo-600', hint: toNumber(s?.discounts) > 0 ? `${formatInrShort(s?.discounts)} in discounts` : undefined },
    { label: 'Holding it now', value: toNumber(s?.active), icon: CheckCircle2, tone: 'from-lime-400 to-green-600' },
    { label: 'Expiring in 7 days', value: toNumber(s?.expiringSoon), icon: Clock, tone: 'from-violet-400 to-fuchsia-600' },
  ]
  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((t) => (
        <motion.div key={t.label} variants={riseIn} whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className={cn('pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-15 blur-xl', t.tone)} aria-hidden />
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', t.tone)}><t.icon className="h-4 w-4" /></span>
          {loading ? <Skeleton className="mt-3 h-7 w-20" /> : (
            <AnimatedNumber value={t.value} format={t.format ?? formatCount} className="mt-3 block text-2xl font-bold text-foreground" />
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{t.label}</p>
          {t.hint && <p className="mt-1 truncate text-[10px] text-muted-foreground/80">{t.hint}</p>}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Sales trend ──────────────────────────────────────────────────────────────

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const rev = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0
  const sold = payload.find((p) => p.dataKey === 'sold')?.value ?? 0
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{monthLabel(label)}</p>
      <p className="text-muted-foreground">Revenue <span className="ml-2 font-semibold text-foreground">{formatInrFull(rev)}</span></p>
      <p className="text-muted-foreground">Sold <span className="ml-2 font-semibold text-foreground">{sold}</span></p>
    </div>
  )
}

function SalesTrend({ data, loading }: { data?: CardInsights; loading: boolean }) {
  const accent = data?.card ? cardTheme(data.card).accent : '#ff6a00'
  const rows = (data?.monthly ?? []).map((m) => ({ month: m.month, revenue: toNumber(m.revenue), sold: toNumber(m.sold) }))
  return (
    <Panel title="Sales by month" subtitle="Revenue (bars) and cards sold (line), last 12 months" icon={<TrendingUp className="h-4 w-4" />} className="h-full">
      {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : rows.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No sales yet</div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="card-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis yAxisId="l" tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis yAxisId="r" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              <Bar yAxisId="l" dataKey="revenue" fill="url(#card-bar)" radius={[6, 6, 0, 0]} maxBarSize={38} animationDuration={1100} />
              <Line yAxisId="r" type="monotone" dataKey="sold" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} animationDuration={1300} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

// ── Holder status ────────────────────────────────────────────────────────────

function HolderMix({ data, loading }: { data?: CardInsights; loading: boolean }) {
  const [active, setActive] = useState<number>()
  const s = data?.stats
  const slices = (['ACTIVE', 'EXHAUSTED', 'EXPIRED', 'CANCELLED'] as const)
    .map((k) => ({ key: k, ...HOLDER_STATUS[k], value: toNumber(s?.[k.toLowerCase() as 'active' | 'exhausted' | 'expired' | 'cancelled']) }))
  const total = slices.reduce((t, x) => t + x.value, 0)
  const shown = slices.filter((x) => x.value > 0)
  const focus = active != null ? shown[active] : undefined
  return (
    <Panel title="Where every sold card is now" subtitle="Still in use, used up, expired or cancelled" icon={<PieIcon className="h-4 w-4" />} className="h-full">
      {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : total === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No one has bought it yet</div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-[170px] w-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={shown} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="92%" paddingAngle={shown.length > 1 ? 3 : 0}
                  cornerRadius={6} stroke="none" animationDuration={1100} animationBegin={150}
                  onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(undefined)}>
                  {shown.map((d, i) => (
                    <Cell key={d.key} fill={d.color} fillOpacity={active == null || active === i ? 1 : 0.25} style={{ transition: 'fill-opacity 250ms ease' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-foreground">{focus ? focus.value : total}</span>
              <span className="text-[11px] text-muted-foreground">{focus ? focus.label : 'sold'}</span>
            </div>
          </div>
          <ul className="grid w-full grid-cols-2 gap-2">
            {slices.map((x) => (
              <li key={x.key} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />{x.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{x.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

// ── Wallet money ─────────────────────────────────────────────────────────────

function WalletPanel({ data, loading }: { data?: CardInsights; loading: boolean }) {
  const s = data?.stats
  const issued = toNumber(s?.walletIssued)
  const spent = toNumber(data?.redemptions?.amount)
  const left = toNumber(s?.walletLeft)
  const pct = (n: number) => (issued > 0 ? Math.min(100, (n / issued) * 100) : 0)
  const rows = [
    { label: 'Spent at the store', value: spent, bar: 'from-emerald-400 to-teal-600' },
    { label: 'Still unspent (active cards)', value: left, bar: 'from-sky-400 to-indigo-600' },
  ]
  return (
    <Panel title="Wallet money" subtitle="Loaded, spent and still unspent" icon={<Wallet className="h-4 w-4" />} className="h-full">
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:from-amber-400/10 dark:to-orange-400/5">
            <p className="text-xs text-muted-foreground">Loaded onto buyers&apos; wallets</p>
            <AnimatedNumber value={issued} format={formatInrFull} className="mt-1 block text-2xl font-bold text-foreground" />
            <p className="mt-0.5 text-[11px] text-muted-foreground">{formatInrFull(data?.card.walletAmount)} × every card not cancelled</p>
          </div>
          {rows.map((r, i) => (
            <div key={r.label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{formatInrFull(r.value)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div className={cn('h-full rounded-full bg-gradient-to-r', r.bar)} initial={{ width: 0 }} animate={{ width: `${pct(r.value)}%` }}
                  transition={{ duration: 1.1, delay: 0.25 + i * 0.15, ease: 'easeOut' }} />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
            <MiniFact icon={HandCoins} label="Times used at store" value={formatCount(toNumber(data?.redemptions?.completed))} />
            <MiniFact icon={Tag} label="Refused uses" value={formatCount(toNumber(data?.redemptions?.refused))} />
          </div>
        </div>
      )}
    </Panel>
  )
}

function MiniFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

// ── Recent buyers ────────────────────────────────────────────────────────────

function RecentBuyers({ data, loading }: { data?: CardInsights; loading: boolean }) {
  const canOpen = hasPermission('SEC_USERS')
  const list = data?.recentBuyers ?? []
  return (
    <Panel title="Latest buyers" subtitle="The last people who bought this card and what's left on it" icon={<UserRound className="h-4 w-4" />} className="h-full">
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : list.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No one has bought this card yet</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {list.map((b, i) => {
            const st = HOLDER_STATUS[b.status] ?? { label: b.status, chip: 'bg-muted text-muted-foreground', color: '#999' }
            const name = b.name?.trim() || b.mobileNumber || (b.userId != null ? `Customer #${b.userId}` : 'Customer')
            const body = (
              <>
                <UserAvatar id={b.userId ?? b.subscriptionId} name={name} photo={b.profilePicUrl} className="h-10 w-10 rounded-full text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                    {name}
                    <span className={cn('rounded-full px-1.5 py-px text-[10px] font-semibold', st.chip)}>{st.label}</span>
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {b.purchasedAt ? `Bought ${formatRelative(b.purchasedAt)}` : 'Bought'}
                    {b.mobileNumber && b.name ? ` · ${b.mobileNumber}` : ''}
                    {b.couponCode ? ` · coupon ${b.couponCode}` : ''}
                    {b.expiresAt && b.status === 'ACTIVE' ? ` · expires ${formatDate(b.expiresAt)}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">{formatInrFull(b.paid)}</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">{formatInrFull(b.walletBalance)} left</p>
                </div>
              </>
            )
            return (
              <motion.li key={b.subscriptionId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + Math.min(i, 10) * 0.05 }}>
                {canOpen && b.userId != null ? (
                  <Link to="/users/$userId" params={{ userId: String(b.userId) }} search={{ tab: undefined }}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">{body}</Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl p-2">{body}</div>
                )}
              </motion.li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

// ── Rules & facts ────────────────────────────────────────────────────────────

function CardRules({ data, loading }: { data?: CardInsights; loading: boolean }) {
  const card = data?.card
  const s = data?.stats
  const facts: { icon: LucideIcon; label: string; value: string }[] = card ? [
    { icon: IndianRupee, label: 'Price', value: formatInrFull(card.cardPrice) },
    { icon: Wallet, label: 'Wallet value', value: formatInrFull(card.walletAmount) },
    { icon: CalendarClock, label: 'Validity', value: card.validityInDays ? `${card.validityInDays} days (${validityLabel(card.validityInDays)})` : 'No expiry' },
    { icon: Layers, label: 'Categories', value: data?.categories?.length ? data.categories.map((c) => c.name).join(', ') : 'All of the menu' },
    { icon: UtensilsCrossed, label: 'Specific menu items', value: data?.menuItemCount ? String(data.menuItemCount) : 'None' },
    { icon: Store, label: 'Store', value: [card.storeName, card.storeAddress].filter(Boolean).join(' · ') || (card.storeId != null ? `#${card.storeId}` : '—') },
    { icon: CalendarDays, label: 'Created', value: card.createdAt ? formatDate(card.createdAt) : '—' },
    { icon: RefreshCw, label: 'Last changed', value: card.updatedAt ? formatDate(card.updatedAt) : '—' },
    { icon: ShoppingBag, label: 'First sold', value: s?.firstSoldAt ? formatDate(s.firstSoldAt) : '—' },
    { icon: Clock, label: 'Last sold', value: s?.lastSoldAt ? `${formatDate(s.lastSoldAt)} (${formatRelative(s.lastSoldAt)})` : '—' },
  ] : []
  return (
    <Panel title="Card details" subtitle="How this card works and when things happened" icon={<Receipt className="h-4 w-4" />}>
      {loading ? <Skeleton className="h-32 w-full" /> : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><f.icon className="h-3.5 w-3.5" /></span>
              <div className="min-w-0">
                <dt className="text-[11px] text-muted-foreground">{f.label}</dt>
                <dd className="break-words text-sm font-medium text-foreground">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  )
}

export default CardDetailPage
