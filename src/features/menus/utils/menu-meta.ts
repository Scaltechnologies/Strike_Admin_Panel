import { CheckCircle2, ImagePlus, PencilLine, PlusCircle, ShieldCheck, ShieldOff, Trash2, UserCog, XCircle, Undo2, type LucideIcon } from 'lucide-react'
import type { ApprovalMode, ChangeAction, ChangeStatus, ItemFields, MenuChange } from '../api/menu-admin.api'

export const ACTION_META: Record<ChangeAction, { label: string; verb: string; icon: LucideIcon; tone: string; chip: string }> = {
  CREATE: {
    label: 'New item', verb: 'wants to add', icon: PlusCircle, tone: 'from-emerald-400 to-teal-600',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  UPDATE: {
    label: 'Edit', verb: 'wants to change', icon: PencilLine, tone: 'from-sky-400 to-indigo-600',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
  },
  DELETE: {
    label: 'Remove', verb: 'wants to remove', icon: Trash2, tone: 'from-rose-400 to-red-600',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  },
  IMAGE: {
    label: 'New photo', verb: 'wants a new photo for', icon: ImagePlus, tone: 'from-violet-400 to-fuchsia-600',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  },
}

export const STATUS_META: Record<ChangeStatus, { label: string; icon: LucideIcon; chip: string }> = {
  PENDING: { label: 'Waiting', icon: UserCog, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' },
  APPROVED: { label: 'Approved', icon: CheckCircle2, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' },
  REJECTED: { label: 'Rejected', icon: XCircle, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300' },
  WITHDRAWN: { label: 'Withdrawn by store', icon: Undo2, chip: 'bg-muted text-muted-foreground' },
}

export const MODE_META: Record<ApprovalMode, { label: string; short: string; description: string; icon: LucideIcon; tone: string }> = {
  ALL: {
    label: 'Every change needs approval', short: 'On for everyone',
    description: 'Store owners and managers can ask for menu changes, but nothing goes live until an admin approves it.',
    icon: ShieldCheck, tone: 'from-emerald-400 to-teal-600',
  },
  MANAGERS: {
    label: 'Only store managers need approval', short: 'Managers only',
    description: "Owners' changes go live at once. Changes made by store managers wait for an admin.",
    icon: UserCog, tone: 'from-amber-400 to-orange-600',
  },
  OFF: {
    label: 'Off — stores change menus freely', short: 'Off',
    description: 'Owners and managers edit their menus and it goes live at once, like before. You can still edit any menu here.',
    icon: ShieldOff, tone: 'from-slate-400 to-slate-600',
  },
}

export const FIELD_LABELS: Record<keyof ItemFields, string> = {
  name: 'Name',
  description: 'Description',
  price: 'Price',
  imageUrl: 'Photo',
  itemType: 'Veg / non-veg',
  availabilityStatus: 'Stock',
  categoryId: 'Category',
}

const FIELD_ORDER: (keyof ItemFields)[] = ['name', 'price', 'itemType', 'categoryId', 'description', 'availabilityStatus', 'imageUrl']

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
export const formatPrice = (n: unknown) => (n == null || n === '' ? '—' : inr.format(Number(n) || 0))

export function formatField(field: keyof ItemFields, value: unknown, categories?: Record<string, string>): string {
  if (value == null || value === '') return '—'
  switch (field) {
    case 'price': return formatPrice(value)
    case 'itemType': return value === 'VEG' ? 'Veg' : value === 'NON_VEG' ? 'Non-veg' : String(value)
    case 'availabilityStatus': return value === 'OUT_OF_STOCK' ? 'Out of stock' : 'In stock'
    case 'categoryId': return categories?.[String(value)] ?? `Category #${value}`
    default: return String(value)
  }
}

export interface FieldDiff {
  field: keyof ItemFields
  before: unknown
  after: unknown
}

/** Fields an edit actually changes, compared with the item as it was when the store asked. */
export function changedFields(c: MenuChange): FieldDiff[] {
  const base = c.before ?? {}
  return FIELD_ORDER
    .filter((f) => c.changes?.[f] !== undefined && c.changes[f] !== null)
    .map((f) => ({ field: f, before: base[f], after: c.changes[f] }))
    .filter((d) => String(d.before ?? '') !== String(d.after ?? ''))
}

/** % change between two prices, rounded; null when not comparable. */
export function priceDelta(before: unknown, after: unknown): number | null {
  const b = Number(before)
  const a = Number(after)
  if (!b || !Number.isFinite(a)) return null
  return Math.round(((a - b) / b) * 100)
}

/** True when the item was changed again (by an admin or another way) after the store asked. */
export function itemMovedOn(c: MenuChange): boolean {
  if (!c.current || c.action === 'CREATE') return false
  return ['name', 'price', 'description', 'itemType', 'categoryId'].some(
    (f) => c.before?.[f as keyof ItemFields] != null && String(c.before[f as keyof ItemFields]) !== String(c.current?.[f as keyof ItemFields] ?? ''),
  )
}

/** Photo URLs that are real images (not the "string" placeholders some test data has). */
export function usableImage(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const u = url.trim()
  return /^(https?:\/\/|\/)/.test(u) ? u : null
}

export const QUICK_REASONS = [
  'Price looks wrong — please check and send again',
  'Please add a clearer description',
  'Wrong category',
  'Duplicate of an existing item',
  'Photo is unclear or not of this dish',
]
