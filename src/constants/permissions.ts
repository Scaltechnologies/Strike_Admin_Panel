/**
 * Permission names used across the panel, each mapped to the section that grants it.
 * Access is per section (see constants/sections.ts): an admin with a section can view and
 * edit everything in it. Super Admins have every section.
 */
export const PERMISSIONS = {
  DASHBOARD: { VIEW: 'SEC_DASHBOARD' },
  USERS: {
    VIEW: 'SEC_USERS',
    EDIT: 'SEC_USERS',
    DELETE: 'SEC_USERS',
    NOTIFY: 'SEC_USERS',
  },
  VENDORS: {
    VIEW: 'SEC_VENDORS',
    EDIT: 'SEC_VENDORS',
    APPROVE: 'SEC_VENDORS',
    DISABLE: 'SEC_VENDORS',
  },
  STORES: {
    VIEW: 'SEC_VENDORS',
    CREATE: 'SEC_VENDORS',
    EDIT: 'SEC_VENDORS',
    DELETE: 'SEC_VENDORS',
  },
  STORE_CATEGORIES: { EDIT: 'SEC_STORE_CATEGORIES' },
  CATEGORIES: { EDIT: 'SEC_CATEGORIES' },
  MENUS: { EDIT: 'SEC_MENUS' },
  CARDS: {
    CREATE: 'SEC_CARDS',
    EDIT: 'SEC_CARDS',
    DELETE: 'SEC_CARDS',
  },
  COUPONS: {
    CREATE: 'SEC_COUPONS',
    EDIT: 'SEC_COUPONS',
  },
  REDEMPTIONS: { VIEW: 'SEC_REDEMPTIONS' },
  PAYMENTS: { VIEW: 'SEC_PAYMENTS' },
  WITHDRAWALS: { APPROVE: 'SEC_WITHDRAWALS' },
  ANALYTICS: { VIEW: 'SEC_ANALYTICS' },
  REPORTS: { EXPORT: 'SEC_REPORTS' },
  SETTINGS: { EDIT: 'SEC_SETTINGS' },
  API_KEYS: { EDIT: 'SEC_API_KEYS' },
  NOTIFICATIONS: { SEND: 'SEC_NOTIFICATIONS' },
  BANNERS: { MANAGE: 'SEC_BANNERS' },
  AUDIT_LOGS: { VIEW: 'SEC_AUDIT_LOGS' },
} as const

export type Permission = {
  [K in keyof typeof PERMISSIONS]: (typeof PERMISSIONS)[K][keyof (typeof PERMISSIONS)[K]]
}[keyof typeof PERMISSIONS]
