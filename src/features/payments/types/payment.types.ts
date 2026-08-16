export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentGateway = 'MOCK' | 'RAZORPAY' | 'STRIPE' | string
export type PaymentReversalReason = 'DUPLICATE_ENTRY' | 'CUSTOMER_CANCELLED' | 'OTHER'

export interface PaymentResponse {
  id: number
  userId: number
  subscriptionId: number
  vendorId: number
  storeId: number
  cardName: string
  cardPrice: number
  walletAmount: number
  amountPaid: number
  discountApplied: number
  couponCode: string | null
  status: PaymentStatus
  gateway: PaymentGateway
  gatewayTransactionId: string | null
  createdAt: string
  updatedAt: string
  refundReason: PaymentReversalReason | null
  refundNote: string | null
  refundedAt: string | null
  refundedBy: number | null
}

export interface PaymentPage {
  content: PaymentResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface PaymentStats {
  totalPayments?: number
  completedPayments?: number
  failedPayments?: number
  refundedPayments?: number
  totalRevenue?: number
  totalRefunded?: number
  [key: string]: unknown
}
