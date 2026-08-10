import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  UserPageResponse,
  UserDetails,
  ApiWrappedPage,
  UserSubscription,
  UserTransaction,
  UserRedemption,
} from '../types/user.types'

export const usersApi = {
  list(page: number, size: number): Promise<UserPageResponse> {
    return axiosInstance
      .get<UserPageResponse>(ENDPOINTS.USERS.BASE, { params: { page, size } })
      .then((r) => r.data)
  },

  getById(userId: number): Promise<UserDetails> {
    return axiosInstance
      .get<UserDetails>(ENDPOINTS.USERS.BY_ID(String(userId)))
      .then((r) => r.data)
  },

  ban(userId: number): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.USERS.BAN(String(userId)))
      .then((r) => r.data)
  },

  unban(userId: number): Promise<string> {
    return axiosInstance
      .patch<string>(ENDPOINTS.USERS.UNBAN(String(userId)))
      .then((r) => r.data)
  },

  getSubscriptions(
    userId: number,
    page: number,
    size: number,
  ): Promise<ApiWrappedPage<UserSubscription>> {
    return axiosInstance
      .get<ApiWrappedPage<UserSubscription>>(
        ENDPOINTS.USERS.SUBSCRIPTIONS(String(userId)),
        { params: { page, size } },
      )
      .then((r) => r.data)
  },

  getRedemptions(
    userId: number,
    page: number,
    size: number,
  ): Promise<ApiWrappedPage<UserRedemption>> {
    return axiosInstance
      .get<ApiWrappedPage<UserRedemption>>(
        ENDPOINTS.USERS.REDEMPTIONS(String(userId)),
        { params: { page, size } },
      )
      .then((r) => r.data)
  },

  getTransactions(
    userId: number,
    page: number,
    size: number,
  ): Promise<ApiWrappedPage<UserTransaction>> {
    return axiosInstance
      .get<ApiWrappedPage<UserTransaction>>(
        ENDPOINTS.USERS.TRANSACTIONS(String(userId)),
        { params: { page, size } },
      )
      .then((r) => r.data)
  },
}
