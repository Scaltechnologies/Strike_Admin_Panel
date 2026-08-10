import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVendors, useVendorDetail } from '@/features/vendors/hooks/useVendors'
import type { VendorRecord } from '@/features/vendors/types/vendor.types'

interface VendorComboboxProps {
  value: number | undefined
  onChange: (vendorId: number | undefined) => void
  disabled?: boolean
}

export function VendorCombobox({ value, onChange, disabled }: VendorComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selected, setSelected] = useState<VendorRecord | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const { data, isFetching } = useVendors(0, 20, { q: debouncedQuery, status: '', kycStatus: '' })
  const vendors = data?.content ?? []

  // Edit mode: `value` may already be set (e.g. an existing coupon's vendorId) before the
  // user has interacted with the combobox at all, so `selected` won't have a name for it yet.
  const needsInitialLookup = value != null && (!selected || selected.vendorId !== value)
  const { data: initialVendor } = useVendorDetail(needsInitialLookup ? value! : null)
  const displayVendor = selected && value === selected.vendorId ? selected : needsInitialLookup ? (initialVendor ?? null) : null

  function handleSelect(vendor: VendorRecord) {
    setSelected(vendor)
    onChange(vendor.vendorId)
    setOpen(false)
    setQuery('')
  }

  function handleClear() {
    setSelected(null)
    onChange(undefined)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60',
        )}
      >
        <span className={cn('truncate', !displayVendor && 'text-muted-foreground')}>
          {displayVendor ? displayVendor.hotelName : 'All vendors'}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendor by name…"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div role="listbox" className="max-h-56 overflow-y-auto p-1">
            <button
              type="button"
              role="option"
              aria-selected={value == null}
              onClick={handleClear}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <span className="italic text-muted-foreground">All vendors</span>
              {value == null && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
            </button>
            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Loading…
              </div>
            )}
            {!isFetching && vendors.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No vendors found.</p>
            )}
            {!isFetching &&
              vendors.map((vendor) => (
                <button
                  key={vendor.vendorId}
                  type="button"
                  role="option"
                  aria-selected={value === vendor.vendorId}
                  onClick={() => handleSelect(vendor)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                >
                  <span className="truncate">{vendor.hotelName}</span>
                  {value === vendor.vendorId && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
