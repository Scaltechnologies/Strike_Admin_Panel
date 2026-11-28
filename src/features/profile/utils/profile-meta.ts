import {
  BadgePercent, Bell, CreditCard, FolderTree, Image, KeyRound, LayoutGrid, Settings, ShieldCheck, Store,
  Tags, UserRound, UtensilsCrossed, Wallet, Building2, Banknote, type LucideIcon,
} from 'lucide-react'
import { humanize } from '@/features/audit-logs/utils/audit-display'
import { parseServerDate } from '@/utils/helpers/date'

export const PROFILE_TABS = ['overview', 'account', 'security', 'activity', 'access', 'preferences'] as const
export type ProfileTab = (typeof PROFILE_TABS)[number]
export const isProfileTab = (v: unknown): v is ProfileTab => typeof v === 'string' && (PROFILE_TABS as readonly string[]).includes(v)

export interface AreaMeta { label: string; icon: LucideIcon; to?: string }

/** Audit entity types (upper-cased) -> what an admin calls that part of the panel. */
const AREAS: Record<string, AreaMeta> = {
  VENDOR: { label: 'Vendors', icon: Store, to: '/vendors' },
  STORE: { label: 'Stores', icon: Building2, to: '/stores' },
  USER: { label: 'Customers', icon: UserRound, to: '/users' },
  CARD: { label: 'Cards', icon: CreditCard, to: '/cards' },
  COUPON: { label: 'Coupons', icon: BadgePercent, to: '/coupons' },
  BANNER: { label: 'Banners', icon: Image, to: '/banners' },
  CATEGORY: { label: 'Categories', icon: FolderTree, to: '/categories' },
  STORE_CATEGORY: { label: 'Store categories', icon: Tags, to: '/store-categories' },
  MENUCHANGE: { label: 'Menu approvals', icon: UtensilsCrossed, to: '/menus' },
  MENUITEM: { label: 'Menu items', icon: UtensilsCrossed, to: '/menus' },
  WITHDRAWAL: { label: 'Withdrawals', icon: Wallet, to: '/withdrawals' },
  PAYMENT: { label: 'Payments & refunds', icon: Banknote, to: '/payments' },
  COMMISSION: { label: 'Commission', icon: BadgePercent, to: '/settings' },
  NOTIFICATION: { label: 'Notifications', icon: Bell, to: '/notifications' },
  NOTIFICATION_TEMPLATE: { label: 'Notification wording', icon: Bell, to: '/notifications' },
  PUSH_DEVICE: { label: 'Phones', icon: Bell, to: '/notifications' },
  SYSTEM_SETTING: { label: 'Settings', icon: Settings, to: '/settings' },
  SETTINGS: { label: 'Settings', icon: Settings, to: '/settings' },
  PAYMENT_GATEWAY_CONFIG: { label: 'Payment gateway', icon: KeyRound, to: '/api-keys' },
  API_KEY: { label: 'API keys', icon: KeyRound, to: '/api-keys' },
  ADMIN: { label: 'Admins & my account', icon: ShieldCheck, to: '/admins' },
  BRANCH: { label: 'Branches', icon: Building2 },
  OTHER: { label: 'Other', icon: LayoutGrid },
}

export function areaMeta(code: string | null | undefined): AreaMeta {
  const key = (code || 'OTHER').toUpperCase()
  return AREAS[key] ?? { label: humanize(key), icon: LayoutGrid }
}

// ── Password strength ───────────────────────────────────────────────────────

export const PASSWORD_RULES: { id: string; label: string; test: (p: string) => boolean }[] = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'case', label: 'Upper and lower case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'num', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'sym', label: 'A symbol like ! @ # $', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { id: 'long', label: '12 or more characters (best)', test: (p) => p.length >= 12 },
]

const COMMON = ['password', '123456', 'qwerty', 'admin', 'strike', 'welcome', 'letmein', '111111']

export function passwordStrength(p: string): { score: 0 | 1 | 2 | 3 | 4; label: string; tone: string; bar: string } {
  if (!p) return { score: 0, label: 'Type a password', tone: 'text-muted-foreground', bar: 'bg-muted' }
  let s = PASSWORD_RULES.filter((r) => r.test(p)).length
  if (COMMON.some((w) => p.toLowerCase().includes(w))) s = Math.min(s, 1)
  if (p.length < 8) s = Math.min(s, 1)
  const score = Math.max(1, Math.min(4, s - 1)) as 1 | 2 | 3 | 4
  return [
    { score: 1, label: 'Weak', tone: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
    { score: 2, label: 'Fair', tone: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
    { score: 3, label: 'Good', tone: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' },
    { score: 4, label: 'Strong', tone: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  ][score - 1] as { score: 1 | 2 | 3 | 4; label: string; tone: string; bar: string }
}

// ── Account health ──────────────────────────────────────────────────────────

export interface HealthCheck { id: string; ok: boolean; label: string; detail: string; fix?: { tab: ProfileTab; label: string } }

const daysSince = (iso: string | null | undefined, now: number) => {
  if (!iso) return null
  const t = parseServerDate(iso).getTime()
  return Number.isFinite(t) ? Math.floor((now - t) / 86_400_000) : null
}

/** The checklist behind the security score. `now` is passed in so render stays pure. */
export function accountHealth(input: {
  phone?: string
  createdAt?: string
  passwordChangedAt: string | null
  failedWeek: number
  devices: number
  now: number
}): { score: number; checks: HealthCheck[] } {
  const pwAge = daysSince(input.passwordChangedAt ?? input.createdAt, input.now)
  const checks: HealthCheck[] = [
    {
      id: 'password',
      ok: pwAge != null && pwAge <= 90,
      label: pwAge == null ? 'No password change on record' : pwAge <= 90 ? 'Password changed recently' : 'Password is over 90 days old',
      detail: pwAge == null ? 'We have no record of a password change yet.'
        : pwAge === 0 ? 'Changed today.' : `Last changed ${pwAge} day${pwAge === 1 ? '' : 's'} ago.`,
      fix: { tab: 'security', label: 'Change password' },
    },
    {
      id: 'failed',
      ok: input.failedWeek === 0,
      label: input.failedWeek === 0 ? 'No failed sign-ins this week' : 'Someone typed a wrong password',
      detail: input.failedWeek === 0 ? 'Nobody has tried a wrong password on your account.'
        : `${input.failedWeek} wrong-password attempt${input.failedWeek === 1 ? '' : 's'} in 7 days. If that wasn’t you, change your password.`,
      fix: { tab: 'security', label: 'See sign-ins' },
    },
    {
      id: 'phone',
      ok: !!input.phone,
      label: input.phone ? 'Phone number added' : 'No phone number',
      detail: input.phone ? 'Other admins can reach you quickly.' : 'Add one so the team can reach you about urgent payouts or approvals.',
      fix: { tab: 'account', label: 'Add phone' },
    },
    {
      id: 'devices',
      ok: input.devices <= 3,
      label: input.devices <= 3 ? 'Signed in from a few devices' : 'Signed in from many devices',
      detail: input.devices <= 3 ? `${input.devices || 'No'} browser${input.devices === 1 ? '' : 's'} used in this period.`
        : `${input.devices} different browsers used. Sign out the ones you don’t use.`,
      fix: { tab: 'security', label: 'Sign out others' },
    },
  ]
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100)
  return { score, checks }
}

export const greeting = (hour: number) => (hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')

/** A friendlier label for the sign-in network (local addresses read as "this computer"). */
export function shortIp(ip: string | null | undefined): string {
  if (!ip) return 'Unknown network'
  if (ip === '0:0:0:0:0:0:0:1' || ip === '::1' || ip === '127.0.0.1') return 'local network'
  return ip
}
