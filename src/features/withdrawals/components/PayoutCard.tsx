import { forwardRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowUpRight, BadgeCheck, Check, Clock, Copy, ExternalLink, Loader2, MessageSquareText, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { avatarGradient, formatInrFull, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { useMarkPaid, useRejectPayout, type PayoutRow } from '../api/withdrawal-insights.api'
import { REJECT_REASONS, groupDigits, methodMeta, statusMeta, upiPayLink } from '../utils/payout-meta'

/** One withdrawal in the payout queue: who, how much, where to send it, and whether it's covered. */
export const PayoutCard = forwardRef<HTMLDivElement, {
  row: PayoutRow
  selected?: boolean
  onSelect?: (id: number, on: boolean) => void
  /** On the withdrawal's own page: no link to itself. */
  standalone?: boolean
}>(function PayoutCard({ row: w, selected, onSelect, standalone }, ref) {
  const [mode, setMode] = useState<'idle' | 'pay' | 'reject'>('idle')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const pay = useMarkPaid()
  const reject = useRejectPayout()
  const method = methodMeta(w.method)
  const status = statusMeta(w.status)
  const pending = w.status === 'PENDING'
  const name = w.vendorName ?? `Vendor #${w.vendorId}`
  const earned = Number(w.vendorEarned ?? 0)
  const paid = Number(w.vendorPaidOut ?? 0)
  const amount = Number(w.amount)
  const available = Math.max(0, Number(w.balanceForThis ?? 0))
  const coverPct = amount > 0 ? Math.min(100, (available / amount) * 100) : 0
  const [now] = useState(() => Date.now())
  const waitingHours = w.createdAt ? (now - new Date(w.createdAt).getTime()) / 36e5 : 0
  const busy = pay.isPending || reject.isPending

  return (
    <motion.article ref={ref} layout initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 90, scale: 0.95, transition: { duration: 0.3 } }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('relative overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.05]',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border')}>
      <span className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', status.tone)} aria-hidden />

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Who & how much */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            {onSelect && pending && (
              <input type="checkbox" checked={!!selected} onChange={(e) => onSelect(w.id, e.target.checked)} aria-label={`Select withdrawal ${w.id}`} className="mt-3 h-4 w-4 cursor-pointer accent-[#e01a00]" />
            )}
            <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-sm font-bold text-white shadow-lg', avatarGradient(w.vendorId))}>
              {w.storeLogo && /^(https?:)?\//.test(w.storeLogo) ? <img src={w.storeLogo} alt="" className="h-full w-full object-cover" /> : vendorInitials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <Link to="/vendors/$vendorId" params={{ vendorId: String(w.vendorId) }} search={{ tab: undefined }} className="flex items-center gap-1 truncate text-base font-semibold text-foreground hover:text-primary">
                {name} <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span className="font-mono">#{w.id}</span>
                {w.vendorMobile && <span>{w.vendorMobile}</span>}
                {w.firstPayout && <span className="flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-px font-semibold text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"><Sparkles className="h-3 w-3" />First payout</span>}
                {!pending && <span className={cn('flex items-center gap-1 rounded-full px-1.5 py-px font-semibold', status.chip)}><status.icon className="h-3 w-3" />{status.label}</span>}
              </p>
            </div>
          </div>
          <div>
            <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn('text-4xl font-extrabold tracking-tight tabular-nums', w.status === 'REJECTED' ? 'text-muted-foreground line-through' : 'text-foreground')}>
              {formatInrFull(amount)}
            </motion.p>
            <p className={cn('mt-1 flex items-center gap-1.5 text-xs', pending && waitingHours > 24 ? 'font-semibold text-rose-600' : 'text-muted-foreground')} title={w.createdAt ? formatDateTime(w.createdAt) : undefined}>
              <Clock className="h-3.5 w-3.5" />
              {pending ? `Waiting ${w.createdAt ? formatRelative(w.createdAt).replace(' ago', '') : ''}` : `Asked ${w.createdAt ? formatRelative(w.createdAt) : ''}`}
              {pending && waitingHours > 24 && ' — over a day'}
            </p>
          </div>
          {w.note && <p className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground"><MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" />“{w.note}”</p>}

          {/* Balance check */}
          {pending && w.vendorEarned != null && (
            <div className="rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Is it covered by their earnings?</span>
                {w.covered
                  ? <span className="flex items-center gap-1 font-semibold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" /> Yes</span>
                  : <span className="flex items-center gap-1 font-semibold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" /> Short by {formatInrFull(Math.max(0, amount - available))}</span>}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div className={cn('h-full rounded-full bg-gradient-to-r', w.covered ? 'from-emerald-400 to-teal-600' : 'from-amber-400 to-rose-600')}
                  initial={{ width: 0 }} animate={{ width: `${coverPct}%` }} transition={{ duration: 1, delay: 0.2 }} />
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div><dt className="text-muted-foreground">Earned online</dt><dd className="font-semibold tabular-nums text-foreground">{formatInrFull(earned)}</dd></div>
                <div><dt className="text-muted-foreground">Already paid</dt><dd className="font-semibold tabular-nums text-foreground">{formatInrFull(paid)}</dd></div>
                <div><dt className="text-muted-foreground">Available</dt><dd className={cn('font-semibold tabular-nums', w.covered ? 'text-emerald-600' : 'text-rose-600')}>{formatInrFull(available)}</dd></div>
              </dl>
            </div>
          )}
        </div>

        {/* Where to send it */}
        <div className="flex flex-col gap-3">
          <div className={cn('relative overflow-hidden rounded-2xl p-4 text-white shadow-lg', w.method === 'UPI' ? 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500' : 'bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-800')}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75"><method.icon className="h-3.5 w-3.5" /> Pay by {method.label}</p>
            {w.method === 'UPI' ? (
              <div className="mt-2">
                <CopyLine label="UPI ID" value={w.upiId ?? '—'} mono />
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                <CopyLine label="Account name" value={w.bankAccountName ?? '—'} />
                <CopyLine label="Account number" value={w.bankAccountNumber ?? '—'} display={groupDigits(w.bankAccountNumber)} mono />
                <CopyLine label="IFSC" value={w.ifscCode ?? '—'} mono />
              </div>
            )}
            <CopyLine label="Amount" value={amount.toFixed(2)} display={formatInrFull(amount)} mono />
          </div>
          {pending && w.method === 'UPI' && w.upiId && (
            <a href={upiPayLink(w.upiId, name, amount, `Strike payout #${w.id}`)} className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-200">
              <ExternalLink className="h-3.5 w-3.5" /> Open in UPI app (on phone)
            </a>
          )}
          {!pending && w.adminNote && (
            <p className={cn('rounded-xl px-3 py-2 text-xs', w.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-400/10 dark:text-rose-200')}>
              {w.adminNote}{w.reviewedAt ? ` · ${formatRelative(w.reviewedAt)}` : ''}
            </p>
          )}
          {!standalone && <Link to="/withdrawals/$withdrawalId" params={{ withdrawalId: String(w.id) }} className="mt-auto self-end text-xs font-medium text-primary hover:underline">Full details →</Link>}
        </div>
      </div>

      {pending && (
        <footer className="border-t border-border bg-muted/20 px-5 py-3">
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'pay' ? (
              <motion.div key="pay" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {w.covered === false && (
                  <p className="flex w-full items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> This is more than they’ve earned so far. Only mark it paid if you’re sure — e.g. Pay-at-Store money or an agreed advance.
                  </p>
                )}
                <input value={reference} onChange={(e) => setReference(e.target.value)} autoFocus placeholder="Payment reference / UTR (recommended)"
                  className="h-10 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMode('idle')} className="h-10 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="button" disabled={busy} onClick={() => pay.mutate({ row: w, reference: reference.trim() || undefined })}
                    className="btn-shine flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-sm font-semibold text-white shadow-md disabled:opacity-60">
                    {pay.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirm paid
                  </button>
                </div>
              </motion.div>
            ) : mode === 'reject' ? (
              <motion.div key="reject" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {REJECT_REASONS.map((r) => (
                    <button key={r} type="button" onClick={() => setReason(r)}
                      className={cn('rounded-full border px-2.5 py-1 text-[11px]', reason === r ? 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300' : 'border-border text-muted-foreground hover:bg-muted')}>{r}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason the vendor will see…" className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setMode('idle')} className="h-10 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="button" disabled={!reason.trim() || busy} onClick={() => reject.mutate({ row: w, reason: reason.trim() })}
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
                    {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Send the money first, then mark it as paid — the vendor is notified.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMode('reject')} className="flex h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-400/10">
                    <X className="h-4 w-4" /> Reject
                  </button>
                  <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setMode('pay')}
                    className="btn-shine flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25">
                    <Check className="h-4 w-4" /> Mark as paid
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>
      )}
    </motion.article>
  )
})

function CopyLine({ label, value, display, mono }: { label: string; value: string; display?: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => void navigator.clipboard.writeText(value).then(() => { setCopied(true); toast.success(`${label} copied`); setTimeout(() => setCopied(false), 1500) })
  return (
    <button type="button" onClick={copy} disabled={value === '—'} title={`Copy ${label}`}
      className="group mt-1 flex w-full items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-left backdrop-blur transition-colors hover:bg-white/20">
      <span className="min-w-0">
        <span className="block text-[9px] uppercase tracking-wider text-white/60">{label}</span>
        <span className={cn('block truncate text-sm font-semibold', mono && 'font-mono tracking-wide')}>{display ?? value}</span>
      </span>
      {copied ? <Check className="h-4 w-4 shrink-0 text-emerald-300" /> : <Copy className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100" />}
    </button>
  )
}
