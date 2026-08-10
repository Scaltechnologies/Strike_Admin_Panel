import { Hourglass } from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'

export function PlaceholderPage() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const pageName =
    path
      .replace(/^\//, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Page'

  return (
    <div className="flex h-full flex-col p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{pageName}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">This section is under development</p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Hourglass className="h-8 w-8 text-muted-foreground/60" aria-hidden />
          </div>
          <h2 className="text-base font-semibold text-foreground">Coming Soon</h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            The <span className="font-medium text-foreground">{pageName}</span> module is being built.
            Backend endpoints are ready.
          </p>
        </div>
      </div>
    </div>
  )
}
