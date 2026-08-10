import { Phone, Mail, MapPin, Calendar, Clock, User } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, formatRelative } from '@/utils/helpers/date'
import { cn } from '@/lib/utils'
import type { UserDetails } from '../types/user.types'

interface UserProfileCardProps {
  details: UserDetails
  isLoading: boolean
}

export function UserProfileCard({ details, isLoading }: UserProfileCardProps) {
  const { auth, profile } = details

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  const displayName = profile?.name ?? 'No name'
  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : auth.mobileNumber.slice(-2)

  return (
    <div className="space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{displayName}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StatusBadge
              status={auth.verified ? 'verified' : 'pending'}
              label={auth.verified ? 'Verified' : 'Unverified'}
              size="sm"
              dot
            />
            <StatusBadge
              status={auth.banned ? 'error' : 'active'}
              label={auth.banned ? 'Banned' : 'Active'}
              size="sm"
              dot
            />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="divide-y divide-border rounded-xl border border-border">
        <InfoRow icon={<Phone className="h-4 w-4" />} label="Mobile">
          <span className="font-mono text-sm">{auth.mobileNumber}</span>
        </InfoRow>

        {profile?.email && (
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
            <span className="text-sm">{profile.email}</span>
          </InfoRow>
        )}

        <InfoRow icon={<User className="h-4 w-4" />} label="User ID">
          <span className="font-mono text-sm text-muted-foreground">#{auth.id}</span>
        </InfoRow>

        {profile?.latitude != null && profile.longitude != null && (
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location">
            <span className="text-sm text-muted-foreground">
              {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
            </span>
          </InfoRow>
        )}

        <InfoRow icon={<Calendar className="h-4 w-4" />} label="Joined">
          <span className="text-sm text-muted-foreground">{formatDate(auth.createdAt)}</span>
        </InfoRow>

        <InfoRow icon={<Clock className="h-4 w-4" />} label="Last Active">
          <span className="text-sm text-muted-foreground" title={formatDate(auth.updatedAt)}>
            {formatRelative(auth.updatedAt)}
          </span>
        </InfoRow>

        {profile?.lastLocationAt && (
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location At">
            <span className="text-sm text-muted-foreground">
              {formatRelative(profile.lastLocationAt)}
            </span>
          </InfoRow>
        )}
      </div>
    </div>
  )
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  className?: string
}

function InfoRow({ icon, label, children, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', className)}>
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
