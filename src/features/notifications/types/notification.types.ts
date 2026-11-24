// Shapes match `notification-service`'s NotificationLog entity + AdminNotificationController exactly
// (admin-service's controller is a pure proxy — see MASTER_BACKEND_DOCUMENTATION.md section 2.8).
// Covers SMS/Email logs plus the PUSH (FCM) and IN_APP channels, the push device registry, the
// in-app inbox, and reusable notification templates.

export type RecipientType = 'USER' | 'VENDOR' | 'ADMIN'
export type NotificationChannel = 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP'
export type NotificationStatus = 'SENT' | 'FAILED' | 'MOCK'

/** Known system-generated types; admin-sent ones default to ANNOUNCEMENT but the field is freeform. */
export type NotificationType =
  | 'OTP'
  | 'VENDOR_APPROVED'
  | 'VENDOR_REJECTED'
  | 'VENDOR_SUSPENDED'
  | 'VENDOR_REACTIVATED'
  | 'SUBSCRIPTION_PURCHASED'
  | 'REDEMPTION_PROCESSED'
  | 'LOW_BALANCE'
  | 'ANNOUNCEMENT'
  | (string & {})

export interface NotificationLog {
  id: number
  recipientId: number | null
  recipientType: RecipientType | string
  recipientMobile: string | null
  recipientEmail: string | null
  type: NotificationType
  channel: NotificationChannel | string
  message: string
  status: NotificationStatus | string
  errorDetail: string | null
  createdAt: string
  /** Push headline, separate from the body `message` — only populated for PUSH sends. */
  title?: string | null
}

export interface NotificationPage {
  content: NotificationLog[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface NotificationStats {
  total: number
  sent: number
  failed: number
  mock: number
  otpCount: number
  subscriptionCount: number
  redemptionCount: number
}

export interface NotificationListFilters {
  status?: NotificationStatus | string
  type?: NotificationType | string
  channel?: NotificationChannel | string
}

/** Body for POST /api/admin/notifications/send — `mobile` is required by the backend. */
export interface SendNotificationRequest {
  mobile: string
  message: string
  recipientId?: number
  recipientType?: RecipientType
  type?: NotificationType
}

export interface SendNotificationResponse {
  status: NotificationStatus | string
  logId: number
}

export interface BulkRecipient {
  mobile: string
  recipientId?: number
  recipientType?: RecipientType
}

/** Body for POST /api/admin/notifications/send/bulk. */
export interface SendBulkNotificationRequest {
  recipients: BulkRecipient[]
  message: string
  type?: NotificationType
}

export interface SendBulkNotificationResponse {
  sent: number
  failed: number
  total: number
}

/** A recipient segment for broadcast-style sends. */
export type BroadcastSegment = 'ALL_USERS' | 'ALL_VENDORS' | 'ALL_ADMINS'

// ── Push notifications ────────────────────────────────────────────────────────

export type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB'

export interface PushDevice {
  id: number
  recipientId: number
  recipientType: RecipientType
  platform: DevicePlatform
  deviceToken: string
  deviceName: string | null
  appVersion: string | null
  active: boolean
  lastSeenAt: string | null
  createdAt: string
}

export interface PushDevicePage {
  content: PushDevice[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface PushDeviceStats {
  total: number
  active: number
  inactive: number
  android: number
  ios: number
  web: number
}

export interface PushDeviceFilters {
  recipientType?: RecipientType | string
  platform?: DevicePlatform | string
  active?: boolean
}

/** Body for POST /api/admin/notifications/push/send. */
export interface SendPushRequest {
  recipientId?: number
  recipientType?: RecipientType
  segment?: BroadcastSegment
  title: string
  message: string
  data?: Record<string, string>
  type?: NotificationType
}

/** Body for POST /api/admin/notifications/push/send/bulk. */
export interface SendPushBulkRequest {
  recipients?: BulkRecipient[]
  segment?: BroadcastSegment
  title: string
  message: string
  data?: Record<string, string>
  type?: NotificationType
}

export interface SendPushResponse {
  status: NotificationStatus | string
  logId: number
}

export interface SendPushBulkResponse {
  sent: number
  failed: number
  total: number
}

// ── In-app notifications ─────────────────────────────────────────────────────

export interface InAppNotification {
  id: number
  recipientId: number
  recipientType: RecipientType
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  readAt: string | null
  actionUrl: string | null
  createdAt: string
}

export interface InAppPage {
  content: InAppNotification[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface InAppStats {
  total: number
  unread: number
  read: number
}

export interface InAppFilters {
  recipientType?: RecipientType | string
  recipientId?: number
  isRead?: boolean
}

/** Body for POST /api/admin/notifications/inapp/send. */
export interface SendInAppRequest {
  recipientId?: number
  recipientType?: RecipientType
  segment?: BroadcastSegment
  title: string
  message: string
  actionUrl?: string
  type?: NotificationType
}

/** Body for POST /api/admin/notifications/inapp/send/bulk. */
export interface SendInAppBulkRequest {
  recipients?: BulkRecipient[]
  segment?: BroadcastSegment
  title: string
  message: string
  actionUrl?: string
  type?: NotificationType
}

export interface SendInAppResponse {
  status: NotificationStatus | string
  logId: number
}

export interface SendInAppBulkResponse {
  sent: number
  failed: number
  total: number
}

// ── Notification templates ───────────────────────────────────────────────────

export interface NotificationTemplate {
  id: number
  name: string
  /** Unique machine key, e.g. "VENDOR_APPROVED_PUSH" — referenced by system-triggered sends. */
  code: string
  channel: NotificationChannel
  /** Only meaningful for PUSH/IN_APP; SMS/EMAIL templates are body-only. */
  title: string | null
  /** Freeform body supporting {{variable}} placeholders. */
  body: string
  variables: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplatePage {
  content: NotificationTemplate[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface TemplateFilters {
  channel?: NotificationChannel | string
  active?: boolean
}

export interface CreateTemplateRequest {
  name: string
  code: string
  channel: NotificationChannel
  title?: string
  body: string
  variables?: string[]
}

export type UpdateTemplateRequest = Partial<CreateTemplateRequest>
