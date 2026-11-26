import { useCallback, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { KeyRound, Pencil, Plus, Power, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS } from '@/constants/roles'
import { formatDateTime } from '@/utils/helpers/date'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { useAdminList, useSetAdminActive } from './hooks/useAdmins'
import { AdminForm } from './components/AdminForm'
import { ResetPasswordForm } from './components/ResetPasswordForm'
import type { AdminAccount } from './types/admin.types'

export function AdminsPage() {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data, isLoading, isError, refetch } = useAdminList()
  const { mutate: setActive, isPending: togglingStatus } = useSetAdminActive()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminAccount | null>(null)
  const [createNonce, setCreateNonce] = useState(0)
  const [resetTarget, setResetTarget] = useState<AdminAccount | null>(null)
  const [statusTarget, setStatusTarget] = useState<AdminAccount | null>(null)

  const openCreate = useCallback(() => { setEditing(null); setCreateNonce((n) => n + 1); setFormOpen(true) }, [])
  const openEdit = useCallback((a: AdminAccount) => { setEditing(a); setFormOpen(true) }, [])
  const closeForm = useCallback(() => setFormOpen(false), [])

  const admins = data ?? []
  const isSelf = (a: AdminAccount) => String(a.id) === currentUserId

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Admins</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Give people their own login to this panel, and control what they can do
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Admin
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">Super Admin</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Everything, including adding, editing and disabling admins.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">Admin</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Every screen in the panel, except this Admins page.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            All Admins{data ? <span className="ml-1.5 text-muted-foreground">({admins.length})</span> : null}
          </p>
        </div>

        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <div className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  </div>
                ))
              : admins.map((a) => {
                  const self = isSelf(a)
                  const initials = a.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div key={a.id} className={cn('flex flex-wrap items-center gap-4 px-5 py-4', !a.active && 'opacity-60')}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials || <ShieldCheck className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-medium text-foreground">{a.name}</p>
                          {self && <span className="text-xs text-muted-foreground">(you)</span>}
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            a.role === 'SUPER_ADMIN'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400',
                          )}>
                            {ROLE_LABELS[a.role] ?? a.role}
                          </span>
                          {!a.active && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">{a.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {a.lastLoginAt ? `Last sign-in ${formatDateTime(a.lastLoginAt)}` : 'Never signed in'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button onClick={() => openEdit(a)}
                          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        {!self && (
                          <>
                            <button onClick={() => setResetTarget(a)}
                              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                              <KeyRound className="h-3.5 w-3.5" />
                              Set password
                            </button>
                            <button onClick={() => setStatusTarget(a)}
                              className={cn(
                                'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                                a.active
                                  ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                              )}>
                              <Power className="h-3.5 w-3.5" />
                              {a.active ? 'Disable' : 'Enable'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        To change your own email or password, use your <Link to="/profile" className="font-medium text-primary hover:underline">Profile</Link> page.
      </p>

      <AdminForm
        key={editing ? `edit-${editing.id}` : `create-${createNonce}`}
        open={formOpen}
        onClose={closeForm}
        editing={editing}
        isSelf={editing ? isSelf(editing) : false}
      />

      <ResetPasswordForm key={resetTarget?.id ?? 'none'} target={resetTarget} onClose={() => setResetTarget(null)} />

      <ConfirmationDialog
        open={statusTarget !== null}
        title={statusTarget?.active ? 'Disable this admin?' : 'Enable this admin?'}
        description={
          statusTarget?.active
            ? `${statusTarget.email} won't be able to sign in. They're signed out within an hour. You can enable them again any time.`
            : `${statusTarget?.email ?? ''} will be able to sign in again with their existing password.`
        }
        confirmLabel={statusTarget?.active ? 'Disable' : 'Enable'}
        variant={statusTarget?.active ? 'destructive' : 'default'}
        isLoading={togglingStatus}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => {
          if (!statusTarget) return
          setActive({ id: statusTarget.id, active: !statusTarget.active }, { onSuccess: () => setStatusTarget(null) })
        }}
      />
    </div>
  )
}
