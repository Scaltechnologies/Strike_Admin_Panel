/**
 * Panel sections a limited "Admin" (SUB_ADMIN) can be given, one per sidebar page.
 * Must match the backend's AdminSection enum (codes are stored as "SEC_<NAME>").
 * Super Admins always have every section.
 */
export const SECTIONS = [
  { code: 'SEC_DASHBOARD', label: 'Dashboard', group: 'Overview', paths: ['/dashboard'] },
  { code: 'SEC_ANALYTICS', label: 'Analytics', group: 'Insights', paths: ['/analytics'] },
  { code: 'SEC_REPORTS', label: 'Reports', group: 'Insights', paths: ['/reports'] },
  { code: 'SEC_USERS', label: 'Users', group: 'People', paths: ['/users'] },
  { code: 'SEC_VENDORS', label: 'Vendors & Stores', group: 'People', paths: ['/vendors', '/stores'] },
  { code: 'SEC_CARDS', label: 'Cards', group: 'Commerce', paths: ['/cards'] },
  { code: 'SEC_CATEGORIES', label: 'Categories', group: 'Commerce', paths: ['/categories'] },
  { code: 'SEC_MENUS', label: 'Menus', group: 'Commerce', paths: ['/menus'] },
  { code: 'SEC_COUPONS', label: 'Coupons', group: 'Commerce', paths: ['/coupons'] },
  { code: 'SEC_STORE_CATEGORIES', label: 'Store Categories', group: 'Commerce', paths: ['/store-categories'] },
  { code: 'SEC_REDEMPTIONS', label: 'Redemptions', group: 'Commerce', paths: ['/redemptions'] },
  { code: 'SEC_PAYMENTS', label: 'Payments', group: 'Money', paths: ['/payments'] },
  { code: 'SEC_WITHDRAWALS', label: 'Withdrawals', group: 'Money', paths: ['/withdrawals'] },
  { code: 'SEC_NOTIFICATIONS', label: 'Notifications', group: 'Marketing', paths: ['/notifications'] },
  { code: 'SEC_BANNERS', label: 'Banners', group: 'Marketing', paths: ['/banners'] },
  { code: 'SEC_SETTINGS', label: 'Settings', group: 'System', paths: ['/settings'] },
  { code: 'SEC_API_KEYS', label: 'API Keys & Payment Gateway', group: 'System', paths: ['/api-keys'] },
  { code: 'SEC_AUDIT_LOGS', label: 'Audit Logs', group: 'System', paths: ['/audit-logs'] },
] as const

export type SectionCode = (typeof SECTIONS)[number]['code']

/** Short notes shown next to sections whose access is broader than the name suggests. */
export const SECTION_NOTES: Partial<Record<SectionCode, string>> = {
  SEC_VENDORS: 'Includes approving vendors, KYC and vendor commission rates',
  SEC_WITHDRAWALS: 'Can approve vendor payouts',
  SEC_SETTINGS: 'Includes maintenance mode, payment mode and the global commission rate',
  SEC_API_KEYS: 'Includes Razorpay keys',
}

/** The section a URL belongs to, or undefined for pages every admin can open (e.g. Profile). */
export function sectionForPath(pathname: string): SectionCode | undefined {
  return SECTIONS.find((s) =>
    (s.paths as readonly string[]).some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  )?.code
}
