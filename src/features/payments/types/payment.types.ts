export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentGateway = 'MOCK' | 'RAZORPAY' | 'STRIPE' | string

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
  // Not returned by GET /api/admin/payments today — kept optional in case
  // the refund endpoint response ever grows these.
  refundAmount?: number | null
  refundReason?: string | null
  refundedAt?: string | null
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
