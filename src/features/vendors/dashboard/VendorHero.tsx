import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, Ban, CalendarDays, Check, CheckCircle2, Copy, CreditCard, KeyRound, Mail, Percent, Phone, RotateCcw, ShieldBan, UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { useStoreByVendor } from '@/features/stores/hooks/useStores'
import { SetPinDialog } from '@/features/onboarding/components/SetPinDialog'
import { formatDate } from '@/utils/helpers/date'
import { useApproveVendor, useReactivateVendor, useRejectVendor, useSuspendVendor } from '../hooks/useVendors'
import type { VendorRecord } from '../types/vendor.types'
import { KYC_META, STATUS_META, avatarGradient, vendorInitials } from '../utils/vendor-meta'

type Action = 'approve' | 'reject' | 'suspend' | 'reactivate'

function CopyChip({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" title="Copy"
      onClick={() => void navigator.clipboard.writeText(value).then(() => { setCopied(true); toast.success('Copied'); setTimeout(() => setCopied(false), 1200) })}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs text-white/80 backdrop-blur transition-colors hover:bg-white/[0.12] hover:text-white">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="max-w-[220px] truncate">{value}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />}
    </button>
  )
}

function ReasonInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="mt-1">
      <label className="text-xs font-medium text-muted-foreground">Reason (optional, shared with the vendor)</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
        className="mt-1.5 block w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  )
}

export function VendorHero({ vendor }: { vendor: VendorRecord }) {
  const canApprove = usePermission(PERMISSIONS.VENDORS.APPROVE)
  const [confirm, setConfirm] = useState<Action | null>(null)
  const [reason, setReason] = useState('')
  const [pinOpen, setPinOpen] = useState(false)
  const store = useStoreByVendor(vendor.vendorId)
  const approve = useApproveVendor()
  const reject = useRejectVendor()
  const suspend = useSuspendVendor()
  const reactivate = useReactivateVendor()
  const busy = approve.isPending || reject.isPending || suspend.isPending || reactivate.isPending

  const status = STATUS_META[vendor.status] ?? STATUS_META.PENDING
  const kyc = KYC_META[vendor.kycStatus] ?? KYC_META.PENDING
  const StatusIcon = status.icon
  const KycIcon = kyc.icon
  const name = vendor.hotelName || `Vendor #${vendor.vendorId}`

  const done = () => { setConfirm(null); setReason('') }
  const run = () => {
    const r = reason.trim() || undefined
    if (confirm === 'approve') approve.mutate(vendor.vendorId, { onSuccess: done })
    if (confirm === 'reject') reject.mutate({ vendorId: vendor.vendorId, reason: r }, { onSuccess: done })
    if (confirm === 'suspend') suspend.mutate({ vendorId: vendor.vendorId, reason: r }, { onSuccess: done })
    if (confirm === 'reactivate') reactivate.mutate(vendor.vendorId, { onSuccess: done })
  }

  const btn = 'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60'

  return (
    <>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] text-white shadow-xl shadow-black/10">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className={cn('pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br opacity-40 blur-3xl', avatarGradient(vendor.vendorId))} aria-hidden />

        <div className="relative z-10 p-6 sm:p-8">
          <Link to="/vendors" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All vendors
          </Link>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <motion.span initial={{ scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className={cn('relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br text-2xl font-bold shadow-2xl ring-4 ring-white/10', avatarGradient(vendor.vendorId))}>
                {vendorInitials(vendor.hotelName)}
                <span className={cn('absolute -bottom-1 -right-1 h-5 w-5 rounded-full ring-4 ring-[#0b0c10]', status.dot)} aria-hidden />
              </motion.span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-white/50">Vendor #{vendor.vendorId}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', status.chip)}>
                    <StatusIcon className="h-3.5 w-3.5" />{status.label}
                  </span>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', kyc.chip)}>
                    <KycIcon className="h-3.5 w-3.5" />{kyc.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                    <Percent className="h-3.5 w-3.5" />{Number(vendor.commissionRate ?? 0)}% fee
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vendor.mobileNumber && <CopyChip icon={Phone} value={vendor.mobileNumber} />}
                  {vendor.email && <CopyChip icon={Mail} value={vendor.email} />}
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/60">
                    <CalendarDays className="h-3.5 w-3.5" />Joined {formatDate(vendor.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
            {canApprove && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPinOpen(true)} className={cn(btn, 'bg-white/10 text-white shadow-none hover:bg-white/20')}>
                  <KeyRound className="h-4 w-4" />Set PIN
                </button>
                {store.data && hasPermission('SEC_MENUS') && (
                  <Link to="/menus/$storeId" params={{ storeId: String(store.data.id) }} search={{ upload: true }} className={cn(btn, 'bg-white/10 text-white shadow-none hover:bg-white/20')}>
                    <UtensilsCrossed className="h-4 w-4" />Upload menu
                  </Link>
                )}
                {store.data && hasPermission('SEC_MENUS') && (
                  <Link to="/menus/$storeId" params={{ storeId: String(store.data.id) }} search={{ card: true }} className={cn(btn, 'bg-white/10 text-white shadow-none hover:bg-white/20')}>
                    <CreditCard className="h-4 w-4" />Create card
                  </Link>
                )}
              </div>
            )}
            {canApprove && (
              <div className="flex flex-wrap gap-2">
                {vendor.status === 'PENDING' && (
                  <button type="button" disabled={busy} onClick={() => setConfirm('approve')}
                    className={cn(btn, 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-emerald-500/30')}>
                    <CheckCircle2 className="h-4 w-4" />Approve
                  </button>
                )}
                {vendor.status === 'PENDING' && (
                  <button type="button" disabled={busy} onClick={() => setConfirm('reject')}
                    className={cn(btn, 'bg-white/10 text-white shadow-none hover:bg-red-500/80')}>
                    <ShieldBan className="h-4 w-4" />Reject
                  </button>
                )}
                {vendor.status === 'ACTIVE' && (
                  <button type="button" disabled={busy} onClick={() => setConfirm('suspend')}
                    className={cn(btn, 'bg-white/10 text-white shadow-none hover:bg-orange-500/80')}>
                    <Ban className="h-4 w-4" />Suspend
                  </button>
                )}
                {(vendor.status === 'SUSPENDED' || vendor.status === 'REJECTED') && (
                  <button type="button" disabled={busy} onClick={() => setConfirm('reactivate')}
                    className={cn(btn, 'bg-gradient-to-r from-[#ff8a00] to-[#e01a00] text-white shadow-orange-600/30')}>
                    <RotateCcw className="h-4 w-4" />Reactivate
                  </button>
                )}
              </div>
            )}
            </div>
          </div>

          {(vendor.status === 'REJECTED' || vendor.status === 'SUSPENDED') && vendor.rejectionReason && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span><span className="font-semibold">{vendor.status === 'REJECTED' ? 'Rejected' : 'Suspended'}:</span> {vendor.rejectionReason}</span>
            </div>
          )}
        </div>
      </motion.section>

      <SetPinDialog open={pinOpen} onOpenChange={setPinOpen} vendorId={vendor.vendorId} hotelName={name} mobileNumber={vendor.mobileNumber ?? ''} />
      <ConfirmationDialog open={confirm === 'approve'} title="Approve vendor" confirmLabel="Approve" isLoading={busy}
        description={`Approve ${name}? They'll be activated and notified.`} onConfirm={run} onCancel={done} />
      <ConfirmationDialog open={confirm === 'reject'} title="Reject vendor" confirmLabel="Reject" variant="destructive" isLoading={busy}
        description={`Reject ${name}?`} onConfirm={run} onCancel={done}>
        <ReasonInput value={reason} onChange={setReason} placeholder="Why is this vendor being rejected?" />
      </ConfirmationDialog>
      <ConfirmationDialog open={confirm === 'suspend'} title="Suspend vendor" confirmLabel="Suspend" variant="destructive" isLoading={busy}
        description={`Suspend ${name}? They won't be able to accept new subscriptions.`} onConfirm={run} onCancel={done}>
        <ReasonInput value={reason} onChange={setReason} placeholder="Why is this vendor being suspended?" />
      </ConfirmationDialog>
      <ConfirmationDialog open={confirm === 'reactivate'} title="Reactivate vendor" confirmLabel="Reactivate" isLoading={busy}
        description={`Reactivate ${name}? Their status will be set to Active.`} onConfirm={run} onCancel={done} />
    </>
  )
}
