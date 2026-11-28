import type { SettingsHistoryEntry, SettingsOverview } from '../api/settings-overview.api'
import type { PaymentMode } from '../types/settings.types'

export type SettingsTab = 'overview' | 'access' | 'payments' | 'commission' | 'menus' | 'alerts' | 'appearance' | 'history' | 'about'

const TABS: readonly SettingsTab[] = ['overview', 'access', 'payments', 'commission', 'menus', 'alerts', 'appearance', 'history', 'about']

export const isSettingsTab = (v: unknown): v is SettingsTab => TABS.includes(v as SettingsTab)

export const PAYMENT_META: Record<PaymentMode, { label: string; short: string; customer: string }> = {
  BOTH: { label: 'Online and Pay at Store', short: 'Both', customer: 'Customers can pay online with Razorpay, or pay at the store and show a QR.' },
  ONLINE_ONLY: { label: 'Online only', short: 'Online only', customer: 'Customers can only pay online with Razorpay. Pay at Store is hidden.' },
  PAY_AT_STORE_ONLY: { label: 'Pay at Store only', short: 'Store only', customer: 'Online payment is switched off. Every purchase is paid at the store.' },
}

export const APPROVAL_LABEL: Record<'ALL' | 'MANAGERS' | 'OFF', string> = {
  ALL: 'Every menu change',
  MANAGERS: 'Managers only',
  OFF: 'Off',
}

export const MESSAGE_TEMPLATES = [
  "App is in maintenance, we'll be back soon.",
  "We're upgrading Strike — back in about 30 minutes. Thanks for your patience!",
  "Scheduled maintenance until 6 AM. Your cards and wallet balance are safe.",
  "We're fixing a payment issue. Please try again in a little while.",
]

const ACTION_TEXT: Record<string, string> = {
  MAINTENANCE_MODE_CHANGED: 'Maintenance mode',
  MAINTENANCE_MESSAGE_CHANGED: 'Maintenance message',
  PAYMENT_MODE_CHANGED: 'Payment options',
  GLOBAL_COMMISSION_RATE_UPDATED: 'Default commission',
  VENDOR_COMMISSION_RATE_BULK_UPDATED: 'Vendors moved to default commission',
  PAYMENT_GATEWAY_CONFIG_UPDATED: 'Razorpay keys',
  GLOBAL_RADIUS_UPDATED: 'Search radius',
  SETTING_UPDATED: 'Setting',
}

export type HistoryKind = 'access' | 'payments' | 'commission' | 'menus' | 'other'

/** One history row in plain words: what changed, from what to what. */
export function describeChange(e: SettingsHistoryEntry): { title: string; from?: string; to?: string; kind: HistoryKind } {
  const a = e.action ?? ''
  const pretty = (v: string | null | undefined): string | undefined => {
    if (v == null || v === '') return undefined
    if (v === 'true') return 'On'
    if (v === 'false') return 'Off'
    if (v in PAYMENT_META) return PAYMENT_META[v as PaymentMode].label
    return v
  }
  if (a === 'MAINTENANCE_MODE_CHANGED' && e.oldValue === e.newValue) return { title: e.newValue === 'true' ? 'Maintenance kept on' : 'Maintenance kept off', kind: 'access' }
  if (a === 'MAINTENANCE_MODE_CHANGED') return { title: e.newValue === 'true' ? 'Apps closed for maintenance' : 'Apps opened again', from: pretty(e.oldValue), to: pretty(e.newValue), kind: 'access' }
  if (a === 'MAINTENANCE_MESSAGE_CHANGED') return { title: 'Maintenance message changed', to: e.newValue ?? undefined, kind: 'access' }
  if (a === 'PAYMENT_MODE_CHANGED') return { title: 'Payment options changed', from: pretty(e.oldValue), to: pretty(e.newValue), kind: 'payments' }
  if (a === 'GLOBAL_COMMISSION_RATE_UPDATED') return { title: 'Default commission changed', from: e.oldValue ? `${Number(e.oldValue)}%` : undefined, to: e.newValue ? `${Number(e.newValue)}%` : undefined, kind: 'commission' }
  if (a === 'VENDOR_COMMISSION_RATE_BULK_UPDATED') return { title: e.details ?? 'Vendors moved to the default commission', kind: 'commission' }
  if (a === 'PAYMENT_GATEWAY_CONFIG_UPDATED') return { title: 'Razorpay keys updated', kind: 'payments' }
  if (e.path?.includes('approval-settings') || a.startsWith('MENU_APPROVAL')) return { title: e.summary ?? 'Menu approval settings changed', kind: 'menus' }
  const p = e.path ?? ''
  const kind: HistoryKind = p.includes('/settings/maintenance') ? 'access'
    : p.includes('/payment-mode') || p.includes('/payment-gateway') ? 'payments'
      : p.includes('/commissions/rate') ? 'commission' : 'other'
  // Requests that were refused carry the reason in details — show that instead of the values.
  if (e.outcome === 'FAILED') return { title: e.summary ?? ACTION_TEXT[a] ?? 'Setting change', to: e.details ?? undefined, kind }
  return { title: e.summary ?? ACTION_TEXT[a] ?? a.replace(/_/g, ' ').toLowerCase(), from: pretty(e.oldValue), to: pretty(e.newValue), kind }
}

export type HealthLevel = 'critical' | 'warning' | 'info'

export interface HealthItem {
  id: string
  level: HealthLevel
  title: string
  body: string
  tab: SettingsTab
}

/** Things worth the admin's attention, most serious first. */
export function healthChecks(o: SettingsOverview | undefined, soundOn: boolean): HealthItem[] {
  if (!o) return []
  const out: HealthItem[] = []
  if (o.maintenance.on) {
    out.push({ id: 'maint', level: 'critical', title: 'The apps are closed', body: 'Maintenance mode is on. Customers and vendors only see your maintenance message.', tab: 'access' })
  }
  const onlineAllowed = o.paymentMode.mode !== 'PAY_AT_STORE_ONLY'
  if (onlineAllowed && !o.razorpay.configured) {
    out.push({ id: 'rzp-missing', level: 'critical', title: 'Online payment has no Razorpay keys', body: 'Online payment is switched on, but no Razorpay keys are saved — online purchases will fail.', tab: 'payments' })
  } else if (onlineAllowed && o.razorpay.configured && o.razorpay.active === false) {
    out.push({ id: 'rzp-inactive', level: 'critical', title: 'Razorpay keys are switched off', body: 'Online payment is on, but the saved Razorpay keys are marked inactive.', tab: 'payments' })
  } else if (onlineAllowed && o.razorpay.mode === 'TEST') {
    out.push({ id: 'rzp-test', level: 'warning', title: 'Razorpay is in test mode', body: 'Online payments use test keys, so no real money is collected.', tab: 'payments' })
  }
  if (onlineAllowed && o.razorpay.configured && !o.razorpay.webhookConfigured) {
    out.push({ id: 'rzp-webhook', level: 'info', title: 'No Razorpay webhook secret', body: 'Payments still work. Adding the webhook secret lets Razorpay confirm payments even if a customer closes the app mid-payment.', tab: 'payments' })
  }
  const offDefault = o.commission.vendors - o.commission.onDefault
  if (o.commission.vendors > 0 && offDefault > 0) {
    out.push({ id: 'comm', level: 'info', title: `${offDefault} vendor${offDefault === 1 ? ' is' : 's are'} on a different commission`, body: `They pay their own rate instead of the ${o.commission.rate}% default. That's fine if it's on purpose.`, tab: 'commission' })
  }
  if (o.menuApproval.mode !== 'OFF' && o.menuApproval.pending > 0) {
    out.push({ id: 'menus', level: 'warning', title: `${o.menuApproval.pending} menu change${o.menuApproval.pending === 1 ? '' : 's'} waiting`, body: 'Stores are waiting for you to approve menu changes.', tab: 'menus' })
  }
  if (!soundOn) {
    out.push({ id: 'sound', level: 'info', title: 'Alert sounds are muted on this device', body: "You won't hear new withdrawal, menu or redemption requests.", tab: 'alerts' })
  }
  const rank: Record<HealthLevel, number> = { critical: 0, warning: 1, info: 2 }
  return out.sort((a, b) => rank[a.level] - rank[b.level])
}
