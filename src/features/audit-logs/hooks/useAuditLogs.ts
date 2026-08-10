import { useQuery } from '@tanstack/react-query'
import { auditLogsApi } from '../api/audit-logs.api'

const DEFAULTS = { staleTime: 1000 * 30, retry: 1, meta: { suppressError: true } } as const

export function useAuditLogList(page: number, size: number) {
  return useQuery({
    queryKey: ['audit-logs', 'list', page, size],
    queryFn: () => auditLogsApi.list(page, size),
    ...DEFAULTS,
  })
}
