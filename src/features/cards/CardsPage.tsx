import { useState, useRef, useEffect } from 'react'
import {
  Search, CreditCard, Building2, ChevronDown, CheckCircle2, XCircle, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useVendorCardDefs } from './hooks/useCards'

function formatCurrency(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

export function CardsPage() {
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorOpen, setVendorOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null)
  const [selectedVendorName, setSelectedVendorName] = useState('')
  const vendorRef = useRef<HTMLDivElement>(null)

  const { data: vendorData, isLoading: vendorsLoading } = useVendors(0, 50, {
    q: vendorSearch,
    status: 'ACTIVE',
    kycStatus: '',
  })

  const { data: cardsData, isLoading: cardsLoading } = useVendorCardDefs(selectedVendorId)
  const cards = cardsData?.data ?? []

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (vendorRef.current && !vendorRef.current.contains(e.target as Node)) {
        setVendorOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const vendors = vendorData?.content ?? []

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Cards</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View card definitions issued by vendors
        </p>
      </div>

      {/* Vendor selector */}
      <div ref={vendorRef} className="relative w-full max-w-sm">
        <button
          type="button"
          onClick={() => setVendorOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm',
            'text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring',
            selectedVendorId && 'border-primary/50 bg-primary/5',
          )}
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn('flex-1 truncate', !selectedVendorName && 'text-muted-foreground')}>
            {selectedVendorName || 'Select a vendor…'}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', vendorOpen && 'rotate-180')} />
        </button>

        {vendorOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendors…"
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {vendorsLoading ? (
                <div className="p-3 text-center text-sm text-muted-foreground">Loading…</div>
              ) : vendors.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">No vendors found</div>
              ) : (
                vendors.map((v) => (
                  <button
                    key={v.vendorId}
                    type="button"
                    onClick={() => {
                      setSelectedVendorId(v.vendorId)
                      setSelectedVendorName(v.hotelName)
                      setVendorOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                      selectedVendorId === v.vendorId && 'bg-primary/5 font-medium text-primary',
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{v.hotelName}</span>
                    <span className="font-mono text-xs text-muted-foreground">#{v.vendorId}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {!selectedVendorId ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border">
          <div className="text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Select a vendor to view their cards</p>
            <p className="mt-1 text-xs text-muted-foreground">Choose an active vendor from the dropdown above</p>
          </div>
        </div>
      ) : cardsLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border">
          <div className="text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No cards found for this vendor</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{cards.length}</span> card{cards.length !== 1 ? 's' : ''} for{' '}
            <span className="font-semibold text-foreground">{selectedVendorName}</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto pb-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{card.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">#{card.id}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      card.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400',
                    )}
                  >
                    {card.isActive
                      ? <CheckCircle2 className="h-3 w-3" />
                      : <XCircle className="h-3 w-3" />}
                    {card.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {card.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
                )}

                {/* Pricing */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {formatCurrency(card.cardPrice)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-400/10">
                    <p className="text-xs text-green-600 dark:text-green-400">Wallet</p>
                    <p className="mt-0.5 text-sm font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(card.walletAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2 text-center dark:bg-amber-400/10">
                    <p className="text-xs text-amber-600 dark:text-amber-400">Bonus</p>
                    <p className="mt-0.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {formatCurrency(card.bonusAmount)}
                    </p>
                  </div>
                </div>

                {/* Validity */}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Store #{card.storeId}</span>
                  <span>{card.validityInDays != null ? `${card.validityInDays} days` : 'No expiry'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
