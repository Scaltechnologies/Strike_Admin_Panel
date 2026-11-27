export type AuditActorType = 'ADMIN' | 'STORE_OWNER' | 'STORE_MANAGER' | 'CUSTOMER'
export type AuditOutcome = 'SUCCESS' | 'FAILED'
export type AuditSource = 'ADMIN_PANEL' | 'VENDOR_APP' | 'CUSTOMER_APP' | 'SYSTEM'

export interface AuditLogResponse {
  id: number
  actorId: number | null
  actorEmail: string | null
  actorRole: string | null
  actorType: AuditActorType | null
  actorName: string | null
  action: string
  summary: string | null
  entityType: string | null
  entityId: number | null
  storeId: number | null
  oldValue: string | null
  newValue: string | null
  details: string | null
  requestBody: string | null
  source: AuditSource | null
  httpMethod: string | null
  path: string | null
  statusCode: number | null
  outcome: AuditOutcome | null
  durationMs: number | null
  ipAddress: string | null
  userAgent: string | null
  branchId: number | null
  /** Server clock, no time zone. Prefer createdAtUtc. */
  createdAt: string
  createdAtUtc: string | null
}

export interface AuditLogPage {
  content: AuditLogResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type AuditRange = '24h' | '7d' | '30d' | '90d' | 'all'

export interface AuditFilters {
  q?: string
  actorType?: AuditActorType
  outcome?: AuditOutcome
  source?: AuditSource
  action?: string
  entityType?: string
  entityId?: number
  actorEmail?: string
  storeId?: number
  range: AuditRange
}

export interface AuditStats {
  from: string
  to: string
  total: number
  failed: number
  admins: number
  storeOwners: number
  storeManagers: number
  customers?: number
  failedSignIns: number
  activePeople: number
  topActions: { action: string; count: number }[]
  topActors: { actorType: AuditActorType | null; actorEmail: string; actorName: string | null; count: number }[]
  bucketUnit: 'hour' | 'day'
  timeline: { bucket: string; total: number; failed: number }[]
}

export interface AuditFacets {
  actions: string[]
  entityTypes: string[]
}
