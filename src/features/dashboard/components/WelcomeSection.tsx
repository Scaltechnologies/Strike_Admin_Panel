import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { formatDate } from '@/utils/helpers/date'

export function WelcomeSection() {
  const user = useAuthStore((s) => s.user)

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = formatDate(new Date().toISOString())
  const roleLabel = user ? (ROLE_LABELS[user.role as Role] ?? user.role) : ''

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {today}
          {roleLabel && (
            <>
              <span className="mx-2 text-border">·</span>
              <span className="font-medium text-foreground">{roleLabel}</span>
            </>
          )}
          {user?.branchId && (
            <>
              <span className="mx-2 text-border">·</span>
              <span>Branch {user.branchId}</span>
            </>
          )}
        </p>
      </div>
      <p className="hidden text-xs text-muted-foreground sm:block">
        Platform overview — real-time data
      </p>
    </div>
  )
}
