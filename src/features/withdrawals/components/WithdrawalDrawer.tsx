import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Building2, Landmark, Hash, Calendar, MessageSquare, CheckCircle2, XCircle, User, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'
import { useApproveWithdrawal, useRejectWithdrawal, resolveVendorName } from '../hooks/useWithdrawals'
import type { WithdrawalResponse, WithdrawalStatus } from '../types/withdrawal.types'
import type { VendorRecord } from '@/features/vendors/types/vendor.types'

function statusStyle(s: WithdrawalStatus) {
  if (s === 'APPROVED') return 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
  if (s === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
    </div>
  )
}

interface WithdrawalDrawerProps {
  withdrawal: WithdrawalResponse | null
  vendorMap: Map<number, VendorRecord>
  onClose: () => void
}

export function WithdrawalDrawer({ withdrawal, vendorMap, onClose }: WithdrawalDrawerProps) {
  return (
    <AnimatePresence>
      {withdrawal && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <DrawerContent key={withdrawal.id} withdrawal={withdrawal} vendorName={resolveVendorName(withdrawal.vendorId, vendorMap)} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerContent({ withdrawal, vendorName, onClose }: { withdrawal: WithdrawalResponse; vendorName: string; onClose: () => void }) {
  const [adminNote, setAdminNote] = useState('')
  const { mutate: approve, isPending: approving } = useApproveWithdrawal()
  const { mutate: reject, isPending: rejecting } = useRejectWithdrawal()
  const isPending = approving || rejecting

  const close = useCallback(() => onClose(), [onClose])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [close])

  const isPendingStatus = withdrawal.status === 'PENDING'

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">Withdrawal #{withdrawal.id}</span>
            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusStyle(withdrawal.status))}>
              {withdrawal.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{vendorName}</p>
        </div>
        <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Amount highlight */}
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <p className="text-xs text-muted-foreground">Withdrawal Amount</p>
        <p className="text-2xl font-bold text-foreground">
          ₹{Number(withdrawal.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {withdrawal.method === 'UPI' ? (
          <Row icon={Smartphone} label="UPI ID" value={<span className="font-mono">{withdrawal.upiId}</span>} />
        ) : (
          <>
            <Row icon={Building2} label="Bank Account Name" value={withdrawal.bankAccountName} />
            <Row icon={Landmark} label="Account Number" value={<span className="font-mono">{withdrawal.bankAccountNumber}</span>} />
            <Row icon={Hash} label="IFSC Code" value={<span className="font-mono">{withdrawal.ifscCode}</span>} />
          </>
        )}
        <Row icon={User} label="Vendor" value={vendorName} />
        {withdrawal.note && <Row icon={MessageSquare} label="Vendor Note" value={withdrawal.note} />}
        <Row icon={Calendar} label="Requested At" value={formatDateTime(withdrawal.createdAt)} />
        {withdrawal.reviewedAt && (
          <Row icon={Calendar} label="Reviewed At" value={formatDateTime(withdrawal.reviewedAt)} />
        )}
        {withdrawal.adminNote && (
          <Row icon={MessageSquare} label="Admin Note" value={
            <span className={cn(
              'inline-block rounded-lg px-2 py-1 text-xs',
              withdrawal.status === 'APPROVED' ? 'bg-green-50 text-green-700 dark:bg-green-400/10' : 'bg-red-50 text-red-700 dark:bg-red-400/10'
            )}>{withdrawal.adminNote}</span>
          } />
        )}
      </div>

      {/* Action area — only for PENDING */}
      {isPendingStatus && (
        <div className="border-t border-border p-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Admin Note (optional)
            </label>
            <textarea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note for this action…"
              disabled={isPending}
              className="block w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => approve({ id: withdrawal.id, adminNote: adminNote || undefined })}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {approving ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={() => reject({ id: withdrawal.id, adminNote: adminNote || undefined })}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              {rejecting ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
