import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { AnalyticsMonthlyRevenue } from '@/features/dashboard/types/dashboard.types'
import { formatCurrency } from '@/utils/helpers/format'
import { ChartCard } from './ChartCard'

interface RevenueChartProps {
  data?: AnalyticsMonthlyRevenue[]
  isLoading?: boolean
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const isEmpty = !isLoading && (!data || data.length === 0)

  return (
    <ChartCard
      title="Revenue Trend"
      description="Monthly subscription revenue and commission"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage="Revenue data will appear here once transactions are recorded."
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCommission" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-muted-foreground)" stopOpacity={0.12} />
              <stop offset="95%" stopColor="var(--color-muted-foreground)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="subscriptionRevenue"
            name="Revenue"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="commission"
            name="Commission"
            stroke="var(--color-muted-foreground)"
            strokeWidth={1.5}
            fill="url(#gradCommission)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
