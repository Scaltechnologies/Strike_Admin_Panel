import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth-store'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import { cn } from '@/lib/utils'

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role

  function handleLogout() {
    setOpen(false)
    logout()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm',
          'transition-colors hover:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {/* Avatar */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="hidden flex-col items-start md:flex">
          <span className="max-w-28 truncate text-xs font-medium text-foreground leading-tight">
            {user.name}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">{roleLabel}</span>
        </div>
        <ChevronDown
          className={cn('hidden h-3 w-3 text-muted-foreground transition-transform md:block', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
            role="menu"
          >
            {/* User info */}
            <div className="border-b border-border px-3 py-2.5 mb-1.5">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-primary" aria-hidden />
                <span className="text-[11px] font-medium text-primary">{roleLabel}</span>
                {user.branchId && (
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    · Branch {user.branchId}
                  </span>
                )}
              </div>
            </div>

            {/* Menu items */}
            <button
              role="menuitem"
              onClick={() => { setOpen(false); void navigate({ to: APP_ROUTES.PROFILE }) }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground',
                'transition-colors hover:bg-accent hover:text-foreground',
                'focus-visible:outline-none focus-visible:bg-accent',
              )}
            >
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
              My Profile
            </button>
            <button
              role="menuitem"
              onClick={() => { setOpen(false); void navigate({ to: APP_ROUTES.SETTINGS }) }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground',
                'transition-colors hover:bg-accent hover:text-foreground',
                'focus-visible:outline-none focus-visible:bg-accent',
              )}
            >
              <Settings className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Settings
            </button>

            <div className="my-1.5 h-px bg-border" role="separator" />

            <button
              role="menuitem"
              onClick={handleLogout}
              disabled={isPending}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
                'text-destructive transition-colors hover:bg-destructive/10',
                'focus-visible:outline-none focus-visible:bg-destructive/10',
                'disabled:opacity-50',
              )}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
