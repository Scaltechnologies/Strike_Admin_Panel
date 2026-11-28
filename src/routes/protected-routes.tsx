/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createRoute, Outlet, redirect } from '@tanstack/react-router'
import { rootRoute } from './route-config'
import { AuthGuard } from '@/core/guards/AuthGuard'
import { RoleGuard } from '@/core/guards/PermissionGuard'
import { SectionGuard } from '@/core/guards/SectionGuard'
import { ROLES } from '@/constants/roles'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import { isVendorTab } from '@/features/vendors/utils/vendor-tabs'
import { isUserTab } from '@/features/users/utils/user-meta'
import { isMenusTab } from '@/features/menus/utils/menu-tabs'
import { isRedemptionsTab } from '@/features/redemptions/utils/redemption-tabs'
import { isWithdrawalsTab, type WithdrawalsTab } from '@/features/withdrawals/utils/withdrawal-tabs'
import { isSettingsTab, type SettingsTab } from '@/features/settings/utils/settings-meta'
import { isPaymentsTab, type PaymentsTab } from '@/features/payments/utils/payment-meta'

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
const CategoriesPage = lazy(() =>
  import('@/features/categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
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
const StoreCategoriesPage = lazy(() =>
  import('@/features/store-categories/StoreCategoriesPage').then((m) => ({ default: m.StoreCategoriesPage })),
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
        <Suspense fallback={<LoadingScreen variant="inline" />}>
          <SectionGuard>
            <Outlet />
          </SectionGuard>
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

const UserDashboardPage = lazy(() =>
  import('@/features/users/UserDashboardPage').then((m) => ({ default: m.UserDashboardPage })),
)

function UserDashboardRouteComponent() {
  const { userId } = userDashboardRoute.useParams()
  const { tab } = userDashboardRoute.useSearch()
  return <UserDashboardPage key={userId} userId={Number(userId)} tab={tab} />
}

export const userDashboardRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/users/$userId',
  validateSearch: (search: Record<string, unknown>) => ({ tab: isUserTab(search.tab) ? search.tab : undefined }),
  component: UserDashboardRouteComponent,
})

const VendorDashboardPage = lazy(() =>
  import('@/features/vendors/VendorDashboardPage').then((m) => ({ default: m.VendorDashboardPage })),
)

function VendorDashboardRouteComponent() {
  const { vendorId } = vendorDashboardRoute.useParams()
  const { tab } = vendorDashboardRoute.useSearch()
  // key: a fresh page (scroll, tabs, dialogs) when switching between vendors
  return <VendorDashboardPage key={vendorId} vendorId={Number(vendorId)} tab={tab} />
}

export const vendorDashboardRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/vendors/$vendorId',
  validateSearch: (search: Record<string, unknown>) => ({ tab: isVendorTab(search.tab) ? search.tab : undefined }),
  component: VendorDashboardRouteComponent,
})

export const branchesRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/branches',
  component: BranchesPage,
})

function PaymentsRouteComponent() {
  const { tab } = paymentsRoute.useSearch()
  return <PaymentsPage tab={tab} />
}

export const paymentsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/payments',
  validateSearch: (search: Record<string, unknown>): { tab?: PaymentsTab } => ({ tab: isPaymentsTab(search.tab) ? search.tab : undefined }),
  component: PaymentsRouteComponent,
})

const PaymentDetailPage = lazy(() =>
  import('@/features/payments/PaymentDetailPage').then((m) => ({ default: m.PaymentDetailPage })),
)

function PaymentDetailRouteComponent() {
  const { paymentId } = paymentDetailRoute.useParams()
  return <PaymentDetailPage key={paymentId} paymentId={Number(paymentId)} />
}

export const paymentDetailRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/payments/$paymentId',
  component: PaymentDetailRouteComponent,
})

function WithdrawalsRouteComponent() {
  const { tab } = withdrawalsRoute.useSearch()
  return <WithdrawalsPage tab={tab} />
}

export const withdrawalsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/withdrawals',
  validateSearch: (search: Record<string, unknown>): { tab?: WithdrawalsTab } => ({ tab: isWithdrawalsTab(search.tab) ? search.tab : undefined }),
  component: WithdrawalsRouteComponent,
})

const WithdrawalDetailPage = lazy(() =>
  import('@/features/withdrawals/WithdrawalDetailPage').then((m) => ({ default: m.WithdrawalDetailPage })),
)

function WithdrawalDetailRouteComponent() {
  const { withdrawalId } = withdrawalDetailRoute.useParams()
  return <WithdrawalDetailPage key={withdrawalId} withdrawalId={Number(withdrawalId)} />
}

export const withdrawalDetailRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/withdrawals/$withdrawalId',
  component: WithdrawalDetailRouteComponent,
})

export const cardsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/cards',
  component: CardsPage,
})

const CardDetailPage = lazy(() =>
  import('@/features/cards/CardDetailPage').then((m) => ({ default: m.CardDetailPage })),
)

function CardDetailRouteComponent() {
  const { cardId } = cardDetailRoute.useParams()
  return <CardDetailPage key={cardId} cardId={Number(cardId)} />
}

export const cardDetailRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/cards/$cardId',
  component: CardDetailRouteComponent,
})

function RedemptionsRouteComponent() {
  const { tab } = redemptionsRoute.useSearch()
  return <RedemptionsPage tab={tab} />
}

export const redemptionsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/redemptions',
  validateSearch: (search: Record<string, unknown>) => ({ tab: isRedemptionsTab(search.tab) ? search.tab : undefined }),
  component: RedemptionsRouteComponent,
})

const RedemptionDetailPage = lazy(() =>
  import('@/features/redemptions/RedemptionDetailPage').then((m) => ({ default: m.RedemptionDetailPage })),
)

function RedemptionDetailRouteComponent() {
  const { redemptionId } = redemptionDetailRoute.useParams()
  return <RedemptionDetailPage key={redemptionId} redemptionId={Number(redemptionId)} />
}

export const redemptionDetailRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/redemptions/$redemptionId',
  component: RedemptionDetailRouteComponent,
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

export const storeCategoriesRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/store-categories',
  component: StoreCategoriesPage,
})

export const categoriesRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/categories',
  component: CategoriesPage,
})

function MenusRouteComponent() {
  const { tab } = menusRoute.useSearch()
  return <MenusPage tab={tab} />
}

export const menusRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/menus',
  validateSearch: (search: Record<string, unknown>) => ({ tab: isMenusTab(search.tab) ? search.tab : undefined }),
  component: MenusRouteComponent,
})

const StoreMenuPage = lazy(() =>
  import('@/features/menus/StoreMenuPage').then((m) => ({ default: m.StoreMenuPage })),
)

function StoreMenuRouteComponent() {
  const { storeId } = storeMenuRoute.useParams()
  const { upload, card } = storeMenuRoute.useSearch()
  return <StoreMenuPage key={storeId} storeId={Number(storeId)} openUpload={upload} openCard={card} />
}

export const storeMenuRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/menus/$storeId',
  // ?upload / ?card open the menu upload or new-card dialog (used after adding a vendor).
  validateSearch: (search: Record<string, unknown>): { upload?: boolean; card?: boolean } => ({
    upload: search.upload === true || search.upload === 'true' ? true : undefined,
    card: search.card === true || search.card === 'true' ? true : undefined,
  }),
  component: StoreMenuRouteComponent,
})

const VendorImportPage = lazy(() =>
  import('@/features/onboarding/VendorImportPage').then((m) => ({ default: m.VendorImportPage })),
)

export const vendorImportRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/vendors/import',
  component: VendorImportPage,
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

function SettingsRouteComponent() {
  const { tab } = settingsRoute.useSearch()
  return <SettingsPage tab={tab} />
}

export const settingsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/settings',
  validateSearch: (search: Record<string, unknown>): { tab?: SettingsTab } => ({ tab: isSettingsTab(search.tab) ? search.tab : undefined }),
  component: SettingsRouteComponent,
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

const AdminsPage = lazy(() =>
  import('@/features/admins/AdminsPage').then((m) => ({ default: m.AdminsPage })),
)

function AdminsRouteComponent() {
  return (
    <RoleGuard roles={[ROLES.SUPER_ADMIN]}>
      <AdminsPage />
    </RoleGuard>
  )
}

export const adminsRoute = createRoute({
  getParentRoute: () => protectedGroupRoute,
  path: '/admins',
  component: AdminsRouteComponent,
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
