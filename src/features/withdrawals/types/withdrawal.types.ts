export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type WithdrawalMethod = 'BANK_TRANSFER' | 'UPI'

export interface WithdrawalResponse {
  id: number
  vendorId: number
  amount: number
  method: WithdrawalMethod
  bankAccountNumber: string | null
  bankAccountName: string | null
  ifscCode: string | null
  upiId: string | null
  note: string | null
  status: WithdrawalStatus
  adminNote: string | null
  reviewedBy: number | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WithdrawalPage {
  content: WithdrawalResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface WithdrawalStats {
  totalRequests?: number
  pendingRequests?: number
  approvedRequests?: number
  rejectedRequests?: number
  totalApprovedAmount?: number
  [key: string]: unknown
}
