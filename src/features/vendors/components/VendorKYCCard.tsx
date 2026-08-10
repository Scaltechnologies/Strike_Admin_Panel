import { useState } from 'react'
import { ShieldCheck, ShieldX, FileText, AlertTriangle } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { formatDate } from '@/utils/helpers/date'
import { cn } from '@/lib/utils'
import { useVerifyKyc, useRejectKyc } from '../hooks/useVendors'
import type { VendorRecord } from '../types/vendor.types'

interface VendorKYCCardProps {
  vendor: VendorRecord
}

export function VendorKYCCard({ vendor }: VendorKYCCardProps) {
  const canApprove = usePermission(PERMISSIONS.VENDORS.APPROVE)
  const [confirmAction, setConfirmAction] = useState<'verify' | 'reject' | null>(null)
  const [reason, setReason] = useState('')

  const { mutate: verifyKyc, isPending: verifying } = useVerifyKyc()
  const { mutate: rejectKyc, isPending: rejecting } = useRejectKyc()

  function handleConfirm() {
    if (confirmAction === 'verify') {
      verifyKyc(vendor.vendorId, { onSuccess: () => setConfirmAction(null) })
    } else if (confirmAction === 'reject') {
      rejectKyc(
        { vendorId: vendor.vendorId, reason: reason || undefined },
        { onSuccess: () => { setConfirmAction(null); setReason('') } },
      )
    }
  }

  const isVerified = vendor.kycStatus === 'VERIFIED'
  const isPending = vendor.kycStatus === 'PENDING'

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              isVerified
                ? 'bg-blue-100 dark:bg-blue-400/10'
                : isPending
                  ? 'bg-amber-100 dark:bg-amber-400/10'
                  : 'bg-red-100 dark:bg-red-400/10',
            )}
          >
            {isVerified ? (
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden />
            ) : (
              <ShieldX className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">KYC Status</p>
            <StatusBadge
              status={isVerified ? 'verified' : isPending ? 'pending' : 'rejected'}
              label={vendor.kycStatus ? vendor.kycStatus.charAt(0).toUpperCase() + vendor.kycStatus.slice(1).toLowerCase() : '—'}
              dot
            />
          </div>
        </div>

        {canApprove && !isVerified && (
          <div className="flex items-center gap-2">
            {isPending && (
              <button
                onClick={() => setConfirmAction('verify')}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Verify KYC
              </button>
            )}
            <button
              onClick={() => { setReason(''); setConfirmAction('reject') }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Reject KYC
            </button>
          </div>
        )}
      </div>

      {/* KYC details */}
      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20 px-4">
        <Row label="Vendor ID" value={`#${vendor.vendorId}`} />
        <Row label="Hotel Name" value={vendor.hotelName} />
        <Row label="Mobile" value={<span className="font-mono">{vendor.mobileNumber}</span>} />
        {vendor.email && <Row label="Email" value={vendor.email} />}
        {vendor.kycReviewedAt && (
          <Row label="Reviewed At" value={formatDate(vendor.kycReviewedAt)} />
        )}
      </div>

      {/* Document */}
      {vendor.kycDocumentUrl ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              KYC Document
            </p>
          </div>
          <a
            href={vendor.kycDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-primary transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4" aria-hidden />
            View Document
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
          <p className="text-sm text-muted-foreground">No KYC document uploaded.</p>
        </div>
      )}

      {/* Rejection reason */}
      {vendor.kycRejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
            <p className="text-xs font-medium text-red-700 dark:text-red-400">Rejection Reason</p>
          </div>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">{vendor.kycRejectionReason}</p>
        </div>
      )}

      {/* Verify dialog */}
      <ConfirmationDialog
        open={confirmAction === 'verify'}
        title="Verify KYC"
        description={`Confirm KYC verification for ${vendor.hotelName}?`}
        confirmLabel="Verify"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        isLoading={verifying}
      />

      {/* Reject dialog */}
      <ConfirmationDialog
        open={confirmAction === 'reject'}
        title="Reject KYC"
        description={`Reject KYC for ${vendor.hotelName}? Optionally provide a reason.`}
        confirmLabel="Reject KYC"
        variant="destructive"
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmAction(null); setReason('') }}
        isLoading={rejecting}
      >
        <div className="mt-1">
          <label className="text-xs font-medium text-muted-foreground">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why KYC is being rejected…"
            className={cn(
              'mt-1.5 block w-full resize-none rounded-lg border border-border bg-card',
              'px-3 py-2 text-sm placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring',
            )}
          />
        </div>
      </ConfirmationDialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-right text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}
