import { useState } from 'react'
import { User, Shield, Mail, Phone, Calendar, Lock, Eye, EyeOff } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { formatDate } from '@/utils/helpers/date'
import { ROLE_LABELS } from '@/constants/roles'
import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { Role } from '@/constants/roles'

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      axiosInstance.patch(ENDPOINTS.AUTH.CHANGE_PASSWORD, body).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: () => toast.success('Password changed successfully.'),
    onError: () => toast.error('Failed to change password. Check your current password.'),
  })
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const roleLabel = ROLE_LABELS[(user?.role ?? '') as Role] ?? user?.role ?? '—'

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { mutate: changePassword, isPending } = useChangePassword()

  function setField(f: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [f]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    changePassword(
      { currentPassword: form.currentPassword, newPassword: form.newPassword },
      { onSuccess: () => setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) },
    )
  }

  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your account information and security settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar + info card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-md shadow-primary/20">
                {initials}
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground">{user.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                {roleLabel}
              </span>
            </div>

            {/* Details */}
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Full Name</p>
                  <p className="truncate font-medium text-foreground">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="truncate font-medium text-foreground">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="truncate font-medium text-foreground">{user.phone}</p>
                  </div>
                </div>
              )}

              {user.lastLoginAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last Login</p>
                    <p className="truncate font-medium text-foreground">{formatDate(user.lastLoginAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground">Use a strong password with at least 8 characters</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Current Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={form.currentPassword}
                    onChange={(e) => setField('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                    disabled={isPending}
                    className={cn(INPUT_CLS, 'pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  New Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={form.newPassword}
                    onChange={(e) => setField('newPassword', e.target.value)}
                    placeholder="Minimum 8 characters"
                    disabled={isPending}
                    className={cn(INPUT_CLS, 'pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Confirm New Password <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  placeholder="Repeat new password"
                  disabled={isPending}
                  className={cn(
                    INPUT_CLS,
                    form.confirmPassword && form.confirmPassword !== form.newPassword
                      ? 'border-destructive focus:ring-destructive'
                      : '',
                  )}
                />
                {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                  <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !form.currentPassword ||
                    !form.newPassword ||
                    form.newPassword !== form.confirmPassword
                  }
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Permissions */}
          {user.permissions.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
