import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { vendorsApi } from '../api/vendors.api'
import type { VendorFilters } from '../types/vendor.types'

export const VENDOR_QUERY_KEYS = {
  all: ['vendors'] as const,
  list: (page: number, size: number, filters: VendorFilters) =>
    ['vendors', 'list', page, size, filters] as const,
  detail: (id: number) => ['vendors', 'detail', id] as const,
  cards: (id: number) => ['vendors', id, 'cards'] as const,
  subscriptions: (id: number, page: number) => ['vendors', id, 'subscriptions', page] as const,
  redemptions: (id: number, page: number) => ['vendors', id, 'redemptions', page] as const,
  transactions: (id: number, page: number) => ['vendors', id, 'transactions', page] as const,
  commissions: (id: number, page: number) => ['vendors', id, 'commissions', page] as const,
  commissionRateHistory: (id: number, page: number) =>
    ['vendors', id, 'commission-rate-history', page] as const,
  menu: (storeId: number) => ['vendors', 'menu', storeId] as const,
}

const QUERY_DEFAULTS = {
  staleTime: 1000 * 60 * 5,
  retry: 1,
  meta: { suppressError: true },
} as const

export function useVendors(page: number, size: number, filters: VendorFilters) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.list(page, size, filters),
    queryFn: () => vendorsApi.list(page, size, filters),
    staleTime: 1000 * 60,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useVendorDetail(vendorId: number | null) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.detail(vendorId!),
    queryFn: () => vendorsApi.getById(vendorId!),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useVendorCards(vendorId: number | null) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.cards(vendorId!),
    queryFn: () => vendorsApi.getCards(vendorId!),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useVendorSubscriptions(vendorId: number | null, page: number) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.subscriptions(vendorId!, page),
    queryFn: () => vendorsApi.getSubscriptions(vendorId!, page, 10),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useVendorRedemptions(vendorId: number | null, page: number) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.redemptions(vendorId!, page),
    queryFn: () => vendorsApi.getRedemptions(vendorId!, page, 10),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useVendorTransactions(vendorId: number | null, page: number) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.transactions(vendorId!, page),
    queryFn: () => vendorsApi.getTransactions(vendorId!, page, 10),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useVendorCommissions(vendorId: number | null, page: number) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.commissions(vendorId!, page),
    queryFn: () => vendorsApi.getCommissions(vendorId!, page, 10),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useVendorCommissionRateHistory(vendorId: number | null, page: number) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.commissionRateHistory(vendorId!, page),
    queryFn: () => vendorsApi.getCommissionRateHistory(vendorId!, page, 10),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useVendorMenu(storeId: number | null) {
  return useQuery({
    queryKey: VENDOR_QUERY_KEYS.menu(storeId!),
    queryFn: () => vendorsApi.getMenu(storeId!),
    enabled: storeId !== null,
    staleTime: 1000 * 60 * 10,
    retry: 1,
    meta: { suppressError: true },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useApproveVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vendorId: number) => vendorsApi.approve(vendorId),
    meta: { suppressError: true },
    onSuccess: (_data, vendorId) => {
      toast.success('Vendor approved successfully.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.detail(vendorId) })
    },
    onError: () => { toast.error('Failed to approve vendor.') },
  })
}

export function useRejectVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vendorId, reason }: { vendorId: number; reason?: string }) =>
      vendorsApi.reject(vendorId, reason),
    meta: { suppressError: true },
    onSuccess: (_data, { vendorId }) => {
      toast.success('Vendor rejected.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.detail(vendorId) })
    },
    onError: () => { toast.error('Failed to reject vendor.') },
  })
}

export function useSuspendVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vendorId, reason }: { vendorId: number; reason?: string }) =>
      vendorsApi.suspend(vendorId, reason),
    meta: { suppressError: true },
    onSuccess: (_data, { vendorId }) => {
      toast.success('Vendor suspended.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.detail(vendorId) })
    },
    onError: () => { toast.error('Failed to suspend vendor.') },
  })
}

export function useReactivateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vendorId: number) => vendorsApi.reactivate(vendorId),
    meta: { suppressError: true },
    onSuccess: (_data, vendorId) => {
      toast.success('Vendor reactivated.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.detail(vendorId) })
    },
    onError: () => { toast.error('Failed to reactivate vendor.') },
  })
}

export function useVerifyKyc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vendorId: number) => vendorsApi.verifyKyc(vendorId),
    meta: { suppressError: true },
    onSuccess: (_data, vendorId) => {
      toast.success('KYC verified successfully.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.detail(vendorId) })
    },
    onError: () => { toast.error('Failed to verify KYC.') },
  })
}

export function useRejectKyc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vendorId, reason }: { vendorId: number; reason?: string }) =>
      vendorsApi.rejectKyc(vendorId, reason),
    meta: { suppressError: true },
    onSuccess: (_data, { vendorId }) => {
      toast.success('KYC rejected.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.detail(vendorId) })
    },
    onError: () => { toast.error('Failed to reject KYC.') },
  })
}

export function useUpdateCommissionRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vendorId, rate }: { vendorId: number; rate: number }) =>
      vendorsApi.updateCommissionRate(vendorId, rate),
    meta: { suppressError: true },
    onSuccess: (_data, { vendorId }) => {
      toast.success('Commission rate updated.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.detail(vendorId) })
      void queryClient.invalidateQueries({ queryKey: ['vendors', vendorId, 'commission-rate-history', 0] })
    },
    onError: () => { toast.error('Failed to update commission rate.') },
  })
}
