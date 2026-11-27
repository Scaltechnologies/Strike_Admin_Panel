import { BadgeCheck, Ban, Clock, ShieldAlert, ShieldCheck, ShieldQuestion, XCircle, type LucideIcon } from 'lucide-react'
import type { VendorRecord } from '../types/vendor.types'

type VendorStatus = VendorRecord['status']
type KycStatus = VendorRecord['kycStatus']

export const STATUS_META: Record<VendorStatus, { label: string; icon: LucideIcon; chip: string; dot: string; ring: string }> = {
  ACTIVE: {
    label: 'Active', icon: BadgeCheck, dot: 'bg-emerald-500', ring: 'ring-emerald-500/30',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  PENDING: {
    label: 'Waiting for approval', icon: Clock, dot: 'bg-amber-500', ring: 'ring-amber-500/30',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  },
  SUSPENDED: {
    label: 'Suspended', icon: Ban, dot: 'bg-orange-500', ring: 'ring-orange-500/30',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
  },
  REJECTED: {
    label: 'Rejected', icon: XCircle, dot: 'bg-red-500', ring: 'ring-red-500/30',
    chip: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  },
}

export const KYC_META: Record<KycStatus, { label: string; icon: LucideIcon; chip: string }> = {
  VERIFIED: { label: 'KYC verified', icon: ShieldCheck, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300' },
  PENDING: { label: 'KYC to review', icon: ShieldQuestion, chip: 'bg-muted text-muted-foreground' },
  REJECTED: { label: 'KYC rejected', icon: ShieldAlert, chip: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300' },
}

const AVATAR_GRADIENTS = [
  'from-orange-400 to-rose-500',
  'from-amber-400 to-orange-600',
  'from-fuchsia-500 to-violet-600',
  'from-sky-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-pink-400 to-rose-600',
  'from-lime-400 to-green-600',
  'from-cyan-400 to-blue-600',
]

/** A stable avatar colour per vendor. */
export function avatarGradient(vendorId: number): string {
  return AVATAR_GRADIENTS[Math.abs(vendorId) % AVATAR_GRADIENTS.length]
}

export function vendorInitials(name: string | null | undefined): string {
  const words = (name ?? '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '#'
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 })
const inrFull = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const formatInrShort = (n: number | string | null | undefined) => inr.format(Number(n) || 0)
export const formatInrFull = (n: number | string | null | undefined) => inrFull.format(Number(n) || 0)
