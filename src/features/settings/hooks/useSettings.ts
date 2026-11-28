import { useQuery } from '@tanstack/react-query'
import { commissionSettingsApi } from '../api/settings.api'

export function useGlobalCommissionRateHistory(page: number) {
  return useQuery({
    queryKey: ['settings', 'commission', 'rate-history', page],
    queryFn: () => commissionSettingsApi.getGlobalRateHistory(page, 10),
    meta: { suppressError: true },
  })
}
