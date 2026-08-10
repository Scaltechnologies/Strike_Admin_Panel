import { lazy, Suspense } from 'react'
import { createRoute, Outlet } from '@tanstack/react-router'
import { rootRoute } from './route-config'
import { GuestGuard } from '@/core/guards/GuestGuard'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoadingScreen } from '@/components/common/LoadingScreen'

export const authGroupRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-group',
  component: () => (
    <GuestGuard>
      <AuthLayout>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </AuthLayout>
    </GuestGuard>
  ),
})

export const loginRoute = createRoute({
  getParentRoute: () => authGroupRoute,
  path: '/login',
  component: lazy(() =>
    import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
  ),
})
