import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Calculator, History, Info, Percent, Save, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { formatInrFull, formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { useApplyDefaultRate, useSaveDefaultRate, type SettingsOverview } from '../api/settings-overview.api'
import { useGlobalCommissionRateHistory } from '../hooks/useSettings'
import { Card, ChangedStamp, Explain, SectionHead } from './SettingsBits'

const pct = (n: number) => `${Number(n.toFixed(2))}%`

function RateEditor({ rate }: { rate: number }) {
  const save = useSaveDefaultRate()
  const [draft, setDraft] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [price, setPrice] = useState('1000')
  const [confirm, setConfirm] = useState(false)
  const value = draft ?? String(rate)
  const num = Number(value)
  const valid = value.trim() !== '' && Number.isFinite(num) && num >= 0 && num <= 100
  const dirty = draft != null && valid && num !== rate
  const p = Math.max(0, Number(price) || 0)
  const shown = valid ? num : rate
  const strike = (p * shown) / 100

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Percent className="h-4 w-4 text-primary" /> Default commission</div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative">
          <input aria-label="Default commission rate" inputMode="decimal" value={value} onChange={(e) => setDraft(e.target.value)}
            className={cn('w-32 rounded-2xl border-2 bg-background py-2 pl-4 pr-9 text-3xl font-bold tabular-nums outline-none transition-colors',
              valid ? 'border-border focus:border-primary' : 'border-red-500')} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">%</span>
        </div>
        <input type="range" min={0} max={30} step={0.5} value={Math.min(30, valid ? num : rate)} aria-label="Commission slider"
          onChange={(e) => setDraft(e.target.value)} className="h-2 min-w-[180px] flex-1 cursor-pointer accent-[#e01a00]" />
      </div>
      {!valid && <p className="-mt-3 text-xs text-red-600">Enter a number from 0 to 100.</p>}

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calculator className="h-3.5 w-3.5" /> On a card that costs
          <span className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">₹</span>
            <input aria-label="Card price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
              className="w-24 rounded-lg border border-border bg-background py-1 pl-5 pr-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring" />
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full bg-[#257de0]" animate={{ width: `${100 - Math.min(100, shown)}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
          <motion.div className="ml-0.5 h-full bg-[#f47230]" animate={{ width: `${Math.min(100, shown)}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#257de0]" /><span className="text-muted-foreground">Vendor gets</span><p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{formatInrFull(p - strike)}</p></div>
          <div><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#f47230]" /><span className="text-muted-foreground">Strike keeps</span><p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{formatInrFull(strike)}</p></div>
        </div>
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-2">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you changing it? (optional, saved in history)"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                  <Save className="h-3.5 w-3.5" /> Save {pct(num)}
                </button>
                <button type="button" onClick={() => { setDraft(null); setReason('') }} className="rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">Undo</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationDialog open={confirm} title={`Change the default to ${pct(num)}?`}
        description={`New vendors will start on ${pct(num)}. Existing vendors keep their own rate — you can move them below if you want.`}
        confirmLabel="Save" onCancel={() => setConfirm(false)} isLoading={save.isPending}
        onConfirm={() => save.mutate({ rate: num, reason: reason.trim() || undefined }, { onSuccess: () => { setConfirm(false); setDraft(null); setReason('') } })} />
    </Card>
  )
}

function Spread({ data }: { data: SettingsOverview['commission'] }) {
  const apply = useApplyDefaultRate()
  const [move, setMove] = useState<null | { scope: 'ALL' } | { scope: 'FROM_RATE'; fromRate: number; vendors: number }>(null)
  const [hover, setHover] = useState<string | null>(null)
  const max = Math.max(1, ...data.spread.map((s) => s.vendors))
  const off = data.vendors - data.onDefault

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Users className="h-4 w-4 text-primary" /> What vendors pay</div>
        {off > 0 && (
          <button type="button" onClick={() => setMove({ scope: 'ALL' })}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted">
            Move all {off} to {pct(data.rate)} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {data.spread.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No vendors yet.</p> : (
        <ul className="flex flex-col gap-2">
          {data.spread.map((s, i) => {
            const r = Number(s.rate)
            const isDefault = r === Number(data.rate)
            return (
              <li key={s.rate} onMouseEnter={() => setHover(s.rate)} onMouseLeave={() => setHover(null)}
                className={cn('group grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl px-2 py-1.5 transition-colors', hover === s.rate && 'bg-muted/50')}>
                <span className="text-sm font-semibold tabular-nums text-foreground">{pct(r)}</span>
                <div className="h-6 overflow-hidden rounded-md bg-muted/60">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(s.vendors / max) * 100}%` }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 22 }}
                    className={cn('flex h-full items-center rounded-md px-2 text-[11px] font-semibold text-white', isDefault ? 'bg-[#00b894]' : 'bg-[#257de0]')}>
                    {s.vendors}
                  </motion.div>
                </div>
                {isDefault ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">Default</span>
                ) : (
                  <button type="button" onClick={() => setMove({ scope: 'FROM_RATE', fromRate: r, vendors: s.vendors })}
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100">
                    Move to {pct(data.rate)}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#00b894]" />On the default ({data.onDefault})</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#257de0]" />Own rate ({off})</span>
      </div>
      <Explain icon={Info}>Each vendor pays their own rate. You can still change one vendor&apos;s rate from their page under Vendors.</Explain>

      <ConfirmationDialog open={move != null}
        title={move?.scope === 'ALL' ? `Move all ${off} vendors to ${pct(data.rate)}?` : `Move ${move && 'vendors' in move ? move.vendors : ''} vendors from ${move && 'fromRate' in move ? pct(move.fromRate) : ''} to ${pct(data.rate)}?`}
        description="Their next card sales are charged the new rate. Sales already made don't change. Each vendor's rate history records the change."
        confirmLabel="Move vendors" variant="destructive" isLoading={apply.isPending}
        onCancel={() => setMove(null)}
        onConfirm={() => move && apply.mutate(move.scope === 'ALL' ? { scope: 'ALL' } : { scope: 'FROM_RATE', fromRate: move.fromRate }, { onSuccess: () => setMove(null) })} />
    </Card>
  )
}

function RateHistory() {
  const [page, setPage] = useState(0)
  const history = useGlobalCommissionRateHistory(page)
  const rows = history.data?.content ?? []
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><History className="h-4 w-4 text-primary" /> Default rate history</div>
      {history.isLoading ? <div className="h-24 animate-pulse rounded-xl bg-muted" /> : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">The default has never been changed.</p>
      ) : (
        <ol className="relative ml-2 border-l border-border">
          {rows.map((h, i) => {
            const up = h.oldRate == null || Number(h.newRate) >= Number(h.oldRate)
            return (
              <motion.li key={h.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="relative pb-4 pl-5 last:pb-0">
                <span className={cn('absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card', up ? 'bg-[#f47230]' : 'bg-[#257de0]')} />
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground line-through">{h.oldRate == null ? '—' : pct(Number(h.oldRate))}</span>
                  <span className="mx-1.5 text-muted-foreground">→</span>
                  <b>{pct(Number(h.newRate))}</b>
                </p>
                <p className="text-[11px] text-muted-foreground" title={formatDateTime(h.createdAt)}>
                  {formatRelative(h.createdAt)}{h.changedByEmail ? ` · ${h.changedByEmail}` : ''}
                </p>
                {h.reason && <p className="mt-0.5 text-xs italic text-muted-foreground">“{h.reason}”</p>}
              </motion.li>
            )
          })}
        </ol>
      )}
      {history.data && history.data.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40 hover:bg-muted">Newer</button>
          <span className="text-muted-foreground">{page + 1} / {history.data.totalPages}</span>
          <button type="button" disabled={history.data.last} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40 hover:bg-muted">Older</button>
        </div>
      )}
    </Card>
  )
}

export function CommissionSection({ data }: { data: SettingsOverview | undefined }) {
  const c = data?.commission
  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={Percent} tone="bg-gradient-to-br from-orange-400 to-red-600 shadow-orange-500/30" title="Commission"
        body="Strike's share of every card sale. New vendors start on the default rate; each vendor can also have their own rate."
        right={<ChangedStamp at={c?.changedAt} by={c?.changedBy} />} />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Default rate', node: c ? <AnimatedNumber value={Number(c.rate)} format={(n) => pct(n)} /> : '—', hint: 'New vendors start here' },
          { label: 'Vendors on the default', node: c ? <><AnimatedNumber value={c.onDefault} /><span className="text-base font-medium text-muted-foreground"> / {c.vendors}</span></> : '—', hint: c && c.vendors ? `${Math.round((c.onDefault / c.vendors) * 100)}% of vendors` : '' },
          { label: 'Strike earned, last 30 days', node: c ? <AnimatedNumber value={Number(c.earned30d ?? 0)} format={formatInrShort} /> : '—', hint: c ? `from ${c.sales30d ?? 0} sales` : '' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{k.node}</p>
            <p className="text-[11px] text-muted-foreground">{k.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {c ? <RateEditor key={String(c.rate)} rate={Number(c.rate)} /> : <div className="h-72 animate-pulse rounded-2xl bg-muted" />}
        {c ? <Spread data={c} /> : <div className="h-72 animate-pulse rounded-2xl bg-muted" />}
      </div>
      <RateHistory />
    </div>
  )
}
