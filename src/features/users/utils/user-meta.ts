import { BadgeCheck, Ban, ShieldQuestion, type LucideIcon } from 'lucide-react'

/** Sections of a customer's page; the active one is kept in the URL (?tab=). */
export const USER_TAB_IDS = ['overview', 'purchases', 'cards', 'redemptions', 'transactions', 'activity'] as const
export type UserTab = (typeof USER_TAB_IDS)[number]

export function isUserTab(v: unknown): v is UserTab {
  return typeof v === 'string' && (USER_TAB_IDS as readonly string[]).includes(v)
}

export function userStatus(u: { banned: boolean; verified: boolean }): { label: string; icon: LucideIcon; chip: string; dot: string } {
  if (u.banned) return { label: 'Banned', icon: Ban, dot: 'bg-red-500', chip: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300' }
  if (!u.verified) return { label: 'Not verified', icon: ShieldQuestion, dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' }
  return { label: 'Active', icon: BadgeCheck, dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' }
}

/** A real image URL (local test data sometimes holds placeholders like "string"). */
export function usablePhoto(url: string | null | undefined): string | null {
  if (!url) return null
  return /^(https?:)?\/\//.test(url) || url.startsWith('/') ? url : null
}

export function displayName(u: { name?: string | null; mobileNumber?: string | null; id: number }): string {
  return u.name?.trim() || (u.mobileNumber ? `+91 ${u.mobileNumber}` : `Customer #${u.id}`)
}

/** Spending tiers, so big spenders stand out on the list. */
export function spendTier(spent: number): { label: string; cls: string } | null {
  if (spent >= 25_000) return { label: 'VIP', cls: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950' }
  if (spent >= 5_000) return { label: 'Loyal', cls: 'bg-gradient-to-r from-violet-400 to-fuchsia-500 text-white' }
  if (spent > 0) return { label: 'Buyer', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300' }
  return null
}
