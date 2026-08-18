import axiosInstance from '@/api/axios'
import env from '@/config/env'
import { ENDPOINTS } from '@/constants/api/endpoints'
import { useAuthStore } from '@/store/auth-store'
import type { BannerResponse, BannerPage, BannerStats, CreateBannerRequest, UpdateBannerRequest } from '../types/banner.types'

export const bannersApi = {
  // Deliberately bypasses axiosInstance: it sets a hard `Content-Type:
  // application/json` default (api-config.ts) that would stomp the
  // multipart boundary a FormData body needs. Raw fetch lets the browser
  // generate the correct `multipart/form-data; boundary=…` header itself —
  // mirroring the one proven working upload in this codebase (the vendor
  // app's store-banner upload), which hit the same class of bug via axios.
  uploadImage: async (file: File): Promise<string> => {
    const { accessToken } = useAuthStore.getState()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${env.apiBaseUrl}${ENDPOINTS.BANNERS.UPLOAD}`, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      body: formData,
    })

    if (!res.ok) {
      throw new Error(`Failed to upload banner image (${res.status})`)
    }

    const data = (await res.json()) as { imageUrl: string }
    return data.imageUrl
  },

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
