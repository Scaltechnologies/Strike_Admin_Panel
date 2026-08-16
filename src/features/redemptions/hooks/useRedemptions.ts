import { useQuery, useQueries } from '@tanstack/react-query'
import { redemptionsApi } from '../api/redemptions.api'
import { storesApi } from '@/features/stores/api/stores.api'
import { usersApi } from '@/features/users/api/users.api'
import type { StoreRecord } from '@/features/stores/types/store.types'
import type { UserDetails } from '@/features/users/types/user.types'

export const REDEMPTION_QUERY_KEYS = {
  all: ['redemptions'] as const,
  list: (page: number, size: number, status?: string, storeId?: number) =>
    ['redemptions', 'list', page, size, status, storeId] as const,
  stats: ['redemptions', 'stats'] as const,
}

const LIVE_INTERVAL = 6000

export function useRedemptionList(
  page: number,
  size: number,
  status: string | undefined,
  storeId: number | undefined,
  live: boolean,
) {
  return useQuery({
    queryKey: REDEMPTION_QUERY_KEYS.list(page, size, status, storeId),
    queryFn: () =>
      storeId
        ? redemptionsApi.listByStore(storeId, page, size, status)
        : redemptionsApi.list(page, size, status),
    staleTime: 1000 * 5,
    retry: 1,
    meta: { suppressError: true },
    refetchInterval: live ? LIVE_INTERVAL : false,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  })
}

export function useRedemptionStats() {
  return useQuery({
    queryKey: REDEMPTION_QUERY_KEYS.stats,
    queryFn: () => redemptionsApi.getStats(),
    staleTime: 1000 * 30,
    retry: 1,
    meta: { suppressError: true },
  })
}

// Resolves storeId -> StoreRecord for the rows currently on screen. Each unique store is
// fetched (and cached by react-query) at most once regardless of how many redemption rows
// reference it.
export function useStoreLookup(storeIds: number[]) {
  const uniqueIds = Array.from(new Set(storeIds))

  const results = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ['store', 'lookup', id],
      queryFn: () => storesApi.getById(id),
      staleTime: 1000 * 60 * 5,
      retry: 1,
      meta: { suppressError: true },
    })),
  })

  const map = new Map<number, StoreRecord>()
  // Tracks ids whose lookup is still in flight, so callers can show a loading state
  // instead of flashing the raw "Store #<id>" fallback before the name arrives.
  const loading = new Set<number>()
  uniqueIds.forEach((id, i) => {
    const result = results[i]
    if (result?.data) map.set(id, result.data)
    else if (result?.isLoading) loading.add(id)
  })
  return { map, loading }
}

// Resolves userId -> UserDetails for the rows currently on screen. Falls back to this when the
// redemption-service hasn't stamped a customerName onto the record (e.g. legacy rows, or before
// the enrichment change is deployed).
export function useUserLookup(userIds: number[]) {
  const uniqueIds = Array.from(new Set(userIds))

  const results = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ['user', 'lookup', id],
      queryFn: () => usersApi.getById(id),
      staleTime: 1000 * 60 * 5,
      retry: 1,
      meta: { suppressError: true },
    })),
  })

  const map = new Map<number, UserDetails>()
  uniqueIds.forEach((id, i) => {
    const data = results[i]?.data
    if (data) map.set(id, data)
  })
  return map
}

// redemption-service stamps "Customer #<id>" onto customerName as its own last-resort fallback
// when it can't resolve a name or masked mobile — treat that as absent, not a real name, so we
// fall through to our own (more complete) user lookup instead of surfacing a bare ID.
const STAMPED_PLACEHOLDER_NAME = /^Customer #\d+$/

export function resolveCustomerName(
  customerName: string | null,
  userId: number,
  userMap: Map<number, UserDetails>,
): string {
  if (customerName && !STAMPED_PLACEHOLDER_NAME.test(customerName)) return customerName
  const user = userMap.get(userId)
  return user?.profile?.name || user?.auth?.mobileNumber || 'Strike User'
}

export function resolveCustomerPhone(userId: number, userMap: Map<number, UserDetails>): string | null {
  const user = userMap.get(userId)
  return user?.profile?.mobileNumber || user?.auth?.mobileNumber || null
}
