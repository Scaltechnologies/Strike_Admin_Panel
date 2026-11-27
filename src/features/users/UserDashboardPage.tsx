import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { CreditCard, HandCoins, LayoutDashboard, Route, ScrollText, ShoppingBag, UserRound, type LucideIcon } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { PermissionGuard } from '@/core/guards/PermissionGuard'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { useUserDetails, useUserRedemptions, useUserSubscriptions, useUserTransactions } from './hooks/useUsers'
import { useUserInsights, useUserPurchases } from './api/user-insights.api'
import { UserHero } from './dashboard/UserHero'
import { FavouriteVendors, PurchasesTable, UserKpis, UserSpendTrend } from './dashboard/UserInsightsViews'
import { UserJourney } from './dashboard/UserJourney'
import { UserProfileCard } from './components/UserProfileCard'
import { UserRedemptionsTable, UserSubscriptionsTable, UserTransactionsTable } from './components/UserSubTable'
import type { UserTab } from './utils/user-meta'

const TABS: { id: UserTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'redemptions', label: 'Redemptions', icon: HandCoins },
  { id: 'transactions', label: 'Transactions', icon: ScrollText },
  { id: 'activity', label: 'Journey', icon: Route },
]

export function UserDashboardPage({ userId, tab = 'overview' }: { userId: number; tab?: UserTab }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const details = useUserDetails(userId)
  const insights = useUserInsights(userId)
  const isOverview = tab === 'overview'
  const isJourney = tab === 'activity'
  const purchases = useUserPurchases(isOverview || isJourney || tab === 'purchases' ? userId : null, tab === 'purchases' ? page : 0, isJourney ? 50 : 10)
  const redemptions = useUserRedemptions(isOverview || isJourney || tab === 'redemptions' ? userId : null, tab === 'redemptions' ? page : 0)
  const cards = useUserSubscriptions(tab === 'cards' ? userId : null, page)
  const transactions = useUserTransactions(tab === 'transactions' ? userId : null, page)
  const mobile = details.data?.auth?.mobileNumber

  const goTab = (id: UserTab) => {
    setPage(0)
    void navigate({ to: '/users/$userId', params: { userId: String(userId) }, search: { tab: id === 'overview' ? undefined : id }, replace: true })
  }

  if (details.isError) {
    return <div className="p-6"><ErrorState title="Couldn't open this customer" description="They may not exist, or the connection failed." onRetry={() => void details.refetch()} /></div>
  }

  return (
    <PermissionGuard permission={PERMISSIONS.USERS.VIEW}>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <UserHero userId={userId} details={details.data} spent={insights.data?.totalSpent} />
        <UserKpis data={insights.data} loading={insights.isLoading} />

        <nav aria-label="Customer sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
          <div role="tablist" className="flex min-w-max gap-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const on = tab === id
              return (
                <button key={id} type="button" role="tab" aria-selected={on} onClick={() => goTab(id)}
                  className={cn('relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  {on && <motion.span layoutId="user-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 to-[#e01a00] shadow-md shadow-rose-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* One failing tab shows its own error instead of blanking the whole page */}
          <ErrorBoundary key={tab} fallback={<TabError />}>
          {isOverview && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2"><UserSpendTrend data={insights.data} loading={insights.isLoading} /></div>
                <FavouriteVendors data={insights.data} loading={insights.isLoading} />
              </div>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <UserJourney userId={userId} mobile={mobile} purchases={purchases.data} redemptions={redemptions.data}
                    loading={purchases.isLoading || redemptions.isLoading} limit={12} title="Recent journey" />
                </div>
                <Panel title="Profile" subtitle="Account and contact details" icon={<UserRound className="h-4 w-4" />}>
                  {details.data ? <UserProfileCard details={details.data} isLoading={false} /> : <div className="h-48 animate-pulse rounded-xl bg-muted" />}
                </Panel>
              </div>
            </div>
          )}

          {tab === 'purchases' && (
            <Panel title="Purchases" subtitle="Every card this customer bought, with discounts and refunds" icon={<ShoppingBag className="h-4 w-4" />}>
              <PurchasesTable data={purchases.data} loading={purchases.isLoading} page={page} onPage={setPage} />
            </Panel>
          )}

          {tab === 'cards' && (
            <Panel title="Cards" subtitle="Cards they hold and their wallet balances" icon={<CreditCard className="h-4 w-4" />}>
              <UserSubscriptionsTable data={cards.data} isLoading={cards.isLoading} page={page} onPageChange={setPage} />
            </Panel>
          )}

          {tab === 'redemptions' && (
            <Panel title="Redemptions" subtitle="Where they used their cards" icon={<HandCoins className="h-4 w-4" />}>
              <UserRedemptionsTable data={redemptions.data} isLoading={redemptions.isLoading} page={page} onPageChange={setPage} />
            </Panel>
          )}

          {tab === 'transactions' && (
            <Panel title="Transactions" subtitle="Wallet ledger entries" icon={<ScrollText className="h-4 w-4" />}>
              <UserTransactionsTable data={transactions.data} isLoading={transactions.isLoading} page={page} onPageChange={setPage} />
            </Panel>
          )}

          {isJourney && (
            <UserJourney userId={userId} mobile={mobile} purchases={purchases.data} redemptions={redemptions.data}
              loading={purchases.isLoading || redemptions.isLoading} limit={150} />
          )}
          </ErrorBoundary>
        </motion.div>
      </div>
    </PermissionGuard>
  )
}

export default UserDashboardPage
