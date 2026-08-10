import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight, Home } from 'lucide-react'
import { getBreadcrumbs } from '@/core/navigation/breadcrumbs'
import { cn } from '@/lib/utils'

export function Breadcrumb() {
  const routerState = useRouterState()
  const path = routerState.location.pathname
  const crumbs = getBreadcrumbs(path)

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:block">
      <ol className="flex items-center gap-1" role="list">
        <li>
          <Link
            to="/dashboard"
            aria-label="Dashboard"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </li>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1
          const isFirst = idx === 0 && crumb.label === 'Dashboard'
          if (isFirst) return null
          return (
            <li key={idx} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />
              {isLast || !crumb.path ? (
                <span
                  className={cn(
                    'text-sm font-medium',
                    isLast ? 'text-foreground' : 'text-muted-foreground',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
