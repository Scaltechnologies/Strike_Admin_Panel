import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { CardDefinitionResponse, ApiWrappedList } from '@/features/vendors/types/vendor.types'

export const cardsApi = {
  getByVendor: (vendorId: number): Promise<ApiWrappedList<CardDefinitionResponse>> =>
    axiosInstance
      .get<ApiWrappedList<CardDefinitionResponse>>(ENDPOINTS.VENDORS.CARDS(String(vendorId)))
      .then((r) => r.data),

  getById: (id: number): Promise<unknown> =>
    axiosInstance.get(ENDPOINTS.CARDS.BY_ID(String(id))).then((r) => r.data),
}
