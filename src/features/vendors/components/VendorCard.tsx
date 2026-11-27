import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, Mail, Percent, Phone, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/helpers/date'
import type { VendorRecord } from '../types/vendor.types'
import type { VendorSales } from '../api/vendor-insights.api'
import { KYC_META, STATUS_META, avatarGradient, formatInrFull, formatInrShort, vendorInitials } from '../utils/vendor-meta'

interface VendorCardProps {
  vendor: VendorRecord
  sales?: VendorSales
  index: number
  onOpen: (vendor: VendorRecord) => void
}

export function VendorCard({ vendor, sales, index, onOpen }: VendorCardProps) {
  const status = STATUS_META[vendor.status] ?? STATUS_META.PENDING
  const kyc = KYC_META[vendor.kycStatus] ?? KYC_META.PENDING
  const StatusIcon = status.icon
  const KycIcon = kyc.icon

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(vendor)}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index, 12) * 0.035, type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -4 }}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:shadow-black/30"
      aria-label={`Open ${vendor.hotelName} dashboard`}
    >
      {/* colour wash from the avatar, brightens on hover */}
      <div className={cn('pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br opacity-[0.12] blur-2xl transition-opacity duration-500 group-hover:opacity-30', avatarGradient(vendor.vendorId))} aria-hidden />

      <div className="relative flex items-start gap-3.5">
        <span className={cn(
          'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-lg ring-4',
          avatarGradient(vendor.vendorId), status.ring,
        )}>
          {vendorInitials(vendor.hotelName)}
          <span className={cn('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-card', status.dot)} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-foreground">{vendor.hotelName || `Vendor #${vendor.vendorId}`}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Vendor #{vendor.vendorId}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', status.chip)}>
              <StatusIcon className="h-3 w-3" aria-hidden />{status.label}
            </span>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', kyc.chip)}>
              <KycIcon className="h-3 w-3" aria-hidden />{kyc.label}
            </span>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sales</p>
          <p className="mt-0.5 text-sm font-bold text-foreground" title={sales ? formatInrFull(sales.revenue) : undefined}>
            {sales ? formatInrShort(sales.revenue) : '—'}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <ShoppingBag className="h-3 w-3" aria-hidden />Cards
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{sales ? sales.cardsSold.toLocaleString('en-IN') : '—'}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Percent className="h-3 w-3" aria-hidden />Fee
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{Number(vendor.commissionRate ?? 0)}%</p>
        </div>
      </div>

      <div className="relative mt-3 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 truncate"><Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />{vendor.mobileNumber || '—'}</p>
        {vendor.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />{vendor.email}</p>}
        <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />Joined {formatDate(vendor.createdAt)}</p>
      </div>
    </motion.button>
  )
}
