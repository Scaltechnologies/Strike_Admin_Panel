import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SECTIONS } from '@/constants/sections'
import { useCreateAdmin, useUpdateAdmin } from '../hooks/useAdmins'
import type { AdminAccount, AdminAccountRole } from '../types/admin.types'
import { SectionPicker } from './SectionPicker'

const SECTION_CODES = new Set<string>(SECTIONS.map((s) => s.code))

/** Section codes stored in an admin's permissions string. */
function sectionsOf(admin: AdminAccount | null): string[] {
  if (!admin?.permissions) return []
  return admin.permissions.split(',').map((p) => p.trim()).filter((p) => SECTION_CODES.has(p))
}

interface AdminFormProps {
  open: boolean
  onClose: () => void
  /** null = create a new admin login */
  editing: AdminAccount | null
  /** Your own row: the role can't be changed from here. */
  isSelf: boolean
}

const inputCls =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

const ROLE_OPTIONS: { value: AdminAccountRole; label: string; description: string }[] = [
  { value: 'SUB_ADMIN', label: 'Admin', description: 'Only the sections you tick below.' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Everything, including adding and removing admins.' },
]

export function AdminForm({ open, onClose, editing, isSelf }: AdminFormProps) {
  const isEdit = editing !== null
  const [form, setForm] = useState({
    name: editing?.name ?? '',
    email: editing?.email ?? '',
    phone: editing?.phone ?? '',
    password: '',
    role: (editing?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SUB_ADMIN') as AdminAccountRole,
    sections: sectionsOf(editing),
  })
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: create, isPending: creating } = useCreateAdmin()
  const { mutate: update, isPending: updating } = useUpdateAdmin()
  const isPending = creating || updating

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.role === 'SUB_ADMIN' && form.sections.length === 0) {
      toast.error('Tick at least one section this admin can access.')
      return
    }
    const base = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      phone: form.phone.trim() || undefined,
      sections: form.role === 'SUB_ADMIN' ? form.sections : undefined,
    }
    if (isEdit) {
      update({ id: editing.id, payload: base }, { onSuccess: onClose })
    } else {
      create({ ...base, password: form.password }, { onSuccess: onClose })
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
            role="dialog" aria-modal="true" aria-labelledby="admin-form-title"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="admin-form-title" className="text-base font-semibold text-foreground">
                {isEdit ? 'Edit Admin' : 'Add Admin'}
              </h2>
              <button onClick={onClose} aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="flex-1 space-y-4">
                <div>
                  <label htmlFor="admin-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input id="admin-name" className={inputCls} value={form.name} required maxLength={100}
                    onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ravi Kumar" disabled={isPending} />
                </div>

                <div>
                  <label htmlFor="admin-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Email (login ID) <span className="text-destructive">*</span>
                  </label>
                  <input id="admin-email" type="email" className={inputCls} value={form.email} required autoComplete="off"
                    onChange={(e) => set('email', e.target.value)} placeholder="name@company.com" disabled={isPending} />
                  {isEdit && !isSelf && (
                    <p className="mt-1 text-xs text-muted-foreground">If you change it, they sign in with the new email.</p>
                  )}
                </div>

                {!isEdit && (
                  <div>
                    <label htmlFor="admin-password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Password <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input id="admin-password" type={showPassword ? 'text' : 'password'} className={cn(inputCls, 'pr-10')}
                        value={form.password} required minLength={8} maxLength={100} autoComplete="new-password"
                        onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" disabled={isPending} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Share this with the admin yourself. They can change it later from their Profile.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="admin-phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone</label>
                  <input id="admin-phone" type="tel" className={inputCls} value={form.phone} maxLength={20}
                    onChange={(e) => set('phone', e.target.value)} placeholder="Optional" disabled={isPending} />
                </div>

                <fieldset disabled={isPending || isSelf}>
                  <legend className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Access level <span className="text-destructive">*</span>
                  </legend>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <label key={opt.value}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                          form.role === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                          isSelf && 'cursor-not-allowed opacity-60',
                        )}>
                        <input type="radio" name="admin-role" value={opt.value} checked={form.role === opt.value}
                          onChange={() => set('role', opt.value)} className="mt-0.5 accent-primary" />
                        <span>
                          <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground">{opt.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {isSelf && (
                    <p className="mt-1.5 text-xs text-muted-foreground">You can&apos;t change your own access level.</p>
                  )}
                </fieldset>

                {form.role === 'SUB_ADMIN' && (
                  <SectionPicker value={form.sections} onChange={(next) => set('sections', next)} disabled={isPending} />
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <button type="button" onClick={onClose} disabled={isPending}
                  className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
