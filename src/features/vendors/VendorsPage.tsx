import { useState, useCallback, useEffect, useRef } from 'react'
import { Store, RefreshCw } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { PermissionGuard } from '@/core/guards/PermissionGuard'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { useVendors } from './hooks/useVendors'
import { VendorTable } from './components/VendorTable'
import { VendorTableSkeleton } from './components/VendorTableSkeleton'
import { VendorFiltersBar } from './components/VendorFilters'
import { VendorDrawer } from './components/VendorDrawer'
import type { VendorRecord, VendorFilters } from './types/vendor.types'

const PAGE_SIZE = 20
const EMPTY_FILTERS: VendorFilters = { q: '', status: '', kycStatus: '' }

export function VendorsPage() {
  const [page, setPage] = useState(0)
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord | null>(null)
  const [filters, setFilters] = useState<VendorFilters>(EMPTY_FILTERS)
  // Debounced search: local input state, committed to filters after 350ms
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search → commit to filters.q (resets page)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => {
        if (prev.q === searchInput) return prev
        return { ...prev, q: searchInput }
      })
      setPage(0)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  const { data, isLoading, isError, refetch, isFetching } = useVendors(page, PAGE_SIZE, filters)

  const handleRowClick = useCallback((vendor: VendorRecord) => {
    setSelectedVendor(vendor)
  }, [])

  const handleDrawerClose = useCallback(() => {
    setSelectedVendor(null)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  function handleFilterChange(key: keyof VendorFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }

  function handleClearFilters() {
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
    setPage(0)
  }

  return (
    <PermissionGuard permission={PERMISSIONS.VENDORS.VIEW}>
      <PageContainer>
        <PageHeader
          title="Vendors"
          description="Manage vendor registrations, approvals, KYC, commissions, and store operations."
          actions={
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh vendors"
              className={cn(
                'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium',
                'text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
          }
        />

        {/* Filters */}
        <div className="mb-5">
          <VendorFiltersBar
            filters={filters}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Summary badge */}
        {!isLoading && data && (
          <div className="mb-6 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm">
              <Store className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="font-semibold text-foreground">
                {data.totalElements.toLocaleString()}
              </span>
              <span className="text-muted-foreground">total vendors</span>
            </div>
          </div>
        )}

        {/* States */}
        {isLoading && <VendorTableSkeleton />}

        {isError && !isLoading && (
          <ErrorState
            title="Failed to load vendors"
            description="There was a problem fetching vendor data. Please check the connection and try again."
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && (
          <VendorTable
            data={data}
            page={page}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
            isFetching={isFetching}
          />
        )}

        {/* Drawer */}
        <VendorDrawer vendor={selectedVendor} onClose={handleDrawerClose} />
      </PageContainer>
    </PermissionGuard>
  )
}

export default VendorsPage
