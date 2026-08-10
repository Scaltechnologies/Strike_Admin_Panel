import { useState } from 'react'
import { MapPin, Phone, Mail, Ruler, CheckCircle2, XCircle, Edit2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from '@/constants/roles'
import { useActivateBranch, useDeactivateBranch } from '../hooks/useBranches'
import { BranchForm } from './BranchForm'
import type { Branch } from '../types/branch.types'

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

interface BranchProfileCardProps {
  branch: Branch
  isLoading?: boolean
}

export function BranchProfileCard({ branch, isLoading }: BranchProfileCardProps) {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const [showEditForm, setShowEditForm] = useState(false)

  const { mutate: activate, isPending: activating } = useActivateBranch()
  const { mutate: deactivate, isPending: deactivating } = useDeactivateBranch()
  const isToggling = activating || deactivating

  const mapsUrl =
    branch.latitude != null && branch.longitude != null
      ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`
      : null

  const locationStr = [branch.city, branch.state, branch.country].filter(Boolean).join(', ')

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Status row + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            branch.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              branch.isActive ? 'bg-green-500' : 'bg-gray-400',
            )}
          />
          {branch.isActive ? 'Active' : 'Inactive'}
        </span>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                branch.isActive ? deactivate(branch.id) : activate(branch.id)
              }
              disabled={isToggling}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
                branch.isActive
                  ? 'border border-border text-foreground hover:bg-muted'
                  : 'bg-green-600 text-white hover:bg-green-700',
              )}
            >
              {branch.isActive ? (
                <>
                  <XCircle className="h-3 w-3" aria-hidden />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Edit2 className="h-3 w-3" aria-hidden />
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20 px-4">
        {locationStr && (
          <InfoRow icon={MapPin} label="Location" value={locationStr} />
        )}
        {branch.address && (
          <InfoRow icon={MapPin} label="Address" value={branch.address} />
        )}
        <InfoRow
          icon={Ruler}
          label="Operational Radius"
          value={`${branch.radiusKm} km`}
        />
        {branch.contactEmail && (
          <InfoRow
            icon={Mail}
            label="Contact Email"
            value={
              <a
                href={`mailto:${branch.contactEmail}`}
                className="text-primary hover:underline"
              >
                {branch.contactEmail}
              </a>
            }
          />
        )}
        {branch.contactPhone && (
          <InfoRow
            icon={Phone}
            label="Contact Phone"
            value={<span className="font-mono">{branch.contactPhone}</span>}
          />
        )}
        {mapsUrl && (
          <InfoRow
            icon={MapPin}
            label="Coordinates"
            value={
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {branch.latitude}, {branch.longitude}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            }
          />
        )}
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {new Date(branch.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Last Updated</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {new Date(branch.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {showEditForm && (
        <BranchForm branch={branch} onClose={() => setShowEditForm(false)} />
      )}
    </div>
  )
}
