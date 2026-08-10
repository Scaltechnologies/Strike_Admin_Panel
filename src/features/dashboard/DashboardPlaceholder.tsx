import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonCard } from '@/components/common/SkeletonLoader'
import { useAuthStore } from '@/store/auth-store'

export function DashboardPlaceholder() {
  const { user } = useAuthStore()

  return (
    <PageContainer>
      <PageHeader
        title={user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
        description="Your platform overview and key metrics"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <div className="h-4 w-4 rounded bg-primary/30" />
              </div>
              <span className="text-xs text-muted-foreground">Phase 2</span>
            </div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground mt-1">Metric placeholder</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SkeletonCard rows={4} />
        <SkeletonCard rows={4} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="mb-2 text-sm font-medium text-foreground">Phase 1 — Foundation Complete</p>
        <p className="text-sm text-muted-foreground">
          The infrastructure is ready. Phase 2 will implement the full dashboard with metrics,
          charts, and real-time data from the Strike backend API.
        </p>
      </div>
    </PageContainer>
  )
}

export default DashboardPlaceholder
