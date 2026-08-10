export interface UserAuth {
  id: number
  mobileNumber: string
  verified: boolean
  banned: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  userId: number
  name: string | null
  email: string | null
  mobileNumber: string
  profilePicUrl: string | null
  latitude: number | null
  longitude: number | null
  lastLocationAt: string | null
  createdAt: string
}

export interface UserDetails {
  auth: UserAuth
  profile: UserProfile | null
}

export interface UserPageResponse {
  content: UserAuth[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ApiResponse wrapper used by card/ledger/redemption services
export interface ApiWrappedPage<T> {
  success: boolean
  message: string | null
  data: {
    content: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    last: boolean
  }
}

export interface UserSubscription {
  id: number
  userId: number
  cardDefinitionId: number
  cardName: string
  storeId: number
  walletBalance: number
  status: string
  purchasedAt: string
  expiresAt: string | null
  createdAt: string
}

export interface UserTransaction {
  id: number
  storeId: number
  customerId: number
  subscriptionId: number
  transactionType: string
  amount: number
  remarks: string | null
  createdAt: string
}

export interface UserRedemption {
  id: number
  subscriptionId: number
  userId: number
  storeId: number
  totalAmount: number
  remainingBalance: number
  status: string
  initiatedBy: string | null
  customerName: string | null
  items?: unknown[]
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  failureReason: string | null
}
