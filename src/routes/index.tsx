import { lazy } from 'react'
import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './route-config'
import { authGroupRoute, loginRoute } from './public-routes'
import {
  protectedGroupRoute,
  indexRoute,
  dashboardRoute,
  unauthorizedRoute,
  analyticsRoute,
  usersRoute,
  userDashboardRoute,
  vendorsRoute,
  vendorDashboardRoute,
  branchesRoute,
  paymentsRoute,
  withdrawalsRoute,
  cardsRoute,
  cardDetailRoute,
  redemptionsRoute,
  couponsRoute,
  bannersRoute,
  storeCategoriesRoute,
  categoriesRoute,
  menusRoute,
  storeMenuRoute,
  notificationsRoute,
  reportsRoute,
  settingsRoute,
  auditLogsRoute,
  apiKeysRoute,
  profileRoute,
  adminsRoute,
} from './protected-routes'

const routeTree = rootRoute.addChildren([
  authGroupRoute.addChildren([loginRoute]),
  protectedGroupRoute.addChildren([
    indexRoute,
    dashboardRoute,
    analyticsRoute,
    usersRoute,
    userDashboardRoute,
    vendorsRoute,
    vendorDashboardRoute,
    branchesRoute,
    paymentsRoute,
    withdrawalsRoute,
    cardsRoute,
    cardDetailRoute,
    redemptionsRoute,
    couponsRoute,
    bannersRoute,
    storeCategoriesRoute,
    categoriesRoute,
    menusRoute,
    storeMenuRoute,
    notificationsRoute,
    reportsRoute,
    settingsRoute,
    auditLogsRoute,
    apiKeysRoute,
    profileRoute,
    adminsRoute,
  ]),
  unauthorizedRoute,
])

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: lazy(() =>
    import('@/features/not-found/NotFoundPage').then((m) => ({
      default: m.NotFoundPage,
    })),
  ),
  defaultPreload: 'intent',
  defaultPreloadDelay: 100,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
