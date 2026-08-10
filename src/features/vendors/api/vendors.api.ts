import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  VendorPageResponse,
  VendorRecord,
  CardDefinitionResponse,
  ApiWrappedList,
  VendorSubscription,
  VendorRedemption,
  VendorTransactionPage,
  CommissionRecordResponse,
  CommissionRateHistory,
  ApiWrappedPage,
  ApiWrappedMenu,
} from '../types/vendor.types'

export const vendorsApi = {
  // ── Listing ───────────────────────────────────────────────────────────────

  list(
    page: number,
    size: number,
    filters: { q?: string; status?: string; kycStatus?: string },
  ): Promise<VendorPageResponse> {
    return axiosInstance
      .get<VendorPageResponse>(ENDPOINTS.VENDORS.BASE, {
        params: {
          page,
          size,
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.kycStatus ? { kycStatus: filters.kycStatus } : {}),
        },
      })
      .then((r) => r.data)
  },

  getById(vendorId: number): Promise<VendorRecord> {
    return axiosInstance
      .get<VendorRecord>(ENDPOINTS.VENDORS.BY_ID(String(vendorId)))
      .then((r) => r.data)
  },

  // ── Status Actions ────────────────────────────────────────────────────────

  approve(vendorId: number): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.VENDORS.APPROVE(String(vendorId)))
      .then((r) => r.data)
  },

  reject(vendorId: number, reason?: string): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.VENDORS.REJECT(String(vendorId)), reason ? { reason } : undefined)
      .then((r) => r.data)
  },

  suspend(vendorId: number, reason?: string): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.VENDORS.SUSPEND(String(vendorId)), reason ? { reason } : undefined)
      .then((r) => r.data)
  },

  reactivate(vendorId: number): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.VENDORS.REACTIVATE(String(vendorId)))
      .then((r) => r.data)
  },

  // ── KYC ──────────────────────────────────────────────────────────────────

  verifyKyc(vendorId: number): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.VENDORS.KYC_VERIFY(String(vendorId)))
      .then((r) => r.data)
  },

  rejectKyc(vendorId: number, reason?: string): Promise<string> {
    return axiosInstance
      .patch<string>(
        ENDPOINTS.VENDORS.KYC_REJECT(String(vendorId)),
        reason ? { reason } : undefined,
      )
      .then((r) => r.data)
  },

  // ── Sub-resources ─────────────────────────────────────────────────────────

  getCards(vendorId: number): Promise<ApiWrappedList<CardDefinitionResponse>> {
    return axiosInstance
      .get<ApiWrappedList<CardDefinitionResponse>>(ENDPOINTS.VENDORS.CARDS(String(vendorId)))
      .then((r) => r.data)
  },

  getSubscriptions(
    vendorId: number,
    page: number,
    size: number,
  ): Promise<ApiWrappedPage<VendorSubscription>> {
    return axiosInstance
      .get<ApiWrappedPage<VendorSubscription>>(
        ENDPOINTS.VENDORS.SUBSCRIPTIONS(String(vendorId)),
        { params: { page, size } },
      )
      .then((r) => r.data)
  },

  getRedemptions(
    vendorId: number,
    page: number,
    size: number,
  ): Promise<ApiWrappedPage<VendorRedemption>> {
    return axiosInstance
      .get<ApiWrappedPage<VendorRedemption>>(
        ENDPOINTS.VENDORS.REDEMPTIONS(String(vendorId)),
        { params: { page, size } },
      )
      .then((r) => r.data)
  },

  getTransactions(
    vendorId: number,
    page: number,
    size: number,
  ): Promise<VendorTransactionPage> {
    return axiosInstance
      .get<VendorTransactionPage>(
        ENDPOINTS.VENDORS.TRANSACTIONS(String(vendorId)),
        { params: { page, size } },
      )
      .then((r) => r.data)
  },

  // ── Commission ────────────────────────────────────────────────────────────

  getCommissions(
    vendorId: number,
    page: number,
    size: number,
  ): Promise<{ content: CommissionRecordResponse[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean }> {
    return axiosInstance
      .get(ENDPOINTS.COMMISSION.BY_VENDOR(String(vendorId)), { params: { page, size } })
      .then((r) => r.data)
  },

  getCommissionRateHistory(
    vendorId: number,
    page: number,
    size: number,
  ): Promise<{ content: CommissionRateHistory[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean }> {
    return axiosInstance
      .get(ENDPOINTS.COMMISSION.RATE_HISTORY_VENDOR(String(vendorId)), { params: { page, size } })
      .then((r) => r.data)
  },

  updateCommissionRate(vendorId: number, rate: number): Promise<string> {
    return axiosInstance
      .patch(ENDPOINTS.VENDORS.COMMISSION_RATE(String(vendorId)), { commissionRate: rate })
      .then((r) => r.data)
  },

  // ── Menu ─────────────────────────────────────────────────────────────────

  getMenu(storeId: number): Promise<ApiWrappedMenu> {
    return axiosInstance
      .get<ApiWrappedMenu>(ENDPOINTS.MENUS.BY_STORE(String(storeId)))
      .then((r) => r.data)
  },

  // ── Store status ──────────────────────────────────────────────────────────

  updateStoreStatus(storeId: number, status: string): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.STORES.STATUS(String(storeId)), { status })
      .then((r) => r.data)
  },
}
