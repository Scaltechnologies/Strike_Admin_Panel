import { useQuery } from '@tanstack/react-query'
import { cardsApi } from '../api/cards.api'

export const CARD_QUERY_KEYS = {
  byVendor: (vendorId: number) => ['cards', 'vendor', vendorId] as const,
}

const DEFAULTS = { staleTime: 1000 * 60 * 5, retry: 1, meta: { suppressError: true } } as const

export function useVendorCardDefs(vendorId: number | null) {
  return useQuery({
    queryKey: CARD_QUERY_KEYS.byVendor(vendorId!),
    queryFn: () => cardsApi.getByVendor(vendorId!),
    enabled: vendorId !== null,
    ...DEFAULTS,
  })
}
