import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Check, CreditCard, KeyRound, QrCode, ShieldAlert, ShieldCheck, Smartphone, Store, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useSavePaymentMode, type SettingsOverview } from '../api/settings-overview.api'
import type { PaymentMode } from '../types/settings.types'
import { PAYMENT_META } from '../utils/settings-meta'
import { Card, ChangedStamp, Explain, SectionHead } from './SettingsBits'

const OPTIONS: { mode: PaymentMode; icon: LucideIcon; tone: string; methods: { icon: LucideIcon; label: string }[] }[] = [
  { mode: 'BOTH', icon: Wallet, tone: 'from-emerald-400 to-teal-600', methods: [{ icon: CreditCard, label: 'Online' }, { icon: QrCode, label: 'At store' }] },
  { mode: 'ONLINE_ONLY', icon: Smartphone, tone: 'from-sky-400 to-indigo-600', methods: [{ icon: CreditCard, label: 'Online' }] },
  { mode: 'PAY_AT_STORE_ONLY', icon: Store, tone: 'from-amber-400 to-orange-600', methods: [{ icon: QrCode, label: 'At store' }] },
]

function KeyFact({ ok, label, value }: { ok: boolean | null; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', ok === true ? 'text-emerald-600' : ok === false ? 'text-red-600' : 'text-amber-600')}>
        {ok === true ? <ShieldCheck className="h-3.5 w-3.5" /> : ok === false ? <ShieldAlert className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {value}
      </span>
    </div>
  )
}

export function PaymentsSection({ data }: { data: SettingsOverview | undefined }) {
  const save = useSavePaymentMode()
  const [pending, setPending] = useState<PaymentMode | null>(null)
  const current = data?.paymentMode.mode ?? 'BOTH'
  const rzp = data?.razorpay
  const rzpReady = !!rzp?.configured && rzp.active !== false

  const pick = (mode: PaymentMode) => {
    if (!data || mode === current || save.isPending) return
    setPending(mode)
  }

  const warning = pending && pending !== 'PAY_AT_STORE_ONLY' && !rzpReady
    ? ' Warning: Razorpay keys are not ready, so online purchases will fail until you add them on the API Keys page.'
    : ''
  const description = pending === 'ONLINE_ONLY'
    ? 'Pay at Store disappears from the customer app straight away. Vendors stop getting new pay-at-store purchases.' + warning
    : pending === 'PAY_AT_STORE_ONLY'
      ? 'Online payment disappears from the customer app straight away. Every purchase will be paid at the store.'
      : 'Customers can choose online payment or pay at the store again.' + warning

  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={CreditCard} tone="bg-gradient-to-br from-sky-400 to-indigo-600 shadow-indigo-500/30" title="Payments"
        body="Choose how customers can pay for cards. The change reaches the customer app within a minute." />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">How customers can pay</p>
          <ChangedStamp at={data?.paymentMode.changedAt} by={data?.paymentMode.changedBy} />
        </div>
        <div role="radiogroup" aria-label="Payment options" className="grid gap-3 md:grid-cols-3">
          {OPTIONS.map((o, i) => {
            const active = current === o.mode
            const Icon = o.icon
            return (
              <motion.button key={o.mode} type="button" role="radio" aria-checked={active} onClick={() => pick(o.mode)} disabled={!data || save.isPending}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
                className={cn('relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed',
                  active ? 'border-primary bg-primary/[0.04] shadow-md shadow-primary/10' : 'border-border hover:border-primary/40')}>
                {active && (
                  <motion.span layoutId="pay-check" className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </motion.span>
                )}
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', o.tone)}><Icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{PAYMENT_META[o.mode].label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{PAYMENT_META[o.mode].customer}</p>
                </div>
                <div className="mt-auto flex gap-1.5">
                  {o.methods.map((m) => (
                    <span key={m.label} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                      <m.icon className="h-3 w-3" />{m.label}
                    </span>
                  ))}
                </div>
              </motion.button>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c2451] text-white"><KeyRound className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-foreground">Razorpay (online payment)</p>
              <p className="text-xs text-muted-foreground">The keys that let customers pay online.</p>
            </div>
          </div>
          <Link to="/api-keys" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
            Manage keys <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {!data ? <div className="h-24 animate-pulse rounded-xl bg-muted" /> : (
          <div className="grid gap-2 sm:grid-cols-2">
            <KeyFact ok={rzp?.configured ?? false} label="Keys saved" value={rzp?.configured ? `Yes ${rzp.keyHint ?? ''}` : 'No'} />
            <KeyFact ok={rzp?.configured ? rzp.mode === 'LIVE' : false} label="Mode" value={rzp?.configured ? (rzp.mode === 'LIVE' ? 'Live — real money' : 'Test — no real money') : '—'} />
            <KeyFact ok={rzp?.configured ? rzp.active !== false : false} label="Switched on" value={rzp?.configured ? (rzp.active !== false ? 'Yes' : 'No') : '—'} />
            <KeyFact ok={rzp?.webhookConfigured ? true : null} label="Webhook secret" value={rzp?.webhookConfigured ? 'Saved' : 'Not added (optional)'} />
          </div>
        )}
        {data && current !== 'PAY_AT_STORE_ONLY' && !rzpReady && (
          <div className="mt-3"><Explain icon={AlertTriangle} tone="danger">Online payment is switched on, but Razorpay isn&apos;t ready — online purchases will fail. Add the keys, or switch to <b>Pay at Store only</b>.</Explain></div>
        )}
      </Card>

      <ConfirmationDialog
        open={pending != null}
        title={pending ? `Switch to “${PAYMENT_META[pending].label}”?` : ''}
        description={description}
        confirmLabel="Switch"
        variant={pending === 'BOTH' && !warning ? 'default' : 'destructive'}
        onConfirm={() => pending && save.mutate(pending, { onSuccess: () => setPending(null) })}
        onCancel={() => setPending(null)}
        isLoading={save.isPending}
      />
    </div>
  )
}
