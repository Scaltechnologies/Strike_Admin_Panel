export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface WithdrawalResponse {
  id: number
  vendorId: number
  amount: number
  bankAccountNumber: string
  bankAccountName: string
  ifscCode: string
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
