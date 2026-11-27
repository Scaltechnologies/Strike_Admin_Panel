import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Banknote, BookOpen, CreditCard, FileCheck2, History, LayoutDashboard, Percent, Receipt, ScrollText, Store, Users,
  type LucideIcon,
} from 'lucide-react'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { PermissionGuard } from '@/core/guards/PermissionGuard'
import { PERMISSIONS } from '@/constants/permissions'
import { hasPermission } from '@/core/auth/auth'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { useStoreByVendor } from '@/features/stores/hooks/useStores'
import { useApproveWithdrawal, useRejectWithdrawal, useVendorWithdrawals } from '@/features/withdrawals/hooks/useWithdrawals'
import {
  useVendorCards, useVendorDetail, useVendorMenu, useVendorRedemptions, useVendorSubscriptions, useVendorTransactions,
} from './hooks/useVendors'
import { useVendorInsights } from './api/vendor-insights.api'
import { VendorHero } from './dashboard/VendorHero'
import { VendorKpis, VendorSalesMix, VendorSalesTrend } from './dashboard/VendorPerformance'
import { VendorActivity } from './dashboard/VendorActivity'
import type { VendorTab } from './utils/vendor-tabs'
import { VendorProfileCard } from './components/VendorProfileCard'
import { VendorStoreTab } from './components/VendorStoreTab'
import { VendorKYCCard } from './components/VendorKYCCard'
import { VendorCommissionCard } from './components/VendorCommissionCard'
import { VendorMenuTable } from './components/VendorMenuTable'
import {
  VendorCardsTable, VendorRedemptionsTable, VendorSubscriptionsTable, VendorTransactionsTable, VendorWithdrawalsTable,
} from './components/VendorSubTable'

const TABS: { id: VendorTab; label: string; icon: LucideIcon; perm?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'menu', label: 'Menu', icon: BookOpen },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'redemptions', label: 'Redemptions', icon: Receipt },
  { id: 'transactions', label: 'Transactions', icon: ScrollText },
  { id: 'payouts', label: 'Payouts', icon: Banknote },
  { id: 'commission', label: 'Commission', icon: Percent },
  { id: 'kyc', label: 'KYC', icon: FileCheck2 },
  { id: 'activity', label: 'Activity', icon: History, perm: 'SEC_AUDIT_LOGS' },
]

function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Panel title={title} subtitle={subtitle} icon={icon}>
      {children}
    </Panel>
  )
}

export function VendorDashboardPage({ vendorId, tab = 'overview' }: { vendorId: number; tab?: VendorTab }) {
  const navigate = useNavigate()
  const [subPage, setSubPage] = useState(0)
  const [confirmWd, setConfirmWd] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null)
  const [wdNote, setWdNote] = useState('')

  const detail = useVendorDetail(vendorId)
  const insights = useVendorInsights(vendorId)
  const vendor = detail.data

  const needsStore = tab === 'menu'
  const store = useStoreByVendor(needsStore ? vendorId : null)
  const cards = useVendorCards(tab === 'cards' ? vendorId : null)
  const members = useVendorSubscriptions(tab === 'members' ? vendorId : null, subPage)
  const recentRedemptions = useVendorRedemptions(tab === 'overview' || tab === 'redemptions' ? vendorId : null, tab === 'redemptions' ? subPage : 0)
  const transactions = useVendorTransactions(tab === 'transactions' ? vendorId : null, subPage)
  const withdrawals = useVendorWithdrawals(tab === 'payouts' ? vendorId : null, subPage)
  const menu = useVendorMenu(tab === 'menu' && store.data?.id != null ? store.data.id : null)
  const approveWd = useApproveWithdrawal()
  const rejectWd = useRejectWithdrawal()

  const tabs = TABS.filter((t) => !t.perm || hasPermission(t.perm))
  const goTab = (id: VendorTab) => {
    setSubPage(0)
    void navigate({ to: '/vendors/$vendorId', params: { vendorId: String(vendorId) }, search: { tab: id === 'overview' ? undefined : id }, replace: true })
  }

  const runWithdrawal = () => {
    if (!confirmWd) return
    const onSuccess = () => { setConfirmWd(null); setWdNote('') }
    const adminNote = wdNote.trim() || undefined
    if (confirmWd.action === 'approve') approveWd.mutate({ id: confirmWd.id, adminNote }, { onSuccess })
    else rejectWd.mutate({ id: confirmWd.id, adminNote }, { onSuccess })
  }

  if (detail.isError) {
    return (
      <div className="p-6">
        <ErrorState title="Couldn't open this vendor" description="They may not exist, or the connection failed." onRetry={() => void detail.refetch()} />
      </div>
    )
  }

  return (
    <PermissionGuard permission={PERMISSIONS.VENDORS.VIEW}>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {vendor ? <VendorHero vendor={vendor} /> : <div className="h-56 animate-pulse rounded-3xl bg-muted" />}

        <VendorKpis data={insights.data} loading={insights.isLoading} />

        {/* Tab bar */}
        <nav aria-label="Vendor sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
          <div role="tablist" className="flex min-w-max gap-1">
            {tabs.map(({ id, label, icon: Icon }) => {
              const on = tab === id
              return (
                <button key={id} type="button" role="tab" aria-selected={on} onClick={() => goTab(id)}
                  className={cn('relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                    on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  {on && <motion.span layoutId="vendor-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#e01a00] shadow-md shadow-orange-500/25"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <Icon className="relative h-4 w-4" aria-hidden />
                  <span className="relative">{label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Tab content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* One failing tab shows its own error instead of blanking the whole page */}
          <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'overview' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2"><VendorSalesTrend data={insights.data} loading={insights.isLoading} /></div>
                <VendorSalesMix data={insights.data} loading={insights.isLoading} />
              </div>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Section title="Business details" icon={<Store className="h-4 w-4" />}>
                  {vendor ? <VendorProfileCard vendor={vendor} /> : <div className="h-40 animate-pulse rounded-xl bg-muted" />}
                </Section>
                <div className="xl:col-span-2">
                  <Section title="Latest redemptions" subtitle="Card benefits members used at this vendor" icon={<Receipt className="h-4 w-4" />}>
                    <VendorRedemptionsTable data={recentRedemptions.data} isLoading={recentRedemptions.isLoading} page={0} onPageChange={() => goTab('redemptions')} />
                  </Section>
                </div>
              </div>
            </div>
          )}

          {tab === 'store' && (
            <Section title="Store" subtitle="Profile, timings, holidays, manager and photos" icon={<Store className="h-4 w-4" />}>
              <VendorStoreTab vendorId={vendorId} />
            </Section>
          )}

          {tab === 'menu' && (
            <Section title="Menu" subtitle="Categories and items" icon={<BookOpen className="h-4 w-4" />}>
              {!store.isLoading && !store.data ? (
                <p className="py-10 text-center text-sm text-muted-foreground">This vendor hasn&apos;t set up a store yet, so there&apos;s no menu.</p>
              ) : (
                <VendorMenuTable data={menu.data} isLoading={menu.isLoading || store.isLoading} />
              )}
            </Section>
          )}

          {tab === 'cards' && (
            <Section title="Cards" subtitle="Cards this vendor sells" icon={<CreditCard className="h-4 w-4" />}>
              <VendorCardsTable data={cards.data} isLoading={cards.isLoading} />
            </Section>
          )}

          {tab === 'members' && (
            <Section title="Members" subtitle="Customers who bought this vendor's cards" icon={<Users className="h-4 w-4" />}>
              <VendorSubscriptionsTable data={members.data} isLoading={members.isLoading} page={subPage} onPageChange={setSubPage} />
            </Section>
          )}

          {tab === 'redemptions' && (
            <Section title="Redemptions" icon={<Receipt className="h-4 w-4" />}>
              <VendorRedemptionsTable data={recentRedemptions.data} isLoading={recentRedemptions.isLoading} page={subPage} onPageChange={setSubPage} />
            </Section>
          )}

          {tab === 'transactions' && (
            <Section title="Transactions" subtitle="Wallet ledger entries for this vendor" icon={<ScrollText className="h-4 w-4" />}>
              <VendorTransactionsTable data={transactions.data} isLoading={transactions.isLoading} page={subPage} onPageChange={setSubPage} />
            </Section>
          )}

          {tab === 'payouts' && (
            <Section title="Payouts" subtitle="Withdrawal requests from this vendor" icon={<Banknote className="h-4 w-4" />}>
              <VendorWithdrawalsTable
                data={withdrawals.data} isLoading={withdrawals.isLoading} page={subPage} onPageChange={setSubPage}
                actionPendingId={(approveWd.isPending || rejectWd.isPending) ? (confirmWd?.id ?? null) : null}
                onApprove={(id) => setConfirmWd({ id, action: 'approve' })}
                onReject={(id) => { setWdNote(''); setConfirmWd({ id, action: 'reject' }) }}
              />
            </Section>
          )}

          {tab === 'commission' && vendor && (
            <Section title="Commission" subtitle="Fee rate, history and settlements" icon={<Percent className="h-4 w-4" />}>
              <VendorCommissionCard vendor={vendor} />
            </Section>
          )}

          {tab === 'kyc' && vendor && (
            <Section title="KYC" subtitle="Identity documents" icon={<FileCheck2 className="h-4 w-4" />}>
              <VendorKYCCard vendor={vendor} />
            </Section>
          )}

          {tab === 'activity' && vendor && <VendorActivity vendor={vendor} />}
          </ErrorBoundary>
        </motion.div>
      </div>

      <ConfirmationDialog
        open={confirmWd?.action === 'approve'} title="Approve withdrawal" confirmLabel="Approve" isLoading={approveWd.isPending}
        description={`Approve withdrawal #${confirmWd?.id}? This releases the money to the vendor and can't be undone.`}
        onConfirm={runWithdrawal} onCancel={() => setConfirmWd(null)}
      />
      <ConfirmationDialog
        open={confirmWd?.action === 'reject'} title="Reject withdrawal" confirmLabel="Reject" variant="destructive" isLoading={rejectWd.isPending}
        description={`Reject withdrawal #${confirmWd?.id}?`} onConfirm={runWithdrawal} onCancel={() => { setConfirmWd(null); setWdNote('') }}
      >
        <div className="mt-1">
          <label className="text-xs font-medium text-muted-foreground">Note for the vendor (optional)</label>
          <textarea value={wdNote} onChange={(e) => setWdNote(e.target.value)} rows={3}
            className="mt-1.5 block w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </ConfirmationDialog>
    </PermissionGuard>
  )
}

export default VendorDashboardPage
