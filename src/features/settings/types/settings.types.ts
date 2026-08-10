// Matches the real backend shape (verified live against GET /api/admin/settings):
// a flat key-value registry, NOT a single settings object. Every value is
// stored as a string regardless of valueType.
export interface PlatformSetting {
  id: number
  settingKey: string
  settingValue: string
  valueType: 'STRING' | 'BOOLEAN' | 'INTEGER' | 'DECIMAL'
  description: string
  isPublic: boolean
  updatedBy: number | null
  updatedAt: string
}

export const SETTING_KEYS = {
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
} as const

// Verified live against GET/PATCH /api/admin/commissions/rate/global.
export interface GlobalCommissionRate {
  globalCommissionRate: number
  previousRate?: number
}

export interface CommissionRateHistoryEntry {
  id: number
  vendorId: number | null
  oldRate: number | null
  newRate: number
  changedByAdminId: number | null
  changedByEmail: string | null
  reason: string | null
  createdAt: string
}

export interface CommissionRateHistoryPage {
  content: CommissionRateHistoryEntry[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
