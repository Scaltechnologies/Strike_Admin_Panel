import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { BannerResponse, BannerPage, BannerStats, CreateBannerRequest, UpdateBannerRequest } from '../types/banner.types'

export const bannersApi = {
  list: (page: number, size: number): Promise<BannerPage> =>
    axiosInstance
      .get(ENDPOINTS.BANNERS.BASE, { params: { page, size } })
      .then((r) => r.data as BannerPage),

  getStats: (): Promise<BannerStats> =>
    axiosInstance.get(ENDPOINTS.BANNERS.STATS).then((r) => r.data as BannerStats),

  getById: (id: number): Promise<BannerResponse> =>
    axiosInstance.get(ENDPOINTS.BANNERS.BY_ID(String(id))).then((r) => r.data as BannerResponse),

  create: (payload: CreateBannerRequest): Promise<BannerResponse> =>
    axiosInstance.post(ENDPOINTS.BANNERS.BASE, payload).then((r) => r.data as BannerResponse),

  update: (id: number, payload: UpdateBannerRequest): Promise<BannerResponse> =>
    axiosInstance.put(ENDPOINTS.BANNERS.BY_ID(String(id)), payload).then((r) => r.data as BannerResponse),

  delete: (id: number): Promise<void> =>
    axiosInstance.delete(ENDPOINTS.BANNERS.BY_ID(String(id))).then(() => undefined),

  activate: (id: number): Promise<BannerResponse> =>
    axiosInstance.patch(ENDPOINTS.BANNERS.ACTIVATE(String(id))).then((r) => r.data as BannerResponse),

  deactivate: (id: number): Promise<BannerResponse> =>
    axiosInstance.patch(ENDPOINTS.BANNERS.DEACTIVATE(String(id))).then((r) => r.data as BannerResponse),
}
