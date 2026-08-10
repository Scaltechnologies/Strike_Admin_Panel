/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createRoute, Outlet, redirect } from '@tanstack/react-router'
import { rootRoute } from './route-config'
import { AuthGuard } from '@/core/guards/AuthGuard'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { APP_ROUTES } from '@/constants/routes/app-routes'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const UsersPage = lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const VendorsPage = lazy(() =>
  import('@/features/vendors/VendorsPage').then((m) => ({ default: m.VendorsPage })),
)
const BranchesPage = lazy(() =>
  import('@/features/branches/BranchesPage').then((m) => ({ default: m.BranchesPage })),
)
const CouponsPage = lazy(() =>
  import('@/features/coupons/CouponsPage').then((m) => ({ default: m.CouponsPage })),
)
const MenusPage = lazy(() =>
  import('@/features/menus/MenusPage').then((m) => ({ default: m.MenusPage })),
)
const CardsPage = lazy(() =>
  import('@/features/cards/CardsPage').then((m) => ({ default: m.CardsPage })),
)
const RedemptionsPage = lazy(() =>
  import('@/features/redemptions/RedemptionsPage').then((m) => ({ default: m.RedemptionsPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const WithdrawalsPage = lazy(() =>
  import('@/features/withdrawals/WithdrawalsPage').then((m) => ({ default: m.WithdrawalsPage })),
)
const PaymentsPage = lazy(() =>
  import('@/features/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
)
const BannersPage = lazy(() =>
  import('@/features/banners/BannersPage').then((m) => ({ default: m.BannersPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const AuditLogsPage = lazy(() =>
  import('@/features/audit-logs/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const ApiKeysPage = lazy(() =>
  import('@/features/api-keys/ApiKeysPage').then((m) => ({ default: m.ApiKeysPage })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)

export const protectedGroupRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected-group',
  component: () => (
    <AuthGuard>
      <DashboardLayout>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  ),
})

export const indexRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: APP_ROUTES.DASHBOARD }) },
})

export const dashboardRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/dashboard',
  component: DashboardPage,
})

// ── Placeholder routes (Phase 3 will implement these) ────────────────────────

export const analyticsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

export const usersRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/users',
  component: UsersPage,
})

export const vendorsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/vendors',
  component: VendorsPage,
})

export const branchesRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/branches',
  component: BranchesPage,
})

export const paymentsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/payments',
  component: PaymentsPage,
})

export const withdrawalsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/withdrawals',
  component: WithdrawalsPage,
})

export const cardsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/cards',
  component: CardsPage,
})

export const redemptionsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/redemptions',
  component: RedemptionsPage,
})

export const couponsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/coupons',
  component: CouponsPage,
})

export const bannersRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/banners',
  component: BannersPage,
})

export const menusRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/menus',
  component: MenusPage,
})

interface NotificationsSearch {
  tab?: string
}

export const notificationsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/notifications',
  validateSearch: (search: Record<string, unknown>): NotificationsSearch => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: NotificationsPage,
})

export const reportsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/reports',
  component: ReportsPage,
})

export const settingsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/settings',
  component: SettingsPage,
})

export const auditLogsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/audit-logs',
  component: AuditLogsPage,
})

export const apiKeysRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/api-keys',
  component: ApiKeysPage,
})

export const profileRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/profile',
  component: ProfilePage,
})

export const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: APP_ROUTES.UNAUTHORIZED,
  component: lazy(() =>
    import('@/features/unauthorized/UnauthorizedPage').then((m) => ({
      default: m.UnauthorizedPage,
    })),
  ),
})
