/** Sections of a vendor's dashboard page; the active one is kept in the URL (?tab=). */
export const VENDOR_TAB_IDS = [
  'overview', 'store', 'menu', 'cards', 'members', 'redemptions', 'transactions', 'payouts', 'commission', 'kyc', 'activity',
] as const

export type VendorTab = (typeof VENDOR_TAB_IDS)[number]

export function isVendorTab(v: unknown): v is VendorTab {
  return typeof v === 'string' && (VENDOR_TAB_IDS as readonly string[]).includes(v)
}
