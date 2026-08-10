import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { AuditLogPage, AuditLogResponse } from '../types/audit-log.types'

export const auditLogsApi = {
  list: (page: number, size: number): Promise<AuditLogPage> =>
    axiosInstance
      .get(ENDPOINTS.AUDIT_LOGS.BASE, { params: { page, size } })
      .then((r) => r.data as AuditLogPage),

  getById: (id: number): Promise<AuditLogResponse> =>
    axiosInstance.get(ENDPOINTS.AUDIT_LOGS.BY_ID(String(id))).then((r) => r.data as AuditLogResponse),

  getByActor: (actorId: number, page: number, size: number): Promise<AuditLogPage> =>
    axiosInstance
      .get(ENDPOINTS.AUDIT_LOGS.BY_ACTOR(String(actorId)), { params: { page, size } })
      .then((r) => r.data as AuditLogPage),
}
