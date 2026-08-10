import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, formatDateTime } from '@/utils/helpers/date'
import { formatCurrency } from '@/utils/helpers/format'
import { cn } from '@/lib/utils'
import type { ApiWrappedPage, UserSubscription, UserTransaction, UserRedemption } from '../types/user.types'

// ── Subscriptions ────────────────────────────────────────────────────────────

interface UserSubscriptionsTableProps {
  data: ApiWrappedPage<UserSubscription> | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
}

export function UserSubscriptionsTable({
  data,
  isLoading,
  page,
  onPageChange,
}: UserSubscriptionsTableProps) {
  const rows = data?.data.content ?? []
  const totalPages = data?.data.totalPages ?? 0

  return (
    <SubTableShell
      isLoading={isLoading}
      isEmpty={!isLoading && rows.length === 0}
      emptyMessage="No subscriptions found for this user."
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
    >
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Card</Th>
            <Th>Status</Th>
            <Th>Balance</Th>
            <Th>Purchased</Th>
            <Th>Expires</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sub) => (
            <tr key={sub.id} className="border-b border-border/60 last:border-b-0">
              <Td>
                <div>
                  <p className="font-medium text-foreground">{sub.cardName}</p>
                  <p className="text-xs text-muted-foreground">Store #{sub.storeId}</p>
                </div>
              </Td>
              <Td>
                <StatusBadge status={sub.status.toLowerCase()} label={sub.status} size="sm" />
              </Td>
              <Td>
                <span className="font-mono">{formatCurrency(sub.walletBalance)}</span>
              </Td>
              <Td>
                <span className="text-muted-foreground">{formatDate(sub.purchasedAt)}</span>
              </Td>
              <Td>
                {sub.expiresAt ? (
                  <span className="text-muted-foreground">{formatDate(sub.expiresAt)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </SubTableShell>
  )
}

// ── Transactions ─────────────────────────────────────────────────────────────

interface UserTransactionsTableProps {
  data: ApiWrappedPage<UserTransaction> | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
}

export function UserTransactionsTable({
  data,
  isLoading,
  page,
  onPageChange,
}: UserTransactionsTableProps) {
  const rows = data?.data.content ?? []
  const totalPages = data?.data.totalPages ?? 0

  return (
    <SubTableShell
      isLoading={isLoading}
      isEmpty={!isLoading && rows.length === 0}
      emptyMessage="No transactions found for this user."
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
    >
      <table className="w-full min-w-[400px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Type</Th>
            <Th>Amount</Th>
            <Th>Remarks</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id} className="border-b border-border/60 last:border-b-0">
              <Td>
                <StatusBadge
                  status={tx.transactionType === 'CREDIT' ? 'success' : 'warning'}
                  label={tx.transactionType}
                  size="sm"
                />
              </Td>
              <Td>
                <span
                  className={cn(
                    'font-mono font-medium',
                    tx.transactionType === 'CREDIT' ? 'text-green-600' : 'text-foreground',
                  )}
                >
                  {tx.transactionType === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </Td>
              <Td>
                <span className="text-muted-foreground">{tx.remarks ?? '—'}</span>
              </Td>
              <Td>
                <span className="text-muted-foreground">{formatDateTime(tx.createdAt)}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </SubTableShell>
  )
}

// ── Redemptions ──────────────────────────────────────────────────────────────

interface UserRedemptionsTableProps {
  data: ApiWrappedPage<UserRedemption> | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
}

export function UserRedemptionsTable({
  data,
  isLoading,
  page,
  onPageChange,
}: UserRedemptionsTableProps) {
  const rows = data?.data.content ?? []
  const totalPages = data?.data.totalPages ?? 0

  return (
    <SubTableShell
      isLoading={isLoading}
      isEmpty={!isLoading && rows.length === 0}
      emptyMessage="No redemptions found for this user."
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
    >
      <table className="w-full min-w-[440px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Status</Th>
            <Th>Total</Th>
            <Th>Remaining</Th>
            <Th>Store</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-b-0">
              <Td>
                <StatusBadge
                  status={r.status.toLowerCase()}
                  label={r.status}
                  size="sm"
                />
              </Td>
              <Td>
                <span className="font-mono">{formatCurrency(r.totalAmount)}</span>
              </Td>
              <Td>
                <span className="font-mono">{formatCurrency(r.remainingBalance)}</span>
              </Td>
              <Td>
                <span className="text-muted-foreground">#{r.storeId}</span>
              </Td>
              <Td>
                <span className="text-muted-foreground">{formatDateTime(r.createdAt)}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </SubTableShell>
  )
}

// ── Shared shell ─────────────────────────────────────────────────────────────

interface SubTableShellProps {
  isLoading: boolean
  isEmpty: boolean
  emptyMessage: string
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  children: React.ReactNode
}

function SubTableShell({
  isLoading,
  isEmpty,
  emptyMessage,
  page,
  totalPages,
  onPageChange,
  children,
}: SubTableShellProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border">{children}</div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="Previous"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="Next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3">{children}</td>
}
