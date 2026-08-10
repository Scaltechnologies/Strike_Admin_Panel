import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, Ban, ShieldBan, RotateCcw, AlertTriangle } from 'lucide-react'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { useStoreByVendor } from '@/features/stores/hooks/useStores'
import { useVendorWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from '@/features/withdrawals/hooks/useWithdrawals'
import {
  useVendorDetail,
  useVendorCards,
  useVendorSubscriptions,
  useVendorRedemptions,
  useVendorTransactions,
  useVendorMenu,
  useApproveVendor,
  useRejectVendor,
  useSuspendVendor,
  useReactivateVendor,
} from '../hooks/useVendors'
import { VendorProfileCard } from './VendorProfileCard'
import { VendorStoreTab } from './VendorStoreTab'
import { VendorKYCCard } from './VendorKYCCard'
import { VendorCommissionCard } from './VendorCommissionCard'
import { VendorMenuTable } from './VendorMenuTable'
import {
  VendorCardsTable,
  VendorSubscriptionsTable,
  VendorTransactionsTable,
  VendorRedemptionsTable,
  VendorWithdrawalsTable,
} from './VendorSubTable'
import type { VendorRecord } from '../types/vendor.types'

type DrawerTab =
  | 'overview'
  | 'store'
  | 'kyc'
  | 'commission'
  | 'cards'
  | 'subscriptions'
  | 'transactions'
  | 'redemptions'
  | 'withdrawals'
  | 'menu'

const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'store', label: 'Store' },
  { id: 'kyc', label: 'KYC' },
  { id: 'commission', label: 'Commission' },
  { id: 'cards', label: 'Cards' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'redemptions', label: 'Redemptions' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'menu', label: 'Menu' },
]

type VendorAction = 'approve' | 'reject' | 'suspend' | 'reactivate'

interface VendorDrawerProps {
  vendor: VendorRecord | null
  onClose: () => void
}

export function VendorDrawer({ vendor, onClose }: VendorDrawerProps) {
  return (
    <AnimatePresence>
      {vendor && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          {/* key on vendorId so state resets when switching vendors */}
          <DrawerContent key={vendor.vendorId} vendor={vendor} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  )
}

// ── Inner component (remounts on vendorId change) ─────────────────────────────

interface DrawerContentProps {
  vendor: VendorRecord
  onClose: () => void
}

function DrawerContent({ vendor, onClose }: DrawerContentProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview')
  const [subPage, setSubPage] = useState(0)
  const [confirmAction, setConfirmAction] = useState<VendorAction | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [confirmWithdrawal, setConfirmWithdrawal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null)
  const [withdrawalNote, setWithdrawalNote] = useState('')

  const canApprove = usePermission(PERMISSIONS.VENDORS.APPROVE)

  // Fetch detail (always)
  const { data: detail, isLoading: detailLoading } = useVendorDetail(vendor.vendorId)
  const currentVendor = detail ?? vendor

  // Lazy fetch per-tab — Menu tab needs storeId even if Store tab wasn't visited yet
  const { data: store, isLoading: storeLoading } = useStoreByVendor(
    activeTab === 'store' || activeTab === 'menu' ? vendor.vendorId : null,
  )
  const { data: cards, isLoading: cardsLoading } = useVendorCards(
    activeTab === 'cards' ? vendor.vendorId : null,
  )
  const { data: subscriptions, isLoading: subsLoading } = useVendorSubscriptions(
    activeTab === 'subscriptions' ? vendor.vendorId : null,
    subPage,
  )
  const { data: transactions, isLoading: txLoading } = useVendorTransactions(
    activeTab === 'transactions' ? vendor.vendorId : null,
    subPage,
  )
  const { data: redemptions, isLoading: rdLoading } = useVendorRedemptions(
    activeTab === 'redemptions' ? vendor.vendorId : null,
    subPage,
  )
  const { data: withdrawals, isLoading: wdLoading } = useVendorWithdrawals(
    activeTab === 'withdrawals' ? vendor.vendorId : null,
    subPage,
  )

  // Menu needs storeId — resolved from store response
  const storeId = store?.id ?? null
  const { data: menuData, isLoading: menuLoading } = useVendorMenu(
    activeTab === 'menu' && storeId !== null ? storeId : null,
  )

  // Mutations
  const { mutate: approve, isPending: approving } = useApproveVendor()
  const { mutate: reject, isPending: rejecting } = useRejectVendor()
  const { mutate: suspend, isPending: suspending } = useSuspendVendor()
  const { mutate: reactivate, isPending: reactivating } = useReactivateVendor()
  const { mutate: approveWithdrawal, isPending: approvingWd } = useApproveWithdrawal()
  const { mutate: rejectWithdrawal, isPending: rejectingWd } = useRejectWithdrawal()

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmWithdrawal) setConfirmWithdrawal(null)
        else if (confirmAction) setConfirmAction(null)
        else close()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [confirmAction, confirmWithdrawal, close])

  function handleTabChange(tab: DrawerTab) {
    setActiveTab(tab)
    setSubPage(0)
  }

  function handleConfirmAction() {
    const reason = actionReason || undefined
    if (confirmAction === 'approve') {
      approve(vendor.vendorId, { onSuccess: () => setConfirmAction(null) })
    } else if (confirmAction === 'reject') {
      reject({ vendorId: vendor.vendorId, reason }, { onSuccess: () => { setConfirmAction(null); setActionReason('') } })
    } else if (confirmAction === 'suspend') {
      suspend({ vendorId: vendor.vendorId, reason }, { onSuccess: () => { setConfirmAction(null); setActionReason('') } })
    } else if (confirmAction === 'reactivate') {
      reactivate(vendor.vendorId, { onSuccess: () => setConfirmAction(null) })
    }
  }

  function handleConfirmWithdrawal() {
    if (!confirmWithdrawal) return
    const adminNote = withdrawalNote || undefined
    const onSuccess = () => { setConfirmWithdrawal(null); setWithdrawalNote('') }
    if (confirmWithdrawal.action === 'approve') {
      approveWithdrawal({ id: confirmWithdrawal.id, adminNote }, { onSuccess })
    } else {
      rejectWithdrawal({ id: confirmWithdrawal.id, adminNote }, { onSuccess })
    }
  }

  const isLoading = approving || rejecting || suspending || reactivating
  const status = currentVendor.status

  return (
    <>
      <motion.div
        key="vendor-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-2xl sm:w-[560px] lg:w-[620px]"
        role="dialog"
        aria-modal="true"
        aria-label="Vendor details"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Vendor Details
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              #{vendor.vendorId} · {vendor.hotelName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status action buttons */}
            {canApprove && status === 'PENDING' && (
              <ActionBtn
                onClick={() => setConfirmAction('approve')}
                variant="success"
                icon={CheckCircle2}
                label="Approve"
              />
            )}
            {canApprove && (status === 'PENDING' || status === 'ACTIVE') && (
              <ActionBtn
                onClick={() => { setActionReason(''); setConfirmAction(status === 'ACTIVE' ? 'suspend' : 'reject') }}
                variant="danger"
                icon={status === 'ACTIVE' ? Ban : ShieldBan}
                label={status === 'ACTIVE' ? 'Suspend' : 'Reject'}
              />
            )}
            {canApprove && (status === 'SUSPENDED' || status === 'REJECTED') && (
              <ActionBtn
                onClick={() => setConfirmAction('reactivate')}
                variant="default"
                icon={RotateCcw}
                label="Reactivate"
              />
            )}

            <button
              onClick={close}
              aria-label="Close drawer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 overflow-x-auto border-b border-border px-5">
          <div className="-mb-px flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition-colors focus-visible:outline-none',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' && (
            <VendorProfileCard vendor={currentVendor} isLoading={detailLoading} />
          )}
          {activeTab === 'store' && (
            <VendorStoreTab vendorId={vendor.vendorId} />
          )}
          {activeTab === 'kyc' && (
            <VendorKYCCard vendor={currentVendor} />
          )}
          {activeTab === 'commission' && (
            <VendorCommissionCard vendor={currentVendor} />
          )}
          {activeTab === 'cards' && (
            <VendorCardsTable data={cards} isLoading={cardsLoading} />
          )}
          {activeTab === 'subscriptions' && (
            <VendorSubscriptionsTable
              data={subscriptions}
              isLoading={subsLoading}
              page={subPage}
              onPageChange={setSubPage}
            />
          )}
          {activeTab === 'transactions' && (
            <VendorTransactionsTable
              data={transactions}
              isLoading={txLoading}
              page={subPage}
              onPageChange={setSubPage}
            />
          )}
          {activeTab === 'redemptions' && (
            <VendorRedemptionsTable
              data={redemptions}
              isLoading={rdLoading}
              page={subPage}
              onPageChange={setSubPage}
            />
          )}
          {activeTab === 'withdrawals' && (
            <VendorWithdrawalsTable
              data={withdrawals}
              isLoading={wdLoading}
              page={subPage}
              onPageChange={setSubPage}
              actionPendingId={(approvingWd || rejectingWd) ? (confirmWithdrawal?.id ?? null) : null}
              onApprove={(id) => setConfirmWithdrawal({ id, action: 'approve' })}
              onReject={(id) => { setWithdrawalNote(''); setConfirmWithdrawal({ id, action: 'reject' }) }}
            />
          )}
          {activeTab === 'menu' && (
            <>
              {!store && !storeLoading && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Load the Store tab first to resolve the menu.
                </p>
              )}
              {(store || storeLoading) && (
                <VendorMenuTable data={menuData} isLoading={menuLoading || storeLoading} />
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Confirm: approve */}
      <ConfirmationDialog
        open={confirmAction === 'approve'}
        title="Approve Vendor"
        description={`Approve ${vendor.hotelName}? They will be activated and notified.`}
        confirmLabel="Approve"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
        isLoading={isLoading}
      />

      {/* Confirm: reject */}
      <ConfirmationDialog
        open={confirmAction === 'reject'}
        title="Reject Vendor"
        description={`Reject ${vendor.hotelName}? Optionally provide a reason.`}
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={handleConfirmAction}
        onCancel={() => { setConfirmAction(null); setActionReason('') }}
        isLoading={isLoading}
      >
        <ReasonInput value={actionReason} onChange={setActionReason} placeholder="Rejection reason (optional)…" />
      </ConfirmationDialog>

      {/* Confirm: suspend */}
      <ConfirmationDialog
        open={confirmAction === 'suspend'}
        title="Suspend Vendor"
        description={`Suspend ${vendor.hotelName}? This will restrict their access.`}
        confirmLabel="Suspend"
        variant="destructive"
        onConfirm={handleConfirmAction}
        onCancel={() => { setConfirmAction(null); setActionReason('') }}
        isLoading={isLoading}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              The vendor will be notified and will not be able to accept new subscriptions.
            </p>
          </div>
          <ReasonInput value={actionReason} onChange={setActionReason} placeholder="Suspension reason (optional)…" />
        </div>
      </ConfirmationDialog>

      {/* Confirm: reactivate */}
      <ConfirmationDialog
        open={confirmAction === 'reactivate'}
        title="Reactivate Vendor"
        description={`Reactivate ${vendor.hotelName}? Their status will be set to Active.`}
        confirmLabel="Reactivate"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
        isLoading={isLoading}
      />

      {/* Confirm: approve withdrawal */}
      <ConfirmationDialog
        open={confirmWithdrawal?.action === 'approve'}
        title="Approve Withdrawal"
        description={`Approve withdrawal #${confirmWithdrawal?.id} for ${vendor.hotelName}? This releases the funds and cannot be undone.`}
        confirmLabel="Approve"
        onConfirm={handleConfirmWithdrawal}
        onCancel={() => setConfirmWithdrawal(null)}
        isLoading={approvingWd}
      />

      {/* Confirm: reject withdrawal */}
      <ConfirmationDialog
        open={confirmWithdrawal?.action === 'reject'}
        title="Reject Withdrawal"
        description={`Reject withdrawal #${confirmWithdrawal?.id} for ${vendor.hotelName}? Optionally provide a reason.`}
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={handleConfirmWithdrawal}
        onCancel={() => { setConfirmWithdrawal(null); setWithdrawalNote('') }}
        isLoading={rejectingWd}
      >
        <ReasonInput value={withdrawalNote} onChange={setWithdrawalNote} placeholder="Rejection note (optional)…" />
      </ConfirmationDialog>
    </>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function ActionBtn({
  onClick,
  variant,
  icon: Icon,
  label,
}: {
  onClick: () => void
  variant: 'success' | 'danger' | 'default'
  icon: React.ElementType
  label: string
}) {
  const styles = {
    success:
      'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20',
    default:
      'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
        styles[variant],
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  )
}

function ReasonInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="mt-1">
      <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={cn(
          'mt-1.5 block w-full resize-none rounded-lg border border-border bg-card',
          'px-3 py-2 text-sm placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring',
        )}
      />
    </div>
  )
}
