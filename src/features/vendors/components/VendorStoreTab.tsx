import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useStoreByVendor } from '@/features/stores/hooks/useStores'
import { StoreProfileCard } from '@/features/stores/components/StoreProfileCard'
import { StoreTimingCard } from '@/features/stores/components/StoreTimingCard'
import { StoreHolidayCard } from '@/features/stores/components/StoreHolidayCard'
import { StoreManagerCard } from '@/features/stores/components/StoreManagerCard'
import { StoreImagesTab } from '@/features/stores/components/StoreImagesTab'

type StoreSubTab = 'overview' | 'timings' | 'holidays' | 'manager' | 'images'

const SUB_TABS: { id: StoreSubTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'timings', label: 'Timings' },
  { id: 'holidays', label: 'Holidays' },
  { id: 'manager', label: 'Manager' },
  { id: 'images', label: 'Images' },
]

interface VendorStoreTabProps {
  vendorId: number
}

export function VendorStoreTab({ vendorId }: VendorStoreTabProps) {
  const [subTab, setSubTab] = useState<StoreSubTab>('overview')

  const { data: store, isLoading } = useStoreByVendor(vendorId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          This vendor doesn&apos;t have a store yet. Stores are created automatically once a vendor
          signs up and is approved.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="mb-4 -mt-1 border-b border-border">
        <div className="-mb-px flex gap-0.5">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none',
                subTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {tab.id === 'timings' && store.timings.length > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {store.timings.length}
                </span>
              )}
              {tab.id === 'holidays' && store.holidays.length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
                  {store.holidays.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {subTab === 'overview' && <StoreProfileCard store={store} />}
      {subTab === 'timings' && <StoreTimingCard timings={store.timings ?? []} />}
      {subTab === 'holidays' && <StoreHolidayCard holidays={store.holidays ?? []} />}
      {subTab === 'manager' && <StoreManagerCard store={store} />}
      {subTab === 'images' && <StoreImagesTab store={store} />}
    </div>
  )
}
