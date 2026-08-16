import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { couponsApi } from '../api/coupons.api'
import type { CreateCouponRequest } from '../types/coupon.types'

export const COUPON_QUERY_KEYS = {
  all: ['coupons'] as const,
  list: (page: number, size: number) => ['coupons', 'list', page, size] as const,
  pending: (page: number, size: number) => ['coupons', 'pending', page, size] as const,
  detail: (id: number) => ['coupons', 'detail', id] as const,
  stats: ['coupons', 'stats'] as const,
}

const DEFAULTS = { staleTime: 1000 * 60 * 2, retry: 1, meta: { suppressError: true } } as const

export function useCouponList(page: number, size: number) {
  return useQuery({
    queryKey: COUPON_QUERY_KEYS.list(page, size),
    queryFn: () => couponsApi.list(page, size),
    ...DEFAULTS,
  })
}

export function usePendingCoupons(page: number, size: number) {
  return useQuery({
    queryKey: COUPON_QUERY_KEYS.pending(page, size),
    queryFn: () => couponsApi.getPending(page, size),
    ...DEFAULTS,
  })
}

export function useCouponStats() {
  return useQuery({
    queryKey: COUPON_QUERY_KEYS.stats,
    queryFn: () => couponsApi.getStats(),
    ...DEFAULTS,
  })
}

export function useCouponDetail(id: number | null) {
  return useQuery({
    queryKey: COUPON_QUERY_KEYS.detail(id!),
    queryFn: () => couponsApi.getById(id!),
    enabled: id !== null,
    ...DEFAULTS,
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateCouponRequest) => couponsApi.create(req),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Coupon created.')
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to create coupon.'),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: CreateCouponRequest }) => couponsApi.update(id, req),
    meta: { suppressError: true },
    onSuccess: (_data, { id }) => {
      toast.success('Coupon updated.')
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.all })
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.detail(id) })
    },
    onError: () => toast.error('Failed to update coupon.'),
  })
}

export function useActivateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => couponsApi.activate(id),
    meta: { suppressError: true },
    onSuccess: (_data, id) => {
      toast.success('Coupon activated.')
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.all })
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.detail(id) })
    },
    onError: () => toast.error('Failed to activate coupon.'),
  })
}

export function useDeactivateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => couponsApi.deactivate(id),
    meta: { suppressError: true },
    onSuccess: (_data, id) => {
      toast.success('Coupon deactivated.')
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.all })
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.detail(id) })
    },
    onError: () => toast.error('Failed to deactivate coupon.'),
  })
}

export function useApproveCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => couponsApi.approve(id),
    meta: { suppressError: true },
    onSuccess: (_data, id) => {
      toast.success('Coupon request approved — it is now active.')
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.all })
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.detail(id) })
    },
    onError: () => toast.error('Failed to approve coupon request.'),
  })
}

export function useRejectCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => couponsApi.reject(id, reason),
    meta: { suppressError: true },
    onSuccess: (_data, { id }) => {
      toast.success('Coupon request rejected.')
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.all })
      void qc.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.detail(id) })
    },
    onError: () => toast.error('Failed to reject coupon request.'),
  })
}
