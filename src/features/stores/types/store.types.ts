export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED' | 'SUSPENDED'

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface StoreTiming {
  id: number
  storeId: number
  dayOfWeek: DayOfWeek
  openTime: string | null   // "HH:mm:ss" — Java LocalTime
  closeTime: string | null
  isClosed: boolean
}

export interface StoreHoliday {
  id: number
  storeId: number
  date: string              // "YYYY-MM-DD" — Java LocalDate
  reason: string | null
  createdAt: string
}

export interface StoreRecord {
  id: number
  vendorId: number
  name: string
  address: string
  phone: string | null
  email: string | null
  category: string | null
  description: string | null
  logoUrl: string | null
  latitude: number | null
  longitude: number | null
  distanceKm: number | null
  managerName: string | null
  managerPhone: string | null
  status: StoreStatus
  timings: StoreTiming[]
  holidays: StoreHoliday[]
  createdAt: string
  updatedAt: string
}

// Vendor-service PaginationResponse: uses "page" field, not "number"
export interface StorePage {
  content: StoreRecord[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface StoreFilters {
  status: string
  q: string
}

// Admin-service Branch entity
export interface Branch {
  id: number
  name: string
  city: string | null
  state: string | null
  country: string | null
  address: string | null
  radiusKm: number
  latitude: number | null
  longitude: number | null
  isActive: boolean
  contactEmail: string | null
  contactPhone: string | null
  createdAt: string
  updatedAt: string
}
