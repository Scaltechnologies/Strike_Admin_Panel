import { useState } from 'react'
import {
  MapPin, Phone, Mail, Tag, Calendar, User, ExternalLink, Hash, Clock, Copy, Check,
} from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { formatDate } from '@/utils/helpers/date'
import { cn } from '@/lib/utils'
import { useUpdateStoreStatus } from '../hooks/useStores'
import type { StoreRecord, StoreStatus } from '../types/store.types'

interface StoreProfileCardProps {
  store: StoreRecord
  isLoading?: boolean
}

const STATUS_OPTIONS: { value: StoreStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Active', color: 'text-green-600 dark:text-green-400' },
  { value: 'INACTIVE', label: 'Inactive', color: 'text-gray-500' },
  { value: 'TEMPORARILY_CLOSED', label: 'Temporarily Closed', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'text-red-600 dark:text-red-400' },
]

function statusVariant(status: StoreStatus | null | undefined): string {
  switch (status) {
    case 'ACTIVE': return 'active'
    case 'INACTIVE': return 'inactive'
    case 'TEMPORARILY_CLOSED': return 'warning'
    case 'SUSPENDED': return 'suspended'
    default: return 'default'
  }
}

function statusLabel(status: StoreStatus | null | undefined): string {
  if (!status) return '—'
  if (status === 'TEMPORARILY_CLOSED') return 'Temp. Closed'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function storeInitials(name: string | null | undefined): string {
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
  'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300',
]

export function StoreProfileCard({ store, isLoading }: StoreProfileCardProps) {
  const canEdit = usePermission(PERMISSIONS.STORES.EDIT)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<StoreStatus>(store.status)

  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateStoreStatus()

  function handleStatusConfirm() {
    updateStatus(
      { storeId: store.id, status: selectedStatus },
      { onSuccess: () => setShowStatusDialog(false) },
    )
  }

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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
        ))}
      </div>
    )
  }

  const avatarColor = AVATAR_COLORS[store.id % AVATAR_COLORS.length]
  const mapsUrl =
    store.latitude != null && store.longitude != null
      ? `https://www.google.com/maps?q=${store.latitude},${store.longitude}`
      : null

  return (
    <div className="space-y-5">
      {/* Avatar + name + status */}
      <div className="flex items-start gap-4">
        {store.logoUrl ? (
          <img
            src={store.logoUrl}
            alt={store.name}
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold',
              avatarColor,
            )}
            aria-hidden
          >
            {storeInitials(store.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">{store.name}</h3>
          {store.category && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" aria-hidden />
              {store.category}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <StatusBadge
              status={statusVariant(store.status)}
              label={statusLabel(store.status)}
              dot
            />
            {canEdit && (
              <button
                onClick={() => { setSelectedStatus(store.status); setShowStatusDialog(true) }}
                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none"
              >
                Change
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20 px-4">
        <InfoRow icon={Hash} label="Store ID" value={`#${store.id}`} />
        <InfoRow
          icon={Hash}
          label="Vendor ID"
          value={<span className="font-mono">#{store.vendorId}</span>}
        />
        <InfoRow icon={MapPin} label="Address" value={store.address} />
        {store.phone && (
          <InfoRow icon={Phone} label="Phone" value={<span className="font-mono">{store.phone}</span>} />
        )}
        {store.email && <InfoRow icon={Mail} label="Email" value={store.email} />}
        {(store.managerName || store.managerPhone) && (
          <InfoRow
            icon={User}
            label="Manager"
            value={[store.managerName, store.managerPhone].filter(Boolean).join(' · ')}
          />
        )}
        {mapsUrl && (
          <InfoRow
            icon={MapPin}
            label="Coordinates"
            value={<CoordinateDisplay lat={store.latitude!} lng={store.longitude!} mapsUrl={mapsUrl} />}
          />
        )}
        <InfoRow icon={Calendar} label="Created" value={formatDate(store.createdAt)} />
        <InfoRow icon={Clock} label="Updated" value={formatDate(store.updatedAt)} />
      </div>

      {/* Description */}
      {store.description && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </p>
          <p className="text-sm leading-relaxed text-foreground">{store.description}</p>
        </div>
      )}

      {/* Status dialog */}
      <ConfirmationDialog
        open={showStatusDialog}
        title="Change Store Status"
        description={`Update the status for ${store.name}.`}
        confirmLabel="Update Status"
        onConfirm={handleStatusConfirm}
        onCancel={() => setShowStatusDialog(false)}
        isLoading={updatingStatus}
      >
        <div className="mt-2 space-y-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                selectedStatus === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name="store-status"
                value={opt.value}
                checked={selectedStatus === opt.value}
                onChange={() => setSelectedStatus(opt.value)}
                className="accent-primary"
              />
              <span className={cn('text-sm font-medium', opt.color)}>{opt.label}</span>
            </label>
          ))}
        </div>
      </ConfirmationDialog>
    </div>
  )
}

function CoordinateDisplay({ lat, lng, mapsUrl }: { lat: number; lng: number; mapsUrl: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    void navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-foreground">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
      <button onClick={copy} title="Copy coordinates" className="text-muted-foreground hover:text-foreground transition-colors">
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" title="Open in Google Maps"
        className="text-primary hover:text-primary/80 transition-colors">
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
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
        <div className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}
