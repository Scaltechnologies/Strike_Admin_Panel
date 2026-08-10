import { useState, useCallback } from 'react'
import { Users, RefreshCw } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { PermissionGuard } from '@/core/guards/PermissionGuard'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { useUsers } from './hooks/useUsers'
import { UserTable } from './components/UserTable'
import { UserTableSkeleton } from './components/UserTableSkeleton'
import { UserDrawer } from './components/UserDrawer'
import type { UserAuth } from './types/user.types'

const PAGE_SIZE = 20

export function UsersPage() {
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState<UserAuth | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useUsers(page, PAGE_SIZE)

  const handleRowClick = useCallback((user: UserAuth) => {
    setSelectedUser(user)
  }, [])

  const handleDrawerClose = useCallback(() => {
    setSelectedUser(null)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <PermissionGuard permission={PERMISSIONS.USERS.VIEW}>
      <PageContainer>
        <PageHeader
          title="Users"
          description="Manage app users, view profiles, and take moderation actions."
          actions={
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh users"
              className={cn(
                'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium',
                'text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
          }
        />

        {/* Summary badge */}
        {!isLoading && data && (
          <div className="mb-6 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="font-semibold text-foreground">
                {data.totalElements.toLocaleString()}
              </span>
              <span className="text-muted-foreground">total users</span>
            </div>
          </div>
        )}

        {/* States */}
        {isLoading && <UserTableSkeleton />}

        {isError && !isLoading && (
          <ErrorState
            title="Failed to load users"
            description="There was a problem fetching user data. Please check the connection and try again."
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && (
          <UserTable
            data={data}
            page={page}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
            isFetching={isFetching}
          />
        )}

        {/* Drawer */}
        <UserDrawer user={selectedUser} onClose={handleDrawerClose} />
      </PageContainer>
    </PermissionGuard>
  )
}

export default UsersPage
