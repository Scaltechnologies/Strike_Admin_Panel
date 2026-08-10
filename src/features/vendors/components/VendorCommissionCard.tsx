import { useState } from 'react'
import { TrendingUp, Percent } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/utils/helpers/date'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { useVendorCommissions, useVendorCommissionRateHistory, useUpdateCommissionRate } from '../hooks/useVendors'
import type { VendorRecord } from '../types/vendor.types'

interface VendorCommissionCardProps {
  vendor: VendorRecord
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value)
}

export function VendorCommissionCard({ vendor }: VendorCommissionCardProps) {
  const canEdit = usePermission(PERMISSIONS.COMMISSION.EDIT)
  const [page, setPage] = useState(0)
  const [historyPage, setHistoryPage] = useState(0)
  const [showRateDialog, setShowRateDialog] = useState(false)
  const [rateInput, setRateInput] = useState(String(Number(vendor.commissionRate).toFixed(2)))
  const [rateError, setRateError] = useState('')

  const { data: commissions, isLoading: commissionsLoading } = useVendorCommissions(vendor.vendorId, page)
  const { data: rateHistory, isLoading: historyLoading } = useVendorCommissionRateHistory(vendor.vendorId, historyPage)
  const { mutate: updateRate, isPending: updatingRate } = useUpdateCommissionRate()

  function handleRateConfirm() {
    const rate = parseFloat(rateInput)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setRateError('Rate must be between 0 and 100')
      return
    }
    updateRate(
      { vendorId: vendor.vendorId, rate },
      { onSuccess: () => { setShowRateDialog(false); setRateError('') } },
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Rate */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-400/10">
            <Percent className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Commission Rate</p>
            <p className="text-2xl font-bold text-foreground">
              {Number(vendor.commissionRate).toFixed(2)}%
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setRateInput(String(Number(vendor.commissionRate).toFixed(2)))
              setRateError('')
              setShowRateDialog(true)
            }}
            className={cn(
              'rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground',
              'transition-colors hover:bg-primary/90',
            )}
          >
            Update Rate
          </button>
        )}
      </div>

      {/* Commission records */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Commission Records
        </p>
        {commissionsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !commissions?.content.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No commission records.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['ID', 'Amount', 'Commission', 'Rate', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.content.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{c.id}</td>
                    <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                      {formatCurrency(c.subscriptionAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(c.commissionAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {Number(c.commissionRate).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge
                        status={c.status === 'SETTLED' ? 'success' : 'pending'}
                        label={c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : '—'}
                        size="sm"
                        dot
                      />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {commissions && commissions.totalPages > 1 && (
          <MiniPagination
            page={page}
            totalPages={commissions.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Rate change history */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Rate Change History
        </p>
        {historyLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !rateHistory?.content.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No rate history.</p>
        ) : (
          <div className="space-y-2">
            {rateHistory.content.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="text-sm">
                    <span className="text-muted-foreground line-through">{h.oldRate ?? '—'}%</span>
                    {' → '}
                    <span className="font-semibold text-foreground">{Number(h.newRate).toFixed(2)}%</span>
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
                  {h.reason && <p className="text-xs text-muted-foreground">{h.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {rateHistory && rateHistory.totalPages > 1 && (
          <MiniPagination
            page={historyPage}
            totalPages={rateHistory.totalPages}
            onPageChange={setHistoryPage}
          />
        )}
      </div>

      {/* Update rate dialog */}
      <ConfirmationDialog
        open={showRateDialog}
        title="Update Commission Rate"
        description={`Set a new commission rate for ${vendor.hotelName}.`}
        confirmLabel="Update"
        onConfirm={handleRateConfirm}
        onCancel={() => { setShowRateDialog(false); setRateError('') }}
        isLoading={updatingRate}
      >
        <div className="mt-1">
          <label className="text-xs font-medium text-muted-foreground">
            New Rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={rateInput}
            onChange={(e) => { setRateInput(e.target.value); setRateError('') }}
            className={cn(
              'mt-1.5 block w-full rounded-lg border bg-card px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              rateError ? 'border-destructive' : 'border-border',
            )}
          />
          {rateError && <p className="mt-1 text-xs text-destructive">{rateError}</p>}
        </div>
      </ConfirmationDialog>
    </div>
  )
}

function MiniPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
      >
        Prev
      </button>
      <span className="text-xs text-muted-foreground">
        {page + 1} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
      >
        Next
      </button>
    </div>
  )
}
