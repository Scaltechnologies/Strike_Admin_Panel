import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { DashboardVendorStats } from '@/features/dashboard/types/dashboard.types'
import { ChartCard } from './ChartCard'

interface VendorStatusChartProps {
  data?: DashboardVendorStats
  isLoading?: boolean
}

const SLICES = [
  { key: 'active' as const, label: 'Active', color: '#16A34A' },
  { key: 'pending' as const, label: 'Pending', color: '#D97706' },
  { key: 'suspended' as const, label: 'Suspended', color: '#EA580C' },
  { key: 'rejected' as const, label: 'Rejected', color: '#DC2626' },
]

interface TooltipItem {
  name?: string
  value?: number
  payload?: { fill?: string }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.payload?.fill }} />
        <span className="text-muted-foreground">{item.name}:</span>
        <span className="font-medium text-foreground">{item.value}</span>
      </div>
    </div>
  )
}

export function VendorStatusChart({ data, isLoading }: VendorStatusChartProps) {
  const chartData = data
    ? SLICES.map((s) => ({ name: s.label, value: data[s.key], fill: s.color })).filter(
        (d) => d.value > 0,
      )
    : []
  const isEmpty = !isLoading && chartData.length === 0

  return (
    <ChartCard
      title="Vendor Distribution"
      description="Status breakdown of all vendors"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage="No vendor data available yet."
    >
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
