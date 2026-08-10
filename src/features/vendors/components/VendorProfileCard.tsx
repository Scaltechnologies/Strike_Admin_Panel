import { Mail, Phone, Hash, MapPin, Calendar, Percent, ShieldCheck } from 'lucide-react'

function cap(s: string | null | undefined): string {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/utils/helpers/date'
import { cn } from '@/lib/utils'
import type { VendorRecord } from '../types/vendor.types'

interface VendorProfileCardProps {
  vendor: VendorRecord
  isLoading?: boolean
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

function vendorInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300',
  'bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300',
]

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

export function VendorProfileCard({ vendor, isLoading }: VendorProfileCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold',
            avatarColor(vendor.vendorId),
          )}
          aria-hidden
        >
          {vendorInitials(vendor.hotelName)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{vendor.hotelName}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={vendor.status?.toLowerCase() ?? 'default'}
              label={cap(vendor.status)}
              dot
            />
            <StatusBadge
              status={vendor.kycStatus === 'VERIFIED' ? 'verified' : vendor.kycStatus === 'PENDING' ? 'pending' : 'rejected'}
              label={`KYC ${cap(vendor.kycStatus)}`}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20 px-4">
        <InfoRow icon={Hash} label="Vendor ID" value={`#${vendor.vendorId}`} />
        <InfoRow icon={Phone} label="Mobile" value={<span className="font-mono">{vendor.mobileNumber}</span>} />
        {vendor.email && <InfoRow icon={Mail} label="Email" value={vendor.email} />}
        <InfoRow
          icon={Percent}
          label="Commission Rate"
          value={`${Number(vendor.commissionRate).toFixed(2)}%`}
        />
        {vendor.branchId && (
          <InfoRow icon={MapPin} label="Branch ID" value={`#${vendor.branchId}`} />
        )}
        <InfoRow icon={Calendar} label="Registered" value={formatDate(vendor.createdAt)} />
      </div>

      {/* KYC details */}
      {(vendor.kycDocumentUrl || vendor.kycRejectionReason) && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              KYC Details
            </span>
          </div>
          {vendor.kycDocumentUrl && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground">Document URL</p>
              <a
                href={vendor.kycDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block truncate text-sm text-primary underline-offset-2 hover:underline"
              >
                View Document
              </a>
            </div>
          )}
          {vendor.kycRejectionReason && (
            <div>
              <p className="text-xs text-muted-foreground">Rejection Reason</p>
              <p className="mt-0.5 text-sm text-foreground">{vendor.kycRejectionReason}</p>
            </div>
          )}
          {vendor.kycReviewedAt && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Reviewed At</p>
              <p className="mt-0.5 text-sm text-foreground">{formatDate(vendor.kycReviewedAt)}</p>
            </div>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {vendor.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-xs font-medium text-red-700 dark:text-red-400">Rejection Reason</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">{vendor.rejectionReason}</p>
        </div>
      )}
    </div>
  )
}
