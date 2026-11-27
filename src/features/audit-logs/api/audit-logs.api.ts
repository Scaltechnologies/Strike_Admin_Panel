import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { AuditFacets, AuditFilters, AuditLogPage, AuditLogResponse, AuditRange, AuditStats } from '../types/audit-log.types'

const RANGE_HOURS: Record<Exclude<AuditRange, 'all'>, number> = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30, '90d': 24 * 90 }

/** Start of the selected period as an exact instant (the server converts it to its own clock). */
export function rangeStart(range: AuditRange): string | undefined {
  if (range === 'all') return undefined
  return new Date(Date.now() - RANGE_HOURS[range] * 3_600_000).toISOString()
}

/** Query parameters shared by the list and the CSV export. */
function toParams(f: AuditFilters) {
  return {
    q: f.q?.trim() || undefined,
    actorType: f.actorType,
    outcome: f.outcome,
    source: f.source,
    action: f.action,
    entityType: f.entityType,
    entityId: f.entityId,
    actorEmail: f.actorEmail,
    storeId: f.storeId,
    from: rangeStart(f.range),
  }
}

export const auditLogsApi = {
  list: (filters: AuditFilters, page: number, size: number): Promise<AuditLogPage> =>
    axiosInstance
      .get(ENDPOINTS.AUDIT_LOGS.BASE, { params: { ...toParams(filters), page, size } })
      .then((r) => r.data as AuditLogPage),

  stats: (range: AuditRange): Promise<AuditStats> =>
    axiosInstance
      // "All time" statistics cover the last year, which keeps the chart readable.
      .get(ENDPOINTS.AUDIT_LOGS.STATS, { params: { from: rangeStart(range === 'all' ? '90d' : range) } })
      .then((r) => r.data as AuditStats),

  facets: (): Promise<AuditFacets> =>
    axiosInstance.get(ENDPOINTS.AUDIT_LOGS.FACETS).then((r) => r.data as AuditFacets),

  getById: (id: number): Promise<AuditLogResponse> =>
    axiosInstance.get(ENDPOINTS.AUDIT_LOGS.BY_ID(String(id))).then((r) => r.data as AuditLogResponse),

  /** Downloads the logs matching the current filters as a CSV file. */
  exportCsv: async (filters: AuditFilters): Promise<void> => {
    const response = await axiosInstance.get(ENDPOINTS.AUDIT_LOGS.EXPORT, {
      params: toParams(filters),
      responseType: 'blob',
    })
    const blob = new Blob([response.data as BlobPart], { type: 'text/csv;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `strike-audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  },
}
