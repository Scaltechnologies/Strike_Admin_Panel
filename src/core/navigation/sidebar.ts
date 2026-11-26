import { PERMISSIONS } from '@/constants/permissions'

export interface SidebarItem {
  title: string
  path: string
  icon: string
  permission?: string
  /** Shown only to SUPER_ADMIN (e.g. managing admin logins). */
  superAdminOnly?: boolean
  badge?: number | string
  children?: SidebarItem[]
}

export interface SidebarGroup {
  title: string
  items: SidebarItem[]
}

// Every path here must correspond to an actual registered route in `src/routes/protected-routes.tsx`.
// Each item's `permission` is the section (constants/sections.ts) that unlocks it; the backend
// enforces the same sections. Items without one (Profile) are open to every admin.
//
// NOTE: Branches (`/branches`) is intentionally NOT listed here — the route, feature folder, and
// backend integration all still exist, but Branches is out of scope for Version 1 and is hidden from
// the sidebar until a future version re-enables it.
export const SIDEBAR_NAVIGATION: SidebarGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permission: PERMISSIONS.DASHBOARD.VIEW },
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
      { title: 'Categories', path: '/categories', icon: 'LayoutGrid', permission: PERMISSIONS.CATEGORIES.EDIT },
      { title: 'Menus', path: '/menus', icon: 'UtensilsCrossed', permission: PERMISSIONS.MENUS.EDIT },
      { title: 'Coupons', path: '/coupons', icon: 'Tag', permission: PERMISSIONS.COUPONS.EDIT },
      { title: 'Store Categories', path: '/store-categories', icon: 'LayoutGrid', permission: PERMISSIONS.STORE_CATEGORIES.EDIT },
      { title: 'Redemptions', path: '/redemptions', icon: 'Receipt', permission: PERMISSIONS.REDEMPTIONS.VIEW },
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
      { title: 'Admins', path: '/admins', icon: 'ShieldCheck', superAdminOnly: true },
      { title: 'API Keys', path: '/api-keys', icon: 'Key', permission: PERMISSIONS.API_KEYS.EDIT },
      { title: 'Audit Logs', path: '/audit-logs', icon: 'FileText', permission: PERMISSIONS.AUDIT_LOGS.VIEW },
      { title: 'Settings', path: '/settings', icon: 'Settings', permission: PERMISSIONS.SETTINGS.EDIT },
      { title: 'Profile', path: '/profile', icon: 'User' },
    ],
  },
]
