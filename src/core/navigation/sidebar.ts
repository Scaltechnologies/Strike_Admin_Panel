import { PERMISSIONS } from '@/constants/permissions'

export interface SidebarItem {
  title: string
  path: string
  icon: string
  permission?: string
  badge?: number | string
  children?: SidebarItem[]
}

export interface SidebarGroup {
  title: string
  items: SidebarItem[]
}

// Every path here must correspond to an actual registered route in `src/routes/protected-routes.tsx`.
// No permission constant is invented for items whose module has none defined in
// `src/constants/permissions.ts` (Audit Logs, Profile) — they stay visible to any authenticated
// admin, matching how the backend gates them (no dedicated permission check).
//
// NOTE: Branches (`/branches`) is intentionally NOT listed here — the route, feature folder, and
// backend integration all still exist, but Branches is out of scope for Version 1 and is hidden from
// the sidebar until a future version re-enables it.
export const SIDEBAR_NAVIGATION: SidebarGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    title: 'User Management',
    items: [
      { title: 'Users', path: '/users', icon: 'Users', permission: PERMISSIONS.USERS.VIEW },
      { title: 'Vendors', path: '/vendors', icon: 'Store', permission: PERMISSIONS.VENDORS.VIEW },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { title: 'Cards', path: '/cards', icon: 'Layers', permission: PERMISSIONS.CARDS.EDIT },
      { title: 'Menus', path: '/menus', icon: 'UtensilsCrossed', permission: PERMISSIONS.MENUS.EDIT },
      { title: 'Coupons', path: '/coupons', icon: 'Tag', permission: PERMISSIONS.COUPONS.EDIT },
      { title: 'Redemptions', path: '/redemptions', icon: 'Receipt' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { title: 'Payments', path: '/payments', icon: 'Banknote', permission: PERMISSIONS.PAYMENTS.VIEW },
      { title: 'Withdrawals', path: '/withdrawals', icon: 'ArrowDownCircle', permission: PERMISSIONS.WITHDRAWALS.APPROVE },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { title: 'Notifications', path: '/notifications', icon: 'Bell', permission: PERMISSIONS.NOTIFICATIONS.SEND },
      { title: 'Banners', path: '/banners', icon: 'Image', permission: PERMISSIONS.BANNERS.MANAGE },
    ],
  },
  {
    title: 'Insights',
    items: [
      { title: 'Analytics', path: '/analytics', icon: 'TrendingUp', permission: PERMISSIONS.ANALYTICS.VIEW },
      { title: 'Reports', path: '/reports', icon: 'BarChart2', permission: PERMISSIONS.REPORTS.EXPORT },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'API Keys', path: '/api-keys', icon: 'Key', permission: PERMISSIONS.API_KEYS.EDIT },
      { title: 'Audit Logs', path: '/audit-logs', icon: 'FileText' },
      { title: 'Settings', path: '/settings', icon: 'Settings', permission: PERMISSIONS.SETTINGS.EDIT },
      { title: 'Profile', path: '/profile', icon: 'User' },
    ],
  },
]
