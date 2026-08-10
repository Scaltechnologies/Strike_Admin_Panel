import { motion, type Variants } from 'framer-motion'
import {
  IndianRupee,
  Users,
  Store,
  CreditCard,
  Clock,
  ArrowDownCircle,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { formatCurrency, formatNumber } from '@/utils/helpers/format'
import type { DashboardData } from '../types/dashboard.types'

interface KPICardsProps {
  data?: DashboardData
  isLoading: boolean
}

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const card: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
  },
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const stats = data?.stats

  const cards = [
    {
      title: 'Subscription Revenue',
      value: formatCurrency(stats?.totalSubscriptionRevenue ?? 0),
      icon: <IndianRupee className="h-5 w-5" aria-hidden />,
      variant: 'default' as const,
    },
    {
      title: 'Total Users',
      value: formatNumber(stats?.totalUsers ?? 0),
      icon: <Users className="h-5 w-5" aria-hidden />,
      variant: 'default' as const,
    },
    {
      title: 'Active Vendors',
      value: formatNumber(stats?.vendors?.active ?? 0),
      icon: <Store className="h-5 w-5" aria-hidden />,
      variant: 'success' as const,
    },
    {
      title: 'Pending Vendors',
      value: formatNumber(stats?.vendors?.pending ?? 0),
      icon: <Clock className="h-5 w-5" aria-hidden />,
      variant:
        (stats?.vendors?.pending ?? 0) > 0
          ? ('warning' as const)
          : ('default' as const),
    },
    {
      title: 'Commission Earned',
      value: formatCurrency(stats?.totalCommissionEarned ?? 0),
      icon: <CreditCard className="h-5 w-5" aria-hidden />,
      variant: 'default' as const,
    },
    {
      title: 'Total Redemptions',
      value: formatNumber(stats?.totalRedemptions ?? 0),
      icon: <ArrowDownCircle className="h-5 w-5" aria-hidden />,
      variant: 'default' as const,
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {cards.map((stat) => (
        <motion.div key={stat.title} variants={card}>
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            isLoading={isLoading}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}