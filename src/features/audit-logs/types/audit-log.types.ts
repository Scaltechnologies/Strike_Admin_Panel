export interface AuditLogResponse {
  id: number
  actorId: number
  actorEmail: string | null
  actorRole: string | null
  action: string
  entityType: string | null
  entityId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLogPage {
  content: AuditLogResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
