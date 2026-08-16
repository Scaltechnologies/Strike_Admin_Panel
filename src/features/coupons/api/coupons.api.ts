import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { CouponResponse, CouponPage, CreateCouponRequest, CouponStats } from '../types/coupon.types'

export const couponsApi = {
  list: (page: number, size: number): Promise<CouponPage> =>
    axiosInstance.get(ENDPOINTS.COUPONS.BASE, { params: { page, size } }).then((r) => r.data as CouponPage),

  getActive: (page: number, size: number): Promise<CouponPage> =>
    axiosInstance.get(ENDPOINTS.COUPONS.ACTIVE, { params: { page, size } }).then((r) => r.data as CouponPage),

  getPending: (page: number, size: number): Promise<CouponPage> =>
    axiosInstance.get(ENDPOINTS.COUPONS.PENDING, { params: { page, size } }).then((r) => r.data as CouponPage),

  getStats: (): Promise<CouponStats> =>
    axiosInstance.get(ENDPOINTS.COUPONS.STATS).then((r) => r.data as CouponStats),

  getById: (id: number): Promise<CouponResponse> =>
    axiosInstance.get(ENDPOINTS.COUPONS.BY_ID(String(id))).then((r) => r.data as CouponResponse),

  create: (req: CreateCouponRequest): Promise<CouponResponse> =>
    axiosInstance.post(ENDPOINTS.COUPONS.BASE, req).then((r) => r.data as CouponResponse),

  update: (id: number, req: CreateCouponRequest): Promise<CouponResponse> =>
    axiosInstance.put(ENDPOINTS.COUPONS.BY_ID(String(id)), req).then((r) => r.data as CouponResponse),

  activate: (id: number): Promise<void> =>
    axiosInstance.patch(ENDPOINTS.COUPONS.ACTIVATE(String(id))).then(() => undefined),

  deactivate: (id: number): Promise<void> =>
    axiosInstance.patch(ENDPOINTS.COUPONS.DEACTIVATE(String(id))).then(() => undefined),

  approve: (id: number): Promise<void> =>
    axiosInstance.patch(ENDPOINTS.COUPONS.APPROVE(String(id))).then(() => undefined),

  reject: (id: number, reason: string): Promise<void> =>
    axiosInstance.patch(ENDPOINTS.COUPONS.REJECT(String(id)), { reason }).then(() => undefined),
}
