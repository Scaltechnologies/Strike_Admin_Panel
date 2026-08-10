import { useState } from 'react'
import { User, Mail, Phone, Search, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { ROLES, ROLE_LABELS } from '@/constants/roles'
import {
  useBranchManagers,
  useAllAdminUsers,
  useAssignBranchManager,
} from '../hooks/useBranches'
import type { Branch, BranchAdminUser } from '../types/branch.types'

interface BranchManagersCardProps {
  branch: Branch
}

export function BranchManagersCard({ branch }: BranchManagersCardProps) {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [showPicker, setShowPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: managers, isLoading } = useBranchManagers(branch.id)
  const { data: allAdmins } = useAllAdminUsers(isSuperAdmin && showPicker)
  const { mutate: assign, isPending: assigning } = useAssignBranchManager()

  const filteredAdmins = allAdmins?.filter((a) => {
    if (!a.active) return false
    const q = searchQuery.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    )
  }) ?? []

  function handleAssign(adminId: number) {
    assign(
      { branchId: branch.id, adminId },
      {
        onSuccess: () => {
          setShowPicker(false)
          setSearchQuery('')
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-400/10">
            <User className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Branch Managers</p>
            <p className="text-xs text-muted-foreground">Admins assigned to this branch</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowPicker((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <UserPlus className="h-3 w-3" aria-hidden />
            Assign Manager
          </button>
        )}
      </div>

      {/* Picker */}
      {showPicker && isSuperAdmin && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search admins by name or email…"
              className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {filteredAdmins.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {allAdmins ? 'No matching admins.' : 'Loading admins…'}
            </p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredAdmins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => handleAssign(admin.id)}
                  disabled={assigning}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted disabled:opacity-60"
                >
                  <div>
                    <p className="font-medium text-foreground">{admin.name ?? admin.email}</p>
                    <p className="text-muted-foreground">{admin.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {ROLE_LABELS[admin.role as keyof typeof ROLE_LABELS] ?? admin.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Managers list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !managers || managers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/10 py-10 text-center">
          <User className="mb-2 h-7 w-7 text-muted-foreground/40" aria-hidden />
          <p className="text-sm text-muted-foreground">No managers assigned to this branch.</p>
          {isSuperAdmin && (
            <p className="mt-1 text-xs text-muted-foreground">
              Use "Assign Manager" above to add one.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {managers.map((mgr) => (
            <ManagerCard key={mgr.id} manager={mgr} />
          ))}
        </div>
      )}
    </div>
  )
}

function ManagerCard({ manager }: { manager: BranchAdminUser }) {
  const roleLabel =
    ROLE_LABELS[manager.role as keyof typeof ROLE_LABELS] ?? manager.role

  const displayName = manager.name || manager.email
  const initials = (manager.name ?? manager.email)
    .split(/\s+/)
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/10 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-400/10 dark:text-violet-400">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              manager.role === 'SUPER_ADMIN'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400',
            )}
          >
            {roleLabel}
          </span>
          {!manager.active && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
              Inactive
            </span>
          )}
        </div>
        {manager.email && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{manager.email}</span>
          </div>
        )}
        {manager.phone && (
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" aria-hidden />
            {manager.phone}
          </div>
        )}
      </div>
    </div>
  )
}
