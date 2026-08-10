import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VendorFilters } from '../types/vendor.types'

interface VendorFiltersBarProps {
  filters: VendorFilters
  searchValue: string
  onSearchChange: (value: string) => void
  onFilterChange: (key: keyof VendorFilters, value: string) => void
  onClear: () => void
}

const VENDOR_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'REJECTED', label: 'Rejected' },
]

const KYC_STATUSES = [
  { value: '', label: 'All KYC' },
  { value: 'PENDING', label: 'KYC Pending' },
  { value: 'VERIFIED', label: 'KYC Verified' },
  { value: 'REJECTED', label: 'KYC Rejected' },
]

const SELECT_BASE =
  'h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer'

const hasActiveFilters = (f: VendorFilters) => f.status !== '' || f.kycStatus !== '' || f.q !== ''

export function VendorFiltersBar({
  filters,
  searchValue,
  onSearchChange,
  onFilterChange,
  onClear,
}: VendorFiltersBarProps) {
  const active = hasActiveFilters(filters)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search hotel, email, mobile…"
          className={cn(
            'h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm',
            'placeholder:text-muted-foreground shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className={SELECT_BASE}
        aria-label="Filter by vendor status"
      >
        {VENDOR_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* KYC filter */}
      <select
        value={filters.kycStatus}
        onChange={(e) => onFilterChange('kycStatus', e.target.value)}
        className={SELECT_BASE}
        aria-label="Filter by KYC status"
      >
        {KYC_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Clear */}
      {active && (
        <button
          onClick={onClear}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground',
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Clear
        </button>
      )}
    </div>
  )
}
