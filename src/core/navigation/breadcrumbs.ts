export interface BreadcrumbRoute {
  label: string
  path?: string
}

export type BreadcrumbMap = Record<string, BreadcrumbRoute[]>

export const BREADCRUMB_MAP: BreadcrumbMap = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/users': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Users' }],
  '/vendors': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Vendors' }],
  '/branches': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Branches' }],
  '/managers': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Managers' }],
  '/payments': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Payments' }],
  '/withdrawals': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Withdrawals' }],
  '/cards': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Cards' }],
  '/coupons': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Coupons' }],
  '/banners': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Banners' }],
  '/menus': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Menus' }],
  '/notifications': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Notifications' }],
  '/reports': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reports' }],
  '/analytics': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Analytics' }],
  '/settings': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings' }],
  '/audit-logs': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Audit Logs' }],
  '/api-keys': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'API Keys' }],
  '/profile': [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Profile' }],
}

export function getBreadcrumbs(path: string): BreadcrumbRoute[] {
  return BREADCRUMB_MAP[path] ?? [{ label: 'Dashboard', path: '/dashboard' }]
}
