import { useState, useCallback } from 'react'
import { GitBranch, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from '@/constants/roles'
import { cn } from '@/lib/utils'
import { useBranchesList, useActiveBranches } from './hooks/useBranches'
import { BranchTable } from './components/BranchTable'
import { BranchDrawer } from './components/BranchDrawer'
import { BranchForm } from './components/BranchForm'
import type { Branch } from './types/branch.types'

const PAGE_SIZE = 20

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
  isLoading: boolean
}

function StatCard({ label, value, icon: Icon, color, isLoading }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          color,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-5 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-xl font-bold text-foreground">
            {value?.toLocaleString() ?? '—'}
          </p>
        )}
      </div>
    </div>
  )
}

export function BranchesPage() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [page, setPage] = useState(0)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data: branchData, isLoading, refetch } = useBranchesList(page, PAGE_SIZE)
  const { data: activeBranches, isLoading: activeLoading } = useActiveBranches()

  const totalElements = branchData?.totalElements ?? 0
  const activeCount = activeBranches?.length ?? 0
  const inactiveCount = totalElements > 0 ? totalElements - activeCount : 0

  const handleCloseDrawer = useCallback(() => setSelectedBranch(null), [])

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Branches</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage operational branches and their assigned managers.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <GitBranch className="h-4 w-4" aria-hidden />
            New Branch
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Branches"
          value={isLoading ? undefined : totalElements}
          icon={GitBranch}
          color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
          isLoading={isLoading}
        />
        <StatCard
          label="Active"
          value={activeLoading ? undefined : activeCount}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400"
          isLoading={activeLoading}
        />
        <StatCard
          label="Inactive"
          value={activeLoading || isLoading ? undefined : inactiveCount}
          icon={XCircle}
          color="bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400"
          isLoading={activeLoading || isLoading}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <BranchTable
          data={branchData?.content ?? []}
          isLoading={isLoading}
          page={page}
          totalPages={branchData?.totalPages ?? 0}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onRefresh={() => void refetch()}
          onViewBranch={setSelectedBranch}
        />
      </div>

      {/* Drawer */}
      <BranchDrawer branch={selectedBranch} onClose={handleCloseDrawer} />

      {/* Create form */}
      {showCreateForm && (
        <BranchForm onClose={() => setShowCreateForm(false)} />
      )}
    </div>
  )
}
