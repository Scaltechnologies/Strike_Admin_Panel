import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
  isLoading: boolean
}

export function NotificationStatCard({ label, value, icon: Icon, color, isLoading }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-5 w-14 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-xl font-bold text-foreground">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}
