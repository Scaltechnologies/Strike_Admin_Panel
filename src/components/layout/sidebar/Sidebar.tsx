import { memo } from 'react'
import { motion } from 'framer-motion'
import { Zap, LogOut, Sun, Moon, User, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { useTheme } from '@/core/theme/use-theme'
import { SIDEBAR_NAVIGATION } from '@/core/navigation/sidebar'
import { SidebarNavGroup } from './SidebarNavGroup'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import env from '@/config/env'

const EXPANDED_WIDTH = 256
const COLLAPSED_WIDTH = 76

export const Sidebar = memo(function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { mutate: logout, isPending } = useLogout()
  const { resolvedTheme, setTheme } = useTheme()
  const navigate = useNavigate()
  const collapsed = sidebarCollapsed

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const roleLabel = user ? (ROLE_LABELS[user.role as Role] ?? user.role) : ''
  const isDark = resolvedTheme === 'dark'

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-border bg-card lg:flex"
      aria-label="Sidebar navigation"
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute -right-3 top-[26px] z-10 flex h-6 w-6 items-center justify-center rounded-full',
          'border border-border bg-card text-muted-foreground shadow-sm transition-colors',
          'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : <ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
      </button>

      {/* Brand */}
      <div className={cn('flex h-16 shrink-0 items-center gap-3 border-b border-border', collapsed ? 'justify-center px-2' : 'px-5')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
          <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} aria-hidden />
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-foreground">Strike Admin</p>
              <p className="text-[10px] text-muted-foreground">Management Console</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                env.isDevelopment
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-400',
              )}>
                {env.environment}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn('flex-1 overflow-y-auto overflow-x-hidden py-5 scrollbar-thin', collapsed ? 'px-2' : 'px-3')}
        aria-label="Main navigation"
      >
        {SIDEBAR_NAVIGATION.map((group) => (
          <SidebarNavGroup key={group.title} group={group} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer: User + actions */}
      <div className={cn('shrink-0 border-t border-border p-3', collapsed ? 'space-y-2' : 'space-y-1')}>
        {/* User profile row */}
        <button
          onClick={() => void navigate({ to: APP_ROUTES.PROFILE })}
          title={collapsed ? (user?.name ?? 'Profile') : undefined}
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors hover:bg-accent',
            collapsed ? 'justify-center px-1' : 'px-3',
          )}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground group-hover:text-foreground">
                  {user?.name ?? '—'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="h-2.5 w-2.5 text-primary shrink-0" aria-hidden />
                  <p className="truncate text-[10px] text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" aria-hidden />
            </>
          )}
        </button>

        {/* Bottom actions row */}
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'gap-1')}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {isDark
              ? <Sun className="h-3.5 w-3.5" aria-hidden />
              : <Moon className="h-3.5 w-3.5" aria-hidden />}
          </button>

          {/* Version */}
          {!collapsed && <span className="flex-1 px-1 text-[10px] text-muted-foreground/60">v{env.version}</span>}

          {/* Logout */}
          <button
            onClick={() => logout()}
            disabled={isPending}
            aria-label="Sign out"
            title="Sign out"
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-lg text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50',
              collapsed ? 'w-8 justify-center px-0' : 'px-2.5',
            )}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {!collapsed && <span>{isPending ? 'Signing out…' : 'Sign out'}</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  )
})
