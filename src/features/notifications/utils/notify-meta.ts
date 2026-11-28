import type { Audience, AudienceKind } from '../api/notification-center.api'

export type NotificationsTab = 'overview' | 'send' | 'automatic' | 'activity' | 'devices' | 'templates'
const TABS: readonly NotificationsTab[] = ['overview', 'send', 'automatic', 'activity', 'devices', 'templates']
export const isNotificationsTab = (v: unknown): v is NotificationsTab => TABS.includes(v as NotificationsTab)

export type Group = 'Customers' | 'Vendors' | 'Admins' | 'Account & security'

export interface EventMeta {
  label: string
  when: string
  group: Group
  /** Template code when it differs from the event type. */
  template?: string
  /** Loud siren on vendor phones. */
  urgent?: boolean
  /** Placeholders the wording can use. */
  vars?: string[]
}

/** Every automatic notification, in plain words. Unknown types still show (with a generated name). */
export const EVENTS: Record<string, EventMeta> = {
  USER_REGISTERED: { label: 'Welcome', when: 'A customer signs up', group: 'Customers', template: 'WELCOME' },
  SUBSCRIPTION_PURCHASED: { label: 'Card bought', when: 'A customer’s card purchase goes through', group: 'Customers', vars: ['cardName', 'walletAmount'] },
  PAYMENT_SUCCESS: { label: 'Payment received', when: 'An online payment succeeds', group: 'Customers', vars: ['cardName', 'amount'] },
  PAYMENT_FAILED: { label: 'Payment failed', when: 'An online payment fails', group: 'Customers', vars: ['cardName'] },
  PAY_AT_STORE_CREATED: { label: 'Pay at store started', when: 'A customer chooses to pay at the store', group: 'Customers', vars: ['cardName'] },
  PAY_AT_STORE_CANCELLED: { label: 'Pay at store cancelled', when: 'A pay-at-store order is cancelled', group: 'Customers' },
  PAY_AT_STORE_EXPIRED: { label: 'Pay at store expired', when: 'A pay-at-store order wasn’t paid in time', group: 'Customers' },
  REDEMPTION_PROCESSED: { label: 'Card used at a store', when: 'A store approves a customer’s redemption', group: 'Customers', vars: ['amount', 'remainingBalance'] },
  REDEMPTION_REJECTED: { label: 'Redemption turned down', when: 'A store rejects a customer’s redemption', group: 'Customers' },
  REDEMPTION_EXPIRED: { label: 'Redemption expired', when: 'A redemption request wasn’t answered in time', group: 'Customers' },
  LOW_BALANCE: { label: 'Low balance', when: 'A card’s balance runs low after a visit', group: 'Customers', vars: ['remainingBalance'] },
  SUBSCRIPTION_EXPIRING: { label: 'Card expiring soon', when: '7, 3 and 1 day before a card expires', group: 'Customers', vars: ['cardName', 'daysLeft'] },
  SUBSCRIPTION_EXPIRED: { label: 'Card expired', when: 'A card reaches its expiry date', group: 'Customers', vars: ['cardName'] },
  COUPON_ISSUED: { label: 'New coupon for you', when: 'A coupon is given to a customer', group: 'Customers', vars: ['couponCode', 'expiryDate'] },
  COUPON_REDEEMED: { label: 'Coupon used', when: 'A coupon is used on a purchase (customer and store both hear)', group: 'Customers', vars: ['couponCode', 'discountApplied'] },
  REFUND_COMPLETED: { label: 'Refund issued', when: 'An admin refunds a purchase', group: 'Customers', template: 'PAYMENT_REFUND_ISSUED', vars: ['amount', 'cardName'] },
  PAYMENT_DISPUTED: { label: 'Payment under review', when: 'An admin flags a payment for review', group: 'Customers', vars: ['cardName'] },
  BANNER_PUBLISHED: { label: 'New banner', when: 'An admin switches a banner on and asks for a push', group: 'Customers' },
  PROFILE_UPDATED: { label: 'Profile updated', when: 'A customer changes their profile', group: 'Account & security' },
  LOGIN_SUCCESS: { label: 'Signed in', when: 'Someone signs in', group: 'Account & security' },
  EMAIL_CHANGED: { label: 'Email changed', when: 'An account’s email address changes', group: 'Account & security' },

  CARD_REQUEST: { label: 'New card purchase', when: 'A customer buys or asks to pay for a card at the store', group: 'Vendors', urgent: true, vars: ['cardName'] },
  PAY_AT_STORE_CONFIRMED: { label: 'Payment received at store', when: 'The store confirms a pay-at-store payment', group: 'Vendors' },
  REDEMPTION_REQUEST: { label: 'New redemption request', when: 'A customer wants to use their card at the store', group: 'Vendors', urgent: true, vars: ['amount'] },
  WITHDRAWAL_REQUESTED: { label: 'Withdrawal requested', when: 'A vendor asks to be paid (vendor and admins hear)', group: 'Vendors', vars: ['amount'] },
  WITHDRAWAL_APPROVED: { label: 'Payout sent', when: 'An admin pays a withdrawal', group: 'Vendors', vars: ['amount'] },
  WITHDRAWAL_REJECTED: { label: 'Withdrawal turned down', when: 'An admin rejects a withdrawal', group: 'Vendors', vars: ['amount', 'reason'] },
  MENU_CHANGE_APPROVED: { label: 'Menu change approved', when: 'An admin approves a menu change', group: 'Vendors', vars: ['itemName'] },
  MENU_CHANGE_REJECTED: { label: 'Menu change turned down', when: 'An admin rejects a menu change', group: 'Vendors', vars: ['itemName'] },
  COUPON_APPROVED: { label: 'Coupon approved', when: 'An admin approves a store’s coupon request', group: 'Vendors' },
  COUPON_REJECTED: { label: 'Coupon turned down', when: 'An admin rejects a store’s coupon request', group: 'Vendors' },
  REFUND_AT_STORE: { label: 'Hand a refund back', when: 'An admin refunds a pay-at-store purchase', group: 'Vendors', template: 'PAYMENT_REFUND_AT_STORE', vars: ['amount', 'cardName'] },
  VENDOR_APPROVED: { label: 'Account approved', when: 'An admin approves a vendor', group: 'Vendors' },
  VENDOR_REJECTED: { label: 'Account rejected', when: 'An admin rejects a vendor', group: 'Vendors' },
  VENDOR_SUSPENDED: { label: 'Account suspended', when: 'An admin suspends a vendor', group: 'Vendors' },
  VENDOR_REACTIVATED: { label: 'Account reactivated', when: 'An admin reactivates a vendor', group: 'Vendors' },
  VENDOR_REGISTERED: { label: 'Vendor welcome', when: 'A vendor signs up', group: 'Vendors', template: 'VENDOR_WELCOME' },
  STORE_DISABLED: { label: 'Store switched off', when: 'An admin disables a store', group: 'Vendors' },
  VENDOR_PIN_CHANGED: { label: 'PIN changed by Strike', when: 'An admin sets a new sign-in PIN for a vendor', group: 'Account & security' },

  VENDOR_PENDING_REVIEW: { label: 'New vendor to review', when: 'A vendor signs up and waits for approval', group: 'Admins', template: 'VENDOR_NEW_PENDING' },
  ADMIN_CREATED: { label: 'Admin added', when: 'A new admin account is created', group: 'Admins' },
  ADMIN_PASSWORD_CHANGED: { label: 'Admin password changed', when: 'An admin changes their password', group: 'Admins' },
  ANNOUNCEMENT: { label: 'Sent by an admin', when: 'Messages you send from this page', group: 'Admins' },
}

export const eventMeta = (type: string): EventMeta =>
  EVENTS[type] ?? { label: type.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()), when: 'Sent automatically by the app', group: 'Customers' }

export const AUDIENCE_LABEL: Record<Audience, string> = { USER: 'Customer', VENDOR: 'Vendor', ADMIN: 'Admin' }

export const AUDIENCES: Record<AudienceKind, { label: string; who: string; recipient: 'USER' | 'VENDOR' }> = {
  ALL_CUSTOMERS: { label: 'All customers', who: 'Everyone with the customer app', recipient: 'USER' },
  ACTIVE_CARD: { label: 'Customers with a card', who: 'Anyone holding an active card', recipient: 'USER' },
  NO_CARD: { label: 'Never bought a card', who: 'Signed up but haven’t bought yet', recipient: 'USER' },
  EXPIRING_SOON: { label: 'Card expiring this week', who: 'Active cards ending in the next 7 days', recipient: 'USER' },
  INACTIVE_30: { label: 'Not visited in 30 days', who: 'Have a card but haven’t used it for a month', recipient: 'USER' },
  STORE_CUSTOMERS: { label: 'Customers of one store', who: 'Everyone who bought a card at a store', recipient: 'USER' },
  ONE_CUSTOMER: { label: 'One customer', who: 'Pick a person', recipient: 'USER' },
  ALL_VENDORS: { label: 'All vendors', who: 'Every store owner', recipient: 'VENDOR' },
  ONE_VENDOR: { label: 'One vendor', who: 'Pick a store owner', recipient: 'VENDOR' },
}

export const STATUS_META: Record<string, { label: string; tone: string }> = {
  SENT: { label: 'Delivered', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  DELIVERED: { label: 'In inbox', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  MOCK: { label: 'Not really sent (test mode)', tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  FAILED: { label: 'Didn’t arrive', tone: 'bg-red-500/10 text-red-700 dark:text-red-300' },
  MUTED: { label: 'Switched off', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
}

export const CHANNEL_META: Record<string, { label: string; tone: string }> = {
  PUSH: { label: 'Push', tone: 'from-[#e01a00] to-[#ff6a00]' },
  IN_APP: { label: 'In-app', tone: 'from-violet-500 to-fuchsia-600' },
  SMS: { label: 'SMS', tone: 'from-sky-400 to-blue-600' },
  EMAIL: { label: 'Email', tone: 'from-emerald-400 to-teal-600' },
}

/** Friendly reason for a failed push. */
export function failText(reason: string | null | undefined): string {
  if (!reason) return 'Didn’t arrive'
  if (/no active devices/i.test(reason)) return 'They haven’t turned on notifications (or logged out)'
  if (/unregistered|not.?registered|invalid.*token/i.test(reason)) return 'Their phone stopped accepting notifications'
  return reason
}

export const QUICK_STARTS: { label: string; title: string; message: string }[] = [
  { label: 'New offer', title: 'New offer just for you 🎉', message: 'Save more on your favourite stores this week. Open Strike to see what’s new.' },
  { label: 'Weekend', title: 'Your weekend treat is waiting', message: 'Use your Strike card at any partner store this weekend.' },
  { label: 'Card expiring', title: 'Your card balance is about to expire', message: 'Use your remaining balance before it expires — your favourite store is waiting.' },
  { label: 'App update', title: 'Strike just got better', message: 'Update the app to get the newest features and a smoother experience.' },
  { label: 'Vendor reminder', title: 'Keep your menu fresh', message: 'Update your menu and prices so customers always see what’s available.' },
]
