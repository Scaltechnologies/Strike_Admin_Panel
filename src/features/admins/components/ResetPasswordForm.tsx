import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useResetAdminPassword } from '../hooks/useAdmins'
import type { AdminAccount } from '../types/admin.types'

interface ResetPasswordFormProps {
  target: AdminAccount | null
  onClose: () => void
}

const inputCls =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

export function ResetPasswordForm({ target, onClose }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const { mutate: reset, isPending } = useResetAdminPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    if (password !== confirm) {
      toast.error('The two passwords do not match.')
      return
    }
    reset({ id: target.id, newPassword: password }, { onSuccess: onClose })
  }

  return (
    <AnimatePresence>
      {target && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl"
            role="dialog" aria-modal="true" aria-labelledby="reset-pw-title"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 id="reset-pw-title" className="text-base font-semibold text-foreground">Set New Password</h2>
                <p className="truncate text-xs text-muted-foreground">{target.email}</p>
              </div>
              <button onClick={onClose} aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="flex-1 space-y-4">
                {(['new', 'confirm'] as const).map((which) => (
                  <div key={which}>
                    <label htmlFor={`reset-${which}`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {which === 'new' ? 'New Password' : 'Confirm New Password'} <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input id={`reset-${which}`} type={show ? 'text' : 'password'} className={cn(inputCls)}
                        value={which === 'new' ? password : confirm}
                        onChange={(e) => (which === 'new' ? setPassword : setConfirm)(e.target.value)}
                        required minLength={8} maxLength={100} autoComplete="new-password"
                        placeholder="At least 8 characters" disabled={isPending} />
                      {which === 'new' && (
                        <button type="button" onClick={() => setShow((v) => !v)}
                          aria-label={show ? 'Hide passwords' : 'Show passwords'}
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  They&apos;ll be signed out within an hour and must sign in again with this password.
                </p>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <button type="button" onClick={onClose} disabled={isPending}
                  className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {isPending ? 'Saving…' : 'Set Password'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
