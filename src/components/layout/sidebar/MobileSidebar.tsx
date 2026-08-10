import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Zap, LogOut, Shield, User } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { SIDEBAR_NAVIGATION } from '@/core/navigation/sidebar'
import { SidebarNavGroup } from './SidebarNavGroup'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import env from '@/config/env'
import { cn } from '@/lib/utils'

export function MobileSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()
  const navigate = useNavigate()
  const close = useCallback(() => setMobileSidebarOpen(false), [setMobileSidebarOpen])

  useEffect(() => {
    if (!mobileSidebarOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [mobileSidebarOpen, close])

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileSidebarOpen])

  const initials = user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  const roleLabel = user ? (ROLE_LABELS[user.role as Role] ?? user.role) : ''

  return (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={close} aria-hidden
          />
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card shadow-2xl lg:hidden"
            role="dialog" aria-modal="true" aria-label="Mobile navigation"
          >
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/30">
                  <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-foreground">Strike Admin</p>
                  <p className="text-[10px] text-muted-foreground">Management Console</p>
                </div>
              </div>
              <button onClick={close} aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Mobile navigation">
              {SIDEBAR_NAVIGATION.map((group) => (
                <SidebarNavGroup key={group.title} group={group} onMobileClose={close} />
              ))}
            </nav>

            {/* Footer */}
            <div className="shrink-0 border-t border-border p-3 space-y-1">
              <button
                onClick={() => { close(); void navigate({ to: APP_ROUTES.PROFILE }) }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-semibold text-foreground">{user?.name ?? '—'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield className="h-2.5 w-2.5 text-primary shrink-0" />
                    <p className="truncate text-[10px] text-muted-foreground">{roleLabel}</p>
                  </div>
                </div>
                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </button>

              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-muted-foreground/60">v{env.version}</span>
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                  env.isDevelopment
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-400',
                )}>
                  {env.environment}
                </span>
                <button
                  onClick={() => logout()}
                  disabled={isPending}
                  className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {isPending ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
