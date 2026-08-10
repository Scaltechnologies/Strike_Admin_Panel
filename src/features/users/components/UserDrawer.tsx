import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ShieldBan, ShieldCheck, AlertTriangle } from 'lucide-react'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import {
  useUserDetails,
  useUserSubscriptions,
  useUserRedemptions,
  useUserTransactions,
  useBanUser,
  useUnbanUser,
} from '../hooks/useUsers'
import { UserProfileCard } from './UserProfileCard'
import {
  UserSubscriptionsTable,
  UserTransactionsTable,
  UserRedemptionsTable,
} from './UserSubTable'
import type { UserAuth } from '../types/user.types'

type DrawerTab = 'profile' | 'subscriptions' | 'transactions' | 'redemptions'

const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'redemptions', label: 'Redemptions' },
]

interface UserDrawerProps {
  user: UserAuth | null
  onClose: () => void
}

export function UserDrawer({ user, onClose }: UserDrawerProps) {
  return (
    <AnimatePresence>
      {user && (
        <>
          {/* Backdrop */}
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

          {/* Drawer — keyed on user.id so state resets on user change */}
          <DrawerContent key={user.id} user={user} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  )
}

// ── Inner drawer (remounts when user changes) ─────────────────────────────────

interface DrawerContentProps {
  user: UserAuth
  onClose: () => void
}

function DrawerContent({ user, onClose }: DrawerContentProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('profile')
  const [subPage, setSubPage] = useState(0)
  const [confirmAction, setConfirmAction] = useState<'ban' | 'unban' | null>(null)

  const canEdit = usePermission(PERMISSIONS.USERS.EDIT)

  const { data: details, isLoading: detailsLoading } = useUserDetails(user.id)
  const { data: subscriptions, isLoading: subsLoading } = useUserSubscriptions(
    activeTab === 'subscriptions' ? user.id : null,
    subPage,
  )
  const { data: transactions, isLoading: txLoading } = useUserTransactions(
    activeTab === 'transactions' ? user.id : null,
    subPage,
  )
  const { data: redemptions, isLoading: rdLoading } = useUserRedemptions(
    activeTab === 'redemptions' ? user.id : null,
    subPage,
  )

  const { mutate: ban, isPending: banning } = useBanUser()
  const { mutate: unban, isPending: unbanning } = useUnbanUser()

  const close = useCallback(() => onClose(), [onClose])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmAction) {
          setConfirmAction(null)
        } else {
          close()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [confirmAction, close])

  function handleTabChange(tab: DrawerTab) {
    setActiveTab(tab)
    setSubPage(0)
  }

  const isBanned = details?.auth.banned ?? user.banned

  function handleConfirmAction() {
    if (confirmAction === 'ban') {
      ban(user.id)
    } else if (confirmAction === 'unban') {
      unban(user.id)
    }
    setConfirmAction(null)
  }

  return (
    <>
      <motion.div
        key="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-2xl sm:w-[520px] lg:w-[580px]"
        role="dialog"
        aria-modal="true"
        aria-label="User details"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              User Details
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              #{user.id} · {user.mobileNumber}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setConfirmAction(isBanned ? 'unban' : 'ban')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  isBanned
                    ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20',
                )}
              >
                {isBanned ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Unban
                  </>
                ) : (
                  <>
                    <ShieldBan className="h-3.5 w-3.5" />
                    Ban
                  </>
                )}
              </button>
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
        <div className="shrink-0 border-b border-border px-5">
          <div className="-mb-px flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none',
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
          {activeTab === 'profile' && (
            <UserProfileCard
              details={details ?? { auth: user, profile: null }}
              isLoading={detailsLoading}
            />
          )}

          {activeTab === 'subscriptions' && (
            <UserSubscriptionsTable
              data={subscriptions}
              isLoading={subsLoading}
              page={subPage}
              onPageChange={setSubPage}
            />
          )}

          {activeTab === 'transactions' && (
            <UserTransactionsTable
              data={transactions}
              isLoading={txLoading}
              page={subPage}
              onPageChange={setSubPage}
            />
          )}

          {activeTab === 'redemptions' && (
            <UserRedemptionsTable
              data={redemptions}
              isLoading={rdLoading}
              page={subPage}
              onPageChange={setSubPage}
            />
          )}
        </div>
      </motion.div>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={confirmAction !== null}
        title={confirmAction === 'ban' ? 'Ban User' : 'Unban User'}
        description={
          confirmAction === 'ban'
            ? `Are you sure you want to ban user #${user.id} (${user.mobileNumber})? They will no longer be able to log in.`
            : `Are you sure you want to unban user #${user.id} (${user.mobileNumber})? They will be able to log in again.`
        }
        confirmLabel={confirmAction === 'ban' ? 'Ban User' : 'Unban User'}
        variant={confirmAction === 'ban' ? 'destructive' : 'default'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
        isLoading={banning || unbanning}
      >
        {confirmAction === 'ban' && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This will immediately prevent the user from logging in. Any active sessions will be
              invalidated.
            </p>
          </div>
        )}
      </ConfirmationDialog>
    </>
  )
}
