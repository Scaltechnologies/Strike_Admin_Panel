import { lazy, Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'

const TanStackRouterDevtools =
  import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/router-devtools').then((m) => ({
          default: m.TanStackRouterDevtools,
        })),
      )
    : () => null

export function RootComponent() {
  return (
    <>
      <Outlet />
      <Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </>
  )
}
