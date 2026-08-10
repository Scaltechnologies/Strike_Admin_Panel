export const APP_ROUTES = {
  ROOT: '/',
  AUTH: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  DASHBOARD: '/dashboard',
  USERS: {
    BASE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: '/users/create',
    EDIT: (id: string) => `/users/${id}/edit`,
  },
  VENDORS: {
    BASE: '/vendors',
    DETAIL: (id: string) => `/vendors/${id}`,
    CREATE: '/vendors/create',
    EDIT: (id: string) => `/vendors/${id}/edit`,
  },
  BRANCHES: {
    BASE: '/branches',
    DETAIL: (id: string) => `/branches/${id}`,
    CREATE: '/branches/create',
    EDIT: (id: string) => `/branches/${id}/edit`,
  },
  MANAGERS: {
    BASE: '/managers',
    DETAIL: (id: string) => `/managers/${id}`,
    CREATE: '/managers/create',
    EDIT: (id: string) => `/managers/${id}/edit`,
  },
  PAYMENTS: {
    BASE: '/payments',
    DETAIL: (id: string) => `/payments/${id}`,
  },
  WITHDRAWALS: {
    BASE: '/withdrawals',
    DETAIL: (id: string) => `/withdrawals/${id}`,
  },
  CARDS: {
    BASE: '/cards',
    DETAIL: (id: string) => `/cards/${id}`,
  },
  REDEMPTIONS: {
    BASE: '/redemptions',
  },
  COUPONS: {
    BASE: '/coupons',
    DETAIL: (id: string) => `/coupons/${id}`,
    CREATE: '/coupons/create',
    EDIT: (id: string) => `/coupons/${id}/edit`,
  },
  BANNERS: {
    BASE: '/banners',
    CREATE: '/banners/create',
    EDIT: (id: string) => `/banners/${id}/edit`,
  },
  MENUS: {
    BASE: '/menus',
    CREATE: '/menus/create',
    EDIT: (id: string) => `/menus/${id}/edit`,
  },
  NOTIFICATIONS: '/notifications',
  REPORTS: '/reports',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  AUDIT_LOGS: '/audit-logs',
  API_KEYS: '/api-keys',
  PROFILE: '/profile',
  UNAUTHORIZED: '/unauthorized',
} as const
