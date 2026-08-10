// ── Core entity returned by admin-service ────────────────────────────────────

export interface VendorRecord {
  vendorId: number
  hotelName: string
  mobileNumber: string
  email: string | null
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  rejectionReason: string | null
  commissionRate: number
  branchId: number | null
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  kycDocumentUrl: string | null
  kycRejectionReason: string | null
  kycReviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface VendorPageResponse {
  content: VendorRecord[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ── Filter state ─────────────────────────────────────────────────────────────

export interface VendorFilters {
  q: string
  status: string
  kycStatus: string
}

// ── Cards (proxied from card-service, wrapped in ApiResponse) ─────────────────

export interface CardDefinitionResponse {
  id: number
  vendorId: number
  storeId: number
  name: string
  description: string | null
  cardPrice: number
  walletAmount: number
  bonusAmount: number
  validityInDays: number | null
  imageUrl: string | null
  isActive: boolean
  categoryIds: number[]
  createdAt: string
}

export interface ApiWrappedList<T> {
  success: boolean
  message: string | null
  data: T[]
}

// ── Subscriptions (proxied from card-service, ApiResponse<PageResponse<T>>) ──

export interface VendorSubscription {
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

// ── Redemptions (proxied from redemption-service, ApiResponse<PageResponse<T>>) ──

export interface VendorRedemption {
  id: number
  subscriptionId: number
  userId: number
  storeId: number
  totalAmount: number
  remainingBalance: number
  status: string
  initiatedBy: string | null
  customerName: string | null
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  failureReason: string | null
}

// ── Transactions (proxied from ledger-service, raw PageResponse<T> — no ApiResponse) ──

export interface VendorTransaction {
  id: number
  storeId: number
  customerId: number
  subscriptionId: number
  transactionType: string
  amount: number
  remarks: string | null
  createdAt: string
}

export interface VendorTransactionPage {
  content: VendorTransaction[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ── Commissions (from admin-service commission controller directly) ────────────

export interface CommissionRecordResponse {
  id: number
  vendorId: number
  vendorName: string | null
  storeId: number
  subscriptionId: number
  userId: number
  subscriptionAmount: number
  commissionRate: number
  commissionAmount: number
  status: 'PENDING' | 'SETTLED'
  settledAt: string | null
  createdAt: string
}

export interface CommissionRateHistory {
  id: number
  vendorId: number | null
  oldRate: number | null
  newRate: number
  changedByAdminId: number | null
  changedByEmail: string | null
  reason: string | null
  createdAt: string
}

// ── Menu (proxied from vendor-service, ApiResponse<List<Category>>) ───────────

export interface MenuItemResponse {
  id: number
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  itemType: string
  availabilityStatus: string
  categoryId: number
  storeId: number
  createdAt: string
  updatedAt: string
}

export interface CategoryWithItemsResponse {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  displayOrder: number | null
  items: MenuItemResponse[]
}

export interface ApiWrappedMenu {
  success: boolean
  message: string | null
  data: CategoryWithItemsResponse[]
}
