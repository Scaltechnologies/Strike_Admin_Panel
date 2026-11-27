import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Flame, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/helpers/date'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import type { CatalogCard } from '../api/card-insights.api'
import { bonusPercent, validityLabel } from '../utils/card-meta'
import { StrikeCardVisual } from './StrikeCardVisual'

/** One card in the gallery: the card itself, then how it is selling. Tapping anywhere opens its details. */
export const CardTile = memo(function CardTile({ card, index, onOpen, topSeller }: {
  card: CatalogCard
  index: number
  onOpen: (c: CatalogCard) => void
  topSeller?: boolean
}) {
  const bonus = bonusPercent(card.cardPrice, card.walletAmount)
  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index, 12) * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -6 }}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(card) } }}
      role="link"
      tabIndex={0}
      aria-label={`Open ${card.name}`}
      className="group relative flex cursor-pointer flex-col rounded-3xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:shadow-black/40"
    >
      <div className="relative">
        <StrikeCardVisual card={card} sheenDelay={(index % 6) * 0.7} />
        {topSeller && (
          <span className="absolute -right-1 -top-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-orange-500/30">
            <Flame className="h-3 w-3" /> Top seller
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-1.5 pb-1 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{card.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Store className="h-3 w-3 shrink-0" />
              <span className="truncate">{card.vendorName ?? card.storeName ?? `Vendor #${card.vendorId ?? '—'}`}</span>
            </p>
          </div>
          <span className={cn('flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            card.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', card.isActive ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground')} />
            {card.isActive ? 'On sale' : 'Paused'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Stat label="Sold" value={String(card.sold)} />
          <Stat label="Holding now" value={String(card.activeHolders)} />
          <Stat label="Revenue" value={formatInrShort(card.revenue)} strong />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {bonus > 0 && (
            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[10px] font-bold text-white">+{bonus}% extra</span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{validityLabel(card.validityInDays)}</span>
          {card.categories.slice(0, 2).map((c) => (
            <span key={c} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{c}</span>
          ))}
          {card.categories.length > 2 && <span className="text-[10px] text-muted-foreground">+{card.categories.length - 2}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted-foreground">
          <span>{card.lastSoldAt ? `Last sold ${formatRelative(card.lastSoldAt)}` : 'Not sold yet'}</span>
          <span className="flex items-center gap-0.5 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Details <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </motion.article>
  )
})

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 px-2 py-1.5 text-center">
      <p className={cn('text-sm font-bold tabular-nums', strong ? 'text-foreground' : 'text-foreground/90')}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
