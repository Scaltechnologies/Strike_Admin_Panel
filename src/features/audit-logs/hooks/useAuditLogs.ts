import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { auditLogsApi } from '../api/audit-logs.api'
import type { AuditFilters, AuditRange } from '../types/audit-log.types'

const LIVE_INTERVAL_MS = 10_000

export function useAuditLogList(filters: AuditFilters, page: number, size: number, live: boolean) {
  return useQuery({
    queryKey: ['audit-logs', 'list', filters, page, size],
    queryFn: () => auditLogsApi.list(filters, page, size),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: live ? LIVE_INTERVAL_MS : false,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useAuditStats(range: AuditRange, live: boolean) {
  return useQuery({
    queryKey: ['audit-logs', 'stats', range],
    queryFn: () => auditLogsApi.stats(range),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: live ? LIVE_INTERVAL_MS * 3 : false,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useAuditFacets() {
  return useQuery({
    queryKey: ['audit-logs', 'facets'],
    queryFn: auditLogsApi.facets,
    staleTime: 5 * 60_000,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (filters: AuditFilters) => auditLogsApi.exportCsv(filters),
    meta: { suppressError: true },
    onSuccess: () => toast.success('Audit log downloaded.'),
    onError: () => toast.error('Could not download the audit log.'),
  })
}
