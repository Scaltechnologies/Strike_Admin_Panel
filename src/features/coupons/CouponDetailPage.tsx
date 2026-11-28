import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle, ArrowLeft, CalendarRange, Check, Clock, ExternalLink, Globe2, IndianRupee, ListChecks, Loader2, Pause, Pencil, Play, Store, TrendingUp, Users, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { useApproveRequest, useCouponDetails, usePauseCoupon, useRejectRequest } from './api/coupon-insights.api'
import { CouponEditor } from './components/CouponEditor'
import { CopyCode } from './components/CouponTicket'
import { STATE_META, discountBig, discountText, money, rulesText, whenText } from './utils/coupon-meta'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

function Stat({ icon: Icon, label, value, money: isMoney, format, sub, delay }: { icon: LucideIcon; label: string; value: number; money?: boolean; format?: (n: number) => string; sub?: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -3 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
      <AnimatedNumber value={value} format={format ?? (isMoney ? (n) => money(n) : undefined)} className="mt-1 block text-xl font-bold text-foreground" />
      {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
    </motion.div>
  )
}

export function CouponDetailPage({ couponId }: { couponId: number }) {
  const details = useCouponDetails(couponId)
  const pause = usePauseCoupon()
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState('')
  const d = details.data

  if (details.isLoading) return <div className="flex flex-col gap-4 p-6">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />)}</div>
  if (!d) {
    return (
      <div className="flex flex-col items-center gap-3 p-16 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">This coupon couldn&apos;t be loaded.</p>
        <Link to="/coupons" search={{}} className="text-sm font-medium text-primary hover:underline">Back to coupons</Link>
      </div>
    )
  }

  const c = d.coupon
  const s = STATE_META[c.state] ?? STATE_META.LIVE
  const t = d.totals
  const used = Number(c.usedCount ?? 0)
  const pct = c.maxUses ? Math.min(100, (used / c.maxUses) * 100) : null

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <Link to="/coupons" search={{}} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All coupons</Link>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col overflow-hidden rounded-3xl bg-[#0b0c10] text-white shadow-xl md:flex-row">
        <div className={cn('relative flex flex-col items-center justify-center gap-1 bg-gradient-to-br px-10 py-8', s.ticket)}>
          <span className="text-5xl font-black tracking-tight">{discountBig(c)}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">off</span>
          {c.discountType === 'PERCENTAGE' && c.maxDiscountAmount && <span className="text-xs text-white/80">up to {money(c.maxDiscountAmount)}</span>}
          <span className="absolute -right-2.5 top-0 hidden h-full flex-col justify-around py-2 md:flex" aria-hidden>
            {Array.from({ length: 9 }).map((_, k) => <span key={k} className="h-5 w-5 rounded-full bg-[#0b0c10]" />)}
          </span>
        </div>
        <div className="relative flex flex-1 flex-col gap-4 p-6 sm:p-7">
          <div className="auth-aurora pointer-events-none absolute inset-0 opacity-40" aria-hidden><span /><span /><span /></div>
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold')}><span className={cn('h-1.5 w-1.5 rounded-full', s.dot, c.state === 'LIVE' && 'animate-pulse')} />{s.label}</span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{c.title}</h1>
              {c.description && <p className="mt-0.5 text-sm text-white/60">{c.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <CopyCode code={c.code} light className="text-base" />
                <span className="inline-flex items-center gap-1 text-xs text-white/60">{c.vendorId ? <Store className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}{c.vendorId ? c.storeName || c.vendorName || `Vendor #${c.vendorId}` : 'Every store'}</span>
                <span className="inline-flex items-center gap-1 text-xs text-white/60"><Clock className="h-3.5 w-3.5" />{whenText(c)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.state === 'WAITING' ? (
                <button type="button" onClick={() => approve.mutate(c.id)} disabled={approve.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold shadow-lg disabled:opacity-60">
                  {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                </button>
              ) : c.state !== 'REJECTED' && (
                <button type="button" onClick={() => pause.mutate({ id: c.id, pause: c.isActive })} disabled={pause.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-60">
                  {c.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {c.isActive ? 'Pause' : 'Switch on'}
                </button>
              )}
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0b0c10]">
                <Pencil className="h-4 w-4" /> Edit
              </button>
            </div>
          </div>
          <p className="relative z-10 text-xs text-white/55">{discountText(c)} · {rulesText(c)}</p>
          {c.state === 'REJECTED' && c.rejectionReason && <p className="relative z-10 rounded-xl bg-red-500/20 px-3 py-2 text-sm">Turned down: {c.rejectionReason}</p>}
          {c.state === 'WAITING' && (
            <div className="relative z-10 flex flex-wrap gap-2">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or turn it down — tell the store why"
                className="min-w-[240px] flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40" />
              <button type="button" disabled={!reason.trim() || reject.isPending} onClick={() => reject.mutate({ id: c.id, reason: reason.trim() })}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Turn down</button>
            </div>
          )}
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Users} label="Times used" value={used} sub={c.maxUses ? `${c.maxUses - used} of ${c.maxUses} left` : 'No limit'} delay={0} />
        <Stat icon={IndianRupee} label="Customers saved" value={Number(t?.discount ?? 0)} money sub={t ? `${money(t.average_discount)} on average` : undefined} delay={0.04} />
        <Stat icon={TrendingUp} label="Sales with it" value={Number(t?.revenue ?? 0)} money sub={t ? `${money(t.full_price)} before discount` : undefined} delay={0.08} />
        <Stat icon={Users} label="Different customers" value={Number(t?.customers ?? 0)} delay={0.12} />
        <Stat icon={CalendarRange} label="Runs for (days)" value={Math.max(1, Math.round((new Date(c.validUntil).getTime() - new Date(c.validFrom).getTime()) / 86_400_000))} sub={`${new Date(c.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(c.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`} delay={0.16} />
        <Stat icon={Clock} label="Average discount" value={t && Number(t.full_price) > 0 ? (Number(t.discount) / Number(t.full_price)) * 100 : 0} format={(n) => `${n.toFixed(1)}%`} sub={t?.last_used ? `last used ${formatRelative(t.last_used)}` : 'Never used'} delay={0.2} />
      </div>

      {pct != null && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex justify-between text-xs"><span className="font-medium text-foreground">Customers allowed</span><span className="tabular-nums text-muted-foreground">{used} / {c.maxUses}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className={cn('h-full rounded-full', pct >= 90 ? 'bg-[#ec4647]' : pct >= 70 ? 'bg-[#f2a600]' : 'bg-[#00b894]')} />
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Uses each day</h2>
          <p className="mb-3 text-xs text-muted-foreground">Since it started (up to the last 120 days)</p>
          <div className="h-56">
            {(d.series?.length ?? 0) === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No uses yet.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} tick={axis} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
                  <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} labelFormatter={(l) => dayLabel(String(l))}
                    formatter={(v, _n, p) => [`${v} use${Number(v) === 1 ? '' : 's'} · ${money((p.payload as { discount: number }).discount)} saved`, '']} />
                  <Bar dataKey="uses" fill="#257de0" radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground"><Store className="h-4 w-4 text-primary" /> Where it was used</h2>
          {(d.stores?.length ?? 0) === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Not used at any store yet.</p> : (
            <ul className="space-y-2.5">
              {d.stores!.map((st) => {
                const max = Math.max(...d.stores!.map((x) => Number(x.uses)))
                return (
                  <li key={st.id}>
                    <div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate font-medium">{st.name}</span><span className="shrink-0 tabular-nums"><b>{st.uses}</b> · {money(st.discount)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${(Number(st.uses) / max) * 100}%` }} className="h-full rounded-full bg-[#257de0]" /></div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground"><ListChecks className="h-4 w-4 text-primary" /> Latest uses</h2>
        {(d.recent?.length ?? 0) === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nobody has used this coupon yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-2 py-2 font-medium">Customer</th><th className="px-2 py-2 font-medium">Store · card</th>
                <th className="px-2 py-2 text-right font-medium">Full price</th><th className="px-2 py-2 text-right font-medium">Saved</th><th className="px-2 py-2 text-right font-medium">Paid</th><th className="px-2 py-2 font-medium">When</th><th />
              </tr></thead>
              <tbody>
                {d.recent!.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-2 py-2"><span className="block font-medium">{u.customerName || `Customer #${u.userId}`}</span>{u.customerMobile && <span className="text-xs text-muted-foreground">{u.customerMobile}</span>}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{[u.storeName, u.cardName].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{money(u.originalAmount)}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums text-emerald-600">−{money(u.discountApplied)}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{money(u.finalAmount)}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground" title={formatDateTime(u.usedAt)}>{formatRelative(u.usedAt)}</td>
                    <td className="px-2 py-2">{u.paymentId && <Link to="/payments/$paymentId" params={{ paymentId: String(u.paymentId) }} title="Open payment" className="text-muted-foreground hover:text-primary"><ExternalLink className="h-3.5 w-3.5" /></Link>}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CouponEditor open={editing} coupon={c} onClose={() => setEditing(false)} />
    </div>
  )
}

export default CouponDetailPage
