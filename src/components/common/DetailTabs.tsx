import { useEffect, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import type { Permission } from '@/constants/permissions'
import { SkeletonTable } from './SkeletonLoader'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

// Plain (non-hook) permission check — safe to call conditionally per-tab inside .filter(),
// unlike `usePermission`/`useAnyPermission` whose `use*` naming trips the rules-of-hooks lint
// even though neither actually subscribes to anything (both just read `useAuthStore.getState()`).
function hasPermission(permission: Permission): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  return user.permissions.includes(permission)
}

export interface DetailTab {
  id: string
  label: string
  icon?: LucideIcon
  /** Tab is hidden unless the current admin holds this permission. */
  permission?: Permission
  /** Explicitly hide regardless of permission (e.g. a TODO tab you want to gate off). */
  hidden?: boolean
}

interface DetailTabsProps {
  tabs: DetailTab[]
  activeTab: string
  onChange: (tabId: string) => void
  /** 'page' = pill strip for full-page tab bars, 'drawer' = underline strip for slide-over drawers. */
  variant: 'page' | 'drawer'
  children: ReactNode
  className?: string
}

export function DetailTabs({ tabs, activeTab, onChange, variant, children, className }: DetailTabsProps) {
  const visibleTabs = tabs.filter((tab) => !tab.hidden && (!tab.permission || hasPermission(tab.permission)))

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.id === activeTab)) {
      onChange(visibleTabs[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabs.map((t) => t.id).join(',')])

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div
        role="tablist"
        className={cn(
          'shrink-0 overflow-x-auto',
          variant === 'page'
            ? 'flex w-fit gap-1 rounded-xl border border-border bg-card p-1'
            : 'border-b border-border px-5',
        )}
      >
        <div className={cn('flex', variant === 'drawer' && '-mb-px gap-1')}>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none',
                  variant === 'page'
                    ? cn(
                        'rounded-lg px-4 py-1.5',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    : cn(
                        'border-b-2 px-3 py-3',
                        active
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      ),
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

interface DetailTabPanelProps {
  status: 'loading' | 'error' | 'empty' | 'ready'
  emptyTitle?: string
  emptyDescription?: string
  errorDescription?: string
  onRetry?: () => void
  skeletonRows?: number
  skeletonCols?: number
  children: ReactNode
}

/** Standard loading/empty/error chrome for a single tab panel's content area. */
DetailTabs.Panel = function DetailTabPanel({
  status,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  errorDescription,
  onRetry,
  skeletonRows,
  skeletonCols,
  children,
}: DetailTabPanelProps) {
  if (status === 'loading') {
    return (
      <div className="p-5">
        <SkeletonTable rows={skeletonRows} cols={skeletonCols} />
      </div>
    )
  }
  if (status === 'error') {
    return <ErrorState description={errorDescription} onRetry={onRetry} />
  }
  if (status === 'empty') {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  return <>{children}</>
}
