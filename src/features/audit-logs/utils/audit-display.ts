import { isValid } from 'date-fns'
import { parseServerDate } from '@/utils/helpers/date'
import { ShieldCheck, Store, UserCog, Bot, type LucideIcon } from 'lucide-react'
import type { AuditActorType, AuditLogResponse } from '../types/audit-log.types'

export interface ActorMeta {
  label: string
  icon: LucideIcon
  /** Avatar / chip colours */
  tone: string
  /** Solid colour for dots and the chart legend */
  dot: string
}

const ACTOR_META: Record<AuditActorType | 'SYSTEM', ActorMeta> = {
  ADMIN: {
    label: 'Admin',
    icon: ShieldCheck,
    tone: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
    dot: 'bg-violet-500',
  },
  STORE_OWNER: {
    label: 'Store owner',
    icon: Store,
    tone: 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20',
    dot: 'bg-orange-500',
  },
  STORE_MANAGER: {
    label: 'Store manager',
    icon: UserCog,
    tone: 'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
    dot: 'bg-sky-500',
  },
  SYSTEM: {
    label: 'System',
    icon: Bot,
    tone: 'bg-muted text-muted-foreground ring-border',
    dot: 'bg-muted-foreground',
  },
}

export function actorMeta(log: Pick<AuditLogResponse, 'actorType' | 'source'>): ActorMeta {
  if (log.source === 'SYSTEM') return ACTOR_META.SYSTEM
  return ACTOR_META[log.actorType ?? 'ADMIN'] ?? ACTOR_META.ADMIN
}

export const ACTOR_TYPES: { value: AuditActorType; label: string }[] = [
  { value: 'ADMIN', label: 'Admins' },
  { value: 'STORE_OWNER', label: 'Store owners' },
  { value: 'STORE_MANAGER', label: 'Store managers' },
]

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SUB_ADMIN: 'Admin',
  ADMIN: 'Admin (legacy)',
  MANAGER: 'Store manager',
  OWNER: 'Store owner',
  UNKNOWN: 'Unknown account',
  SYSTEM: 'System',
}

export function roleLabel(role: string | null | undefined): string {
  if (!role) return '—'
  return ROLE_LABELS[role] ?? humanize(role)
}

/** The display name: the person's name, else their email/number. */
export function actorDisplayName(log: Pick<AuditLogResponse, 'actorName' | 'actorEmail'>): string {
  return log.actorName?.trim() || log.actorEmail || 'Unknown'
}

export function initials(name: string): string {
  const letters = name.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (letters.length === 0) return '#'
  return (letters[0][0] + (letters[1]?.[0] ?? '')).toUpperCase()
}

/** When it happened, as a real Date in the viewer's time zone. */
export function happenedAt(log: Pick<AuditLogResponse, 'createdAt' | 'createdAtUtc'>): Date {
  const d = parseServerDate(log.createdAtUtc ?? log.createdAt)
  return isValid(d) ? d : new Date(NaN)
}

/** VENDOR_LOGIN_FAILED -> "Vendor login failed" */
export function humanize(code: string): string {
  const s = code.replace(/[_-]+/g, ' ').toLowerCase().trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function summaryOf(log: AuditLogResponse): string {
  return log.summary?.trim() || humanize(log.action)
}

/** "Chrome on Windows", "Vendor app on Android", … from a User-Agent header. */
export function describeDevice(ua: string | null | undefined): string {
  if (!ua) return 'Unknown device'
  const s = ua.toLowerCase()
  const os = s.includes('android') ? 'Android'
    : /iphone|ipad|ios|cfnetwork|darwin/.test(s) ? 'iOS'
    : s.includes('windows') ? 'Windows'
    : s.includes('mac os') || s.includes('macintosh') ? 'macOS'
    : s.includes('linux') ? 'Linux'
    : null
  if (/okhttp|dart|expo|reactnative|react-native|cfnetwork/.test(s)) return `Vendor app${os ? ` on ${os}` : ''}`
  const browser = s.includes('edg/') ? 'Edge'
    : s.includes('opr/') || s.includes('opera') ? 'Opera'
    : s.includes('chrome/') ? 'Chrome'
    : s.includes('firefox/') ? 'Firefox'
    : s.includes('safari/') ? 'Safari'
    : s.includes('curl') ? 'curl'
    : s.includes('postman') ? 'Postman'
    : null
  if (browser && os) return `${browser} on ${os}`
  return browser ?? os ?? ua.slice(0, 40)
}

export const METHOD_TONE: Record<string, string> = {
  POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  GET: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
}

/** Pretty-prints JSON; returns the text unchanged if it isn't JSON. */
export function prettyJson(text: string | null | undefined): string | null {
  if (!text) return null
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/** True for actions that are about signing in or account security. */
export function isSecurityAction(action: string): boolean {
  return /LOGIN|PASSWORD|PIN|EMAIL_CHANGED|SECRET|API_KEY/i.test(action)
}
