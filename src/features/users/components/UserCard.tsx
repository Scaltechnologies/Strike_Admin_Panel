import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, Clock, CreditCard, Mail, Phone, ShoppingBag, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative } from '@/utils/helpers/date'
import { avatarGradient, formatInrFull, formatInrShort } from '@/features/vendors/utils/vendor-meta'
import type { DirectoryUser } from '../api/user-insights.api'
import { displayName, spendTier, userStatus } from '../utils/user-meta'
import { UserAvatar } from './UserAvatar'

export function UserCard({ user, index, onOpen }: { user: DirectoryUser; index: number; onOpen: (u: DirectoryUser) => void }) {
  const status = userStatus(user)
  const tier = spendTier(Number(user.spent))
  const name = displayName(user)
  const StatusIcon = status.icon

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(user)}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index, 12) * 0.035, type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -4 }}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:shadow-black/30"
      aria-label={`Open ${name}`}
    >
      <div className={cn('pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br opacity-[0.12] blur-2xl transition-opacity duration-500 group-hover:opacity-30', avatarGradient(user.id))} aria-hidden />

      <div className="relative flex items-start gap-3.5">
        <UserAvatar id={user.id} name={name} photo={user.profilePicUrl} dot={status.dot} className="h-12 w-12 rounded-full text-base ring-4 ring-background" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold text-foreground">{name}</p>
            {tier && <span className={cn('shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider', tier.cls)}>{tier.label}</span>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Customer #{user.id}</p>
          <span className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', status.chip)}>
            <StatusIcon className="h-3 w-3" aria-hidden />{status.label}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3">
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><ShoppingBag className="h-3 w-3" />Spent</p>
          <p className="mt-0.5 text-sm font-bold text-foreground" title={formatInrFull(user.spent)}>{formatInrShort(user.spent)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><CreditCard className="h-3 w-3" />Cards</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{user.activeCards}<span className="text-xs font-medium text-muted-foreground"> active</span></p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><Wallet className="h-3 w-3" />Wallet</p>
          <p className="mt-0.5 text-sm font-bold text-foreground" title={formatInrFull(user.walletBalance)}>{formatInrShort(user.walletBalance)}</p>
        </div>
      </div>

      <div className="relative mt-3 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 truncate"><Phone className="h-3.5 w-3.5 shrink-0" />{user.mobileNumber}</p>
        {user.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{user.email}</p>}
        <p className="flex items-center gap-2">
          {user.lastPurchaseAt
            ? <><Clock className="h-3.5 w-3.5 shrink-0" />Last bought {formatRelative(user.lastPurchaseAt)}</>
            : <><CalendarDays className="h-3.5 w-3.5 shrink-0" />Joined {user.createdAt ? formatDate(user.createdAt) : '—'}</>}
        </p>
      </div>
    </motion.button>
  )
}
