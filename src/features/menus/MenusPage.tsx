import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Search, Leaf, Drumstick, ShoppingBag, ChevronDown, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStores } from '@/features/stores/hooks/useStores'
import { useStoreMenu } from './hooks/useMenus'
import type { CategoryWithItemsResponse, MenuItemResponse } from './types/menu.types'

function VegBadge({ type }: { type: string | null }) {
  if (!type) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium',
        type === 'VEG'
          ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400',
      )}
    >
      {type === 'VEG' ? <Leaf className="h-2.5 w-2.5" /> : <Drumstick className="h-2.5 w-2.5" />}
      {type === 'VEG' ? 'Veg' : 'Non-veg'}
    </span>
  )
}

function AvailabilityBadge({ status }: { status: string | null }) {
  const available = status === 'AVAILABLE' || status === null
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-xs font-medium',
        available
          ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400',
      )}
    >
      {available ? 'Available' : 'Out of stock'}
    </span>
  )
}

function MenuItemCard({ item }: { item: MenuItemResponse }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{item.name}</p>
          <p className="shrink-0 font-mono text-sm font-semibold text-foreground">₹{item.price}</p>
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <VegBadge type={item.itemType} />
          <AvailabilityBadge status={item.availabilityStatus} />
        </div>
      </div>
    </div>
  )
}

function CategorySection({ category, search, vegFilter }: {
  category: CategoryWithItemsResponse
  search: string
  vegFilter: string
}) {
  const filtered = useMemo(() => {
    let items = category.items
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description?.toLowerCase().includes(q) ?? false),
      )
    }
    if (vegFilter === 'VEG') items = items.filter((i) => i.itemType === 'VEG')
    if (vegFilter === 'NON_VEG') items = items.filter((i) => i.itemType === 'NON_VEG')
    return items
  }, [category.items, search, vegFilter])

  if (filtered.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {filtered.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export function MenusPage() {
  const [storeSearch, setStoreSearch] = useState('')
  const [storeOpen, setStoreOpen] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [selectedStoreName, setSelectedStoreName] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [vegFilter, setVegFilter] = useState('')
  const storeRef = useRef<HTMLDivElement>(null)

  const { data: storeData, isLoading: storesLoading } = useStores(0, 50, { status: 'ACTIVE', q: storeSearch })
  const { data: categories, isLoading: menuLoading } = useStoreMenu(selectedStoreId)

  const stores = storeData?.content ?? []

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) {
        setStoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allItems = useMemo(
    () => (categories ?? []).flatMap((c) => c.items),
    [categories],
  )

  const totalItems = allItems.length
  const vegCount = allItems.filter((i) => i.itemType === 'VEG').length
  const availableCount = allItems.filter((i) => i.availabilityStatus === 'AVAILABLE' || i.availabilityStatus === null).length

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Menus</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Browse menu categories and items by store
        </p>
      </div>

      {/* Store selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div ref={storeRef} className="relative w-full max-w-sm">
          <button
            type="button"
            onClick={() => setStoreOpen((o) => !o)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm',
              'text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring',
              selectedStoreId && 'border-primary/50 bg-primary/5',
            )}
          >
            <ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn('flex-1 truncate', !selectedStoreName && 'text-muted-foreground')}>
              {selectedStoreName || 'Select a store…'}
            </span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', storeOpen && 'rotate-180')} />
          </button>

          {storeOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="Search stores…"
                    className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {storesLoading ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">Loading…</div>
                ) : stores.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">No stores found</div>
                ) : (
                  stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStoreId(s.id)
                        setSelectedStoreName(s.name)
                        setStoreOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                        selectedStoreId === s.id && 'bg-primary/5 font-medium text-primary',
                      )}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">#{s.id}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {selectedStoreId && (
          <>
            {/* Item search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Veg filter */}
            <div className="flex overflow-hidden rounded-lg border border-border bg-card text-xs">
              {[
                { value: '', label: 'All' },
                { value: 'VEG', label: 'Veg' },
                { value: 'NON_VEG', label: 'Non-veg' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVegFilter(opt.value)}
                  className={cn(
                    'px-3 py-2 font-medium transition-colors hover:bg-muted',
                    vegFilter === opt.value && 'bg-primary/10 text-primary',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {!selectedStoreId ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border">
          <div className="text-center">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Select a store to view its menu</p>
            <p className="mt-1 text-xs text-muted-foreground">Choose an active store from the dropdown above</p>
          </div>
        </div>
      ) : menuLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border">
          <div className="text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No menu found for this store</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card px-5 py-3">
            <div className="text-sm">
              <span className="font-semibold text-foreground">{categories.length}</span>
              <span className="ml-1 text-muted-foreground">categories</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">{totalItems}</span>
              <span className="ml-1 text-muted-foreground">items</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-green-600">{vegCount}</span>
              <span className="ml-1 text-muted-foreground">veg</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">{availableCount}</span>
              <span className="ml-1 text-muted-foreground">available</span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-6 overflow-y-auto pb-4">
            {categories.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat}
                search={itemSearch}
                vegFilter={vegFilter}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
