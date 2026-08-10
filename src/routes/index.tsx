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
  vendorsRoute,
  branchesRoute,
  paymentsRoute,
  withdrawalsRoute,
  cardsRoute,
  redemptionsRoute,
  couponsRoute,
  bannersRoute,
  menusRoute,
  notificationsRoute,
  reportsRoute,
  settingsRoute,
  auditLogsRoute,
  apiKeysRoute,
  profileRoute,
} from './protected-routes'

const routeTree = rootRoute.addChildren([
  authGroupRoute.addChildren([loginRoute]),
  protectedGroupRoute.addChildren([
    indexRoute,
    dashboardRoute,
    analyticsRoute,
    usersRoute,
    vendorsRoute,
    branchesRoute,
    paymentsRoute,
    withdrawalsRoute,
    cardsRoute,
    redemptionsRoute,
    couponsRoute,
    bannersRoute,
    menusRoute,
    notificationsRoute,
    reportsRoute,
    settingsRoute,
    auditLogsRoute,
    apiKeysRoute,
    profileRoute,
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
