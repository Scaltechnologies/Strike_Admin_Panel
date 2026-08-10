export type RedemptionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED' | 'REVERSED'

export interface RedemptionItem {
  menuItemId: number
  menuItemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface RedemptionRecord {
  id: number
  subscriptionId: number
  userId: number
  storeId: number
  totalAmount: number
  remainingBalance: number | null
  status: RedemptionStatus
  initiatedBy: string | null
  customerName: string | null
  items: RedemptionItem[]
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  failureReason: string | null
}

// redemption-service ApiResponse<PageResponse<T>>
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

export interface RedemptionStats {
  totalRedemptions?: number
  totalAmount?: number
  [key: string]: unknown
}
