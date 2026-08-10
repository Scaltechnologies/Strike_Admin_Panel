import { CheckCircle2, XCircle } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/utils/helpers/date'
import { cn } from '@/lib/utils'

function cap(s: string | null | undefined): string {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
import type {
  VendorSubscription,
  VendorRedemption,
  CardDefinitionResponse,
  ApiWrappedPage,
  VendorTransactionPage,
  ApiWrappedList,
} from '../types/vendor.types'
import type { WithdrawalPage } from '@/features/withdrawals/types/withdrawal.types'

// ── Shared ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-10 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  )
}

function SkeletonRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/60 last:border-b-0">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-3 py-2.5">
              <div className="h-4 animate-pulse rounded bg-muted" style={{ animationDelay: `${(i * cols + j) * 30}ms` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

interface SubTableShellProps {
  headers: string[]
  children: React.ReactNode
}

function SubTableShell({ headers, children }: SubTableShellProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" style={{ minWidth: `${headers.length * 120}px` }}>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

interface MiniPageProps {
  page: number
  totalPages: number
  totalElements: number
  onPageChange: (p: number) => void
}

function MiniPagination({ page, totalPages, totalElements, onPageChange }: MiniPageProps) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-3 flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{totalElements.toLocaleString()} total</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
        >
          Prev
        </button>
        <span className="text-xs text-muted-foreground">{page + 1}/{totalPages}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

interface SubscriptionsTableProps {
  data: ApiWrappedPage<VendorSubscription> | undefined
  isLoading: boolean
  page: number
  onPageChange: (p: number) => void
}

export function VendorSubscriptionsTable({ data, isLoading, page, onPageChange }: SubscriptionsTableProps) {
  const rows = data?.data?.content ?? []
  const headers = ['Card', 'User ID', 'Wallet', 'Status', 'Purchased', 'Expires']

  return (
    <div>
      <SubTableShell headers={headers}>
        {isLoading ? (
          <SkeletonRows cols={headers.length} />
        ) : rows.length === 0 ? (
          <EmptyRow cols={headers.length} message="No subscriptions found." />
        ) : (
          rows.map((s) => (
            <tr key={s.id} className="border-b border-border/60 last:border-b-0">
              <td className="px-3 py-2.5 text-sm font-medium text-foreground">{s.cardName}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{s.userId}</td>
              <td className="px-3 py-2.5 text-sm text-green-600 dark:text-green-400">
                {formatCurrency(s.walletBalance)}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge
                  status={s.status?.toLowerCase() ?? 'default'}
                  label={cap(s.status)}
                  size="sm"
                  dot
                />
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(s.purchasedAt)}</td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {s.expiresAt ? formatDate(s.expiresAt) : '—'}
              </td>
            </tr>
          ))
        )}
      </SubTableShell>
      {data?.data && (
        <MiniPagination
          page={page}
          totalPages={data.data.totalPages}
          totalElements={data.data.totalElements}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

// ── Transactions ──────────────────────────────────────────────────────────────

interface TransactionsTableProps {
  data: VendorTransactionPage | undefined
  isLoading: boolean
  page: number
  onPageChange: (p: number) => void
}

export function VendorTransactionsTable({ data, isLoading, page, onPageChange }: TransactionsTableProps) {
  const rows = data?.content ?? []
  const headers = ['ID', 'Type', 'Amount', 'Customer', 'Remarks', 'Date']

  return (
    <div>
      <SubTableShell headers={headers}>
        {isLoading ? (
          <SkeletonRows cols={headers.length} />
        ) : rows.length === 0 ? (
          <EmptyRow cols={headers.length} message="No transactions found." />
        ) : (
          rows.map((t) => (
            <tr key={t.id} className="border-b border-border/60 last:border-b-0">
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{t.id}</td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    'text-xs font-semibold uppercase',
                    t.transactionType === 'CREDIT'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {t.transactionType}
                </span>
              </td>
              <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                {formatCurrency(t.amount)}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{t.customerId}</td>
              <td className="max-w-[140px] truncate px-3 py-2.5 text-xs text-muted-foreground">
                {t.remarks ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(t.createdAt)}</td>
            </tr>
          ))
        )}
      </SubTableShell>
      {data && (
        <MiniPagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

// ── Redemptions ───────────────────────────────────────────────────────────────

interface RedemptionsTableProps {
  data: ApiWrappedPage<VendorRedemption> | undefined
  isLoading: boolean
  page: number
  onPageChange: (p: number) => void
}

export function VendorRedemptionsTable({ data, isLoading, page, onPageChange }: RedemptionsTableProps) {
  const rows = data?.data?.content ?? []
  const headers = ['ID', 'Customer', 'Total', 'Remaining', 'Status', 'Date']

  return (
    <div>
      <SubTableShell headers={headers}>
        {isLoading ? (
          <SkeletonRows cols={headers.length} />
        ) : rows.length === 0 ? (
          <EmptyRow cols={headers.length} message="No redemptions found." />
        ) : (
          rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-b-0">
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{r.id}</td>
              <td className="px-3 py-2.5 text-sm text-foreground">{r.customerName ?? '—'}</td>
              <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                {formatCurrency(r.totalAmount)}
              </td>
              <td className="px-3 py-2.5 text-sm text-muted-foreground">
                {formatCurrency(r.remainingBalance)}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge
                  status={r.status?.toLowerCase() ?? 'default'}
                  label={cap(r.status)}
                  size="sm"
                  dot
                />
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(r.createdAt)}</td>
            </tr>
          ))
        )}
      </SubTableShell>
      {data?.data && (
        <MiniPagination
          page={page}
          totalPages={data.data.totalPages}
          totalElements={data.data.totalElements}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

// ── Cards ─────────────────────────────────────────────────────────────────────

interface CardsTableProps {
  data: ApiWrappedList<CardDefinitionResponse> | undefined
  isLoading: boolean
}

export function VendorCardsTable({ data, isLoading }: CardsTableProps) {
  const cards = data?.data ?? []
  const headers = ['ID', 'Name', 'Price', 'Wallet', 'Bonus', 'Validity', 'Status']

  return (
    <SubTableShell headers={headers}>
      {isLoading ? (
        <SkeletonRows cols={headers.length} />
      ) : cards.length === 0 ? (
        <EmptyRow cols={headers.length} message="No cards found." />
      ) : (
        cards.map((c) => (
          <tr key={c.id} className="border-b border-border/60 last:border-b-0">
            <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{c.id}</td>
            <td className="px-3 py-2.5 text-sm font-medium text-foreground">{c.name}</td>
            <td className="px-3 py-2.5 text-sm text-foreground">{formatCurrency(c.cardPrice)}</td>
            <td className="px-3 py-2.5 text-sm text-green-600 dark:text-green-400">
              {formatCurrency(c.walletAmount)}
            </td>
            <td className="px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
              {formatCurrency(c.bonusAmount)}
            </td>
            <td className="px-3 py-2.5 text-xs text-muted-foreground">
              {c.validityInDays != null ? `${c.validityInDays}d` : '—'}
            </td>
            <td className="px-3 py-2.5">
              <StatusBadge
                status={c.isActive ? 'active' : 'inactive'}
                label={c.isActive ? 'Active' : 'Inactive'}
                size="sm"
                dot
              />
            </td>
          </tr>
        ))
      )}
    </SubTableShell>
  )
}

// ── Withdrawals ───────────────────────────────────────────────────────────────

interface WithdrawalsTableProps {
  data: WithdrawalPage | undefined
  isLoading: boolean
  page: number
  onPageChange: (p: number) => void
  actionPendingId: number | null
  onApprove: (id: number) => void
  onReject: (id: number) => void
}

export function VendorWithdrawalsTable({
  data, isLoading, page, onPageChange, actionPendingId, onApprove, onReject,
}: WithdrawalsTableProps) {
  const rows = data?.content ?? []
  const headers = ['ID', 'Amount', 'Bank Details', 'Status', 'Requested', '']

  return (
    <div>
      <SubTableShell headers={headers}>
        {isLoading ? (
          <SkeletonRows cols={headers.length} />
        ) : rows.length === 0 ? (
          <EmptyRow cols={headers.length} message="No withdrawal requests found." />
        ) : (
          rows.map((w) => {
            const isPending = w.status === 'PENDING'
            const isBusy = actionPendingId === w.id
            return (
              <tr key={w.id} className="border-b border-border/60 last:border-b-0">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{w.id}</td>
                <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                  {formatCurrency(w.amount)}
                </td>
                <td className="px-3 py-2.5">
                  <p className="truncate text-sm text-foreground">{w.bankAccountName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{w.ifscCode}</p>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={w.status.toLowerCase()} label={cap(w.status)} size="sm" dot />
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(w.createdAt)}</td>
                <td className="px-3 py-2.5">
                  {isPending && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onApprove(w.id)}
                        title="Approve"
                        className="flex h-6 w-6 items-center justify-center rounded-md text-green-600 transition-colors hover:bg-green-50 disabled:opacity-40 dark:text-green-400 dark:hover:bg-green-400/10"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onReject(w.id)}
                        title="Reject"
                        className="flex h-6 w-6 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-400/10"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })
        )}
      </SubTableShell>
      {data && (
        <MiniPagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
