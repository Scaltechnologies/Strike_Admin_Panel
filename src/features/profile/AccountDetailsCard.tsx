import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { mapAdminResponseToUser } from '@/utils/helpers/auth-mapper'
import { adminsApi } from '@/features/admins/api/admins.api'
import { apiErrorMessage } from '@/features/admins/hooks/useAdmins'
import type { UpdateMyProfilePayload } from '@/features/admins/types/admin.types'

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

/** Lets any admin change their own name, login email and phone. */
export function AccountDetailsCard() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    currentPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: save, isPending } = useMutation({
    mutationFn: (payload: UpdateMyProfilePayload) => adminsApi.updateMe(payload),
    meta: { suppressError: true },
    onSuccess: (dto, sent) => {
      const fresh = mapAdminResponseToUser(dto)
      updateUser({ name: fresh.name, email: fresh.email, phone: fresh.phone })
      setForm((p) => ({ ...p, name: fresh.name, email: fresh.email, phone: fresh.phone ?? '', currentPassword: '' }))
      // currentPassword is only sent when the email changed
      toast.success(sent.currentPassword ? `Saved. Sign in with ${fresh.email} from now on.` : 'Profile saved.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to save your details.')),
  })

  if (!user) return null

  const emailChanged = form.email.trim().toLowerCase() !== user.email.toLowerCase()
  const dirty =
    form.name.trim() !== user.name || emailChanged || form.phone.trim() !== (user.phone ?? '')

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      currentPassword: emailChanged ? form.currentPassword : undefined,
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <UserPen className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Account Details</h3>
          <p className="text-xs text-muted-foreground">Your name, login email and phone number</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="me-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input id="me-name" className={INPUT_CLS} value={form.name} required maxLength={100}
              onChange={(e) => set('name', e.target.value)} disabled={isPending} />
          </div>
          <div>
            <label htmlFor="me-phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone</label>
            <input id="me-phone" type="tel" className={INPUT_CLS} value={form.phone} maxLength={20}
              onChange={(e) => set('phone', e.target.value)} placeholder="Optional" disabled={isPending} />
          </div>
        </div>

        <div>
          <label htmlFor="me-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Email (login ID) <span className="text-destructive">*</span>
          </label>
          <input id="me-email" type="email" className={INPUT_CLS} value={form.email} required autoComplete="email"
            onChange={(e) => set('email', e.target.value)} disabled={isPending} />
        </div>

        {emailChanged && (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-400/5">
            <label htmlFor="me-current-pw" className="mb-1.5 block text-xs font-medium text-amber-800 dark:text-amber-300">
              Enter your current password to change your login email <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input id="me-current-pw" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                className={cn(INPUT_CLS, 'pr-10')} value={form.currentPassword}
                onChange={(e) => set('currentPassword', e.target.value)} disabled={isPending} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-amber-800/80 dark:text-amber-300/80">
              After saving, you sign in with the new email. Your password stays the same.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isPending || !dirty || (emailChanged && !form.currentPassword)}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
            {isPending ? 'Saving…' : 'Save Details'}
          </button>
        </div>
      </form>
    </div>
  )
}
