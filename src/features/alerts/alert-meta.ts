import { ArrowDownCircle, CreditCard, HandCoins, Store, UserPlus, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { AlertType } from './alerts-store'

export const ALERT_META: Record<AlertType, { label: string; icon: LucideIcon; tone: string; ring: string; section: string }> = {
  WITHDRAWAL_REQUESTED: { label: 'Withdrawal requests', icon: ArrowDownCircle, tone: 'from-rose-500 to-red-600', ring: 'ring-rose-500/40', section: 'SEC_WITHDRAWALS' },
  MENU_CHANGE_REQUESTED: { label: 'Menu change requests', icon: UtensilsCrossed, tone: 'from-amber-400 to-orange-600', ring: 'ring-amber-500/40', section: 'SEC_MENUS' },
  REDEMPTION: { label: 'Redemptions', icon: HandCoins, tone: 'from-sky-400 to-indigo-600', ring: 'ring-sky-500/40', section: 'SEC_REDEMPTIONS' },
  CARD_SOLD: { label: 'Card sales', icon: CreditCard, tone: 'from-emerald-400 to-teal-600', ring: 'ring-emerald-500/40', section: 'SEC_PAYMENTS' },
  VENDOR_JOINED: { label: 'New vendors', icon: Store, tone: 'from-violet-500 to-fuchsia-600', ring: 'ring-violet-500/40', section: 'SEC_VENDORS' },
  CUSTOMER_JOINED: { label: 'New customers', icon: UserPlus, tone: 'from-pink-400 to-rose-500', ring: 'ring-pink-500/40', section: 'SEC_USERS' },
}

export const ALERT_TYPES = Object.keys(ALERT_META) as AlertType[]

/** Higher wins when several alerts arrive together — only one sound plays per batch. */
export const PRIORITY_RANK = { urgent: 3, attention: 2, sale: 1, info: 0 } as const
