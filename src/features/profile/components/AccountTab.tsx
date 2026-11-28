import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BadgeCheck, CalendarClock, Eye, EyeOff, Fingerprint, Hash, Info, Mail, Phone, RotateCcw, Save, ShieldCheck, UserPen, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS, type Role } from '@/constants/roles'
import { formatDateTime } from '@/utils/helpers/date'
import { mapAdminResponseToUser } from '@/utils/helpers/auth-mapper'
import { adminsApi } from '@/features/admins/api/admins.api'
import { apiErrorMessage } from '@/features/admins/hooks/useAdmins'
import { initials } from '@/features/audit-logs/utils/audit-display'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import type { UpdateMyProfilePayload } from '@/features/admins/types/admin.types'
import type { AdminMeResponseDto } from '@/types/auth/auth'
import { profileKeys } from '../api/profile.api'

const INPUT =
  'block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm placeholder:text-muted-foreground transition-shadow focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/

function Field({ id, label, icon: Icon, hint, error, children }: { id: string; label: string; icon: typeof Mail; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Fact({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function AccountTab({ me }: { me?: AdminMeResponseDto }) {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', currentPassword: '' })
  const [showPw, setShowPw] = useState(false)

  const save = useMutation({
    mutationFn: (payload: UpdateMyProfilePayload) => adminsApi.updateMe(payload),
    meta: { suppressError: true },
    onSuccess: (dto, sent) => {
      const fresh = mapAdminResponseToUser(dto)
      updateUser({ name: fresh.name, email: fresh.email, phone: fresh.phone })
      setForm({ name: fresh.name, email: fresh.email, phone: fresh.phone ?? '', currentPassword: '' })
      void qc.invalidateQueries({ queryKey: profileKeys.all })
      toast.success(sent.currentPassword ? `Saved. Sign in with ${fresh.email} from now on.` : 'Your details are saved.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Couldn’t save your details.')),
  })

  if (!user) return null
  const name = form.name.trim()
  const email = form.email.trim()
  const phone = form.phone.trim()
  const emailChanged = email.toLowerCase() !== user.email.toLowerCase()
  const dirty = name !== user.name || emailChanged || phone !== (user.phone ?? '')
  const errors = {
    name: !name ? 'Your name is needed' : undefined,
    email: !EMAIL_RE.test(email) ? 'Enter a valid email address' : undefined,
    phone: phone && !PHONE_RE.test(phone) ? 'Use digits, spaces, + or -' : undefined,
  }
  const valid = !errors.name && !errors.email && !errors.phone && (!emailChanged || !!form.currentPassword)
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const reset = () => setForm({ name: user.name, email: user.email, phone: user.phone ?? '', currentPassword: '' })
  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <Panel title="My details" subtitle="Your name, sign-in email and phone number" icon={<UserPen className="h-4 w-4" />} className="xl:col-span-3">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          save.mutate({ name, email, phone: phone || undefined, currentPassword: emailChanged ? form.currentPassword : undefined })
        }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="me-name" label="Full name" icon={UserRound} error={form.name !== user.name ? errors.name : undefined}>
              <input id="me-name" className={INPUT} value={form.name} maxLength={100} autoComplete="name" onChange={(e) => set('name', e.target.value)} disabled={save.isPending} />
            </Field>
            <Field id="me-phone" label="Phone (optional)" icon={Phone} hint="So other admins can reach you" error={errors.phone}>
              <input id="me-phone" type="tel" className={INPUT} value={form.phone} maxLength={20} autoComplete="tel" placeholder="+91 98765 43210" onChange={(e) => set('phone', e.target.value)} disabled={save.isPending} />
            </Field>
          </div>
          <Field id="me-email" label="Email (you sign in with this)" icon={Mail} error={emailChanged ? errors.email : undefined}>
            <input id="me-email" type="email" className={INPUT} value={form.email} autoComplete="email" onChange={(e) => set('email', e.target.value)} disabled={save.isPending} />
          </Field>

          {emailChanged && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 dark:border-amber-400/20 dark:bg-amber-400/5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300"><ShieldCheck className="h-3.5 w-3.5" />Confirm it’s you to change your sign-in email</p>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="Your current password" value={form.currentPassword}
                  onChange={(e) => set('currentPassword', e.target.value)} disabled={save.isPending}
                  className={cn(INPUT, 'pl-3 pr-10')} aria-label="Current password" />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <p className="mt-1.5 text-xs text-amber-800/80 dark:text-amber-300/80">After saving, you sign in with <b>{email || 'the new email'}</b>. Your password stays the same.</p>
            </motion.div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            {dirty && <button type="button" onClick={reset} disabled={save.isPending} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><RotateCcw className="h-4 w-4" />Undo changes</button>}
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={save.isPending || !dirty || !valid}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e01a00] to-[#ff6a00] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/20 disabled:opacity-50 disabled:shadow-none">
              <Save className="h-4 w-4" />{save.isPending ? 'Saving…' : 'Save details'}
            </motion.button>
          </div>
        </form>
      </Panel>

      <div className="flex flex-col gap-4 xl:col-span-2">
        <Panel title="How others see you" subtitle="Your name in audit logs, approvals and alerts" icon={<BadgeCheck className="h-4 w-4" />}>
          <motion.div layout className="relative overflow-hidden rounded-2xl bg-[#0b0c10] p-5 text-white">
            <div className="auth-aurora pointer-events-none absolute inset-0 opacity-60" aria-hidden><span /><span /><span /></div>
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-300 via-[#ff4d1c] to-[#e01a00] text-lg font-bold">{initials(name || user.name)}</span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{name || 'Your name'}</p>
                <p className="truncate text-xs text-white/60">{email || 'email'}</p>
                {phone && <p className="truncate text-xs text-white/60">{phone}</p>}
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/50">
              <span>Strike admin · {roleLabel}</span>
              {dirty && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-semibold text-amber-200">Not saved yet</span>}
            </div>
          </motion.div>
        </Panel>

        <Panel title="Account facts" icon={<Info className="h-4 w-4" />}>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Fact icon={Hash} label="Account number" value={`#${user.id}`} />
            <Fact icon={ShieldCheck} label="Role" value={roleLabel} />
            <Fact icon={Fingerprint} label="Status" value={me?.active === false ? 'Switched off' : 'Active'} />
            <Fact icon={CalendarClock} label="Created" value={me?.createdAt ? formatDateTime(me.createdAt) : '—'} />
            <Fact icon={CalendarClock} label="Last changed" value={me?.updatedAt ? formatDateTime(me.updatedAt) : '—'} />
            <Fact icon={CalendarClock} label="Last sign-in" value={me?.lastLoginAt ? formatDateTime(me.lastLoginAt) : '—'} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Your role and what you can access are set by a Super Admin on the Admins page.</p>
        </Panel>
      </div>
    </div>
  )
}
