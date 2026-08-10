import { useState } from 'react'
import { MessageSquare, Mail, MailOpen } from 'lucide-react'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { useInAppList, useInAppStats, useRemoveInAppNotification } from '../../hooks/useInAppNotifications'
import { NotificationStatCard } from '../NotificationStatCard'
import { PendingBackendNotice } from '../PendingBackendNotice'
import { InAppInboxTable } from './InAppInboxTable'
import { SendInAppModal } from './SendInAppModal'
import type { InAppNotification } from '../../types/notification.types'

const PAGE_SIZE = 20

export function InAppPanel() {
  const canSend = usePermission(PERMISSIONS.NOTIFICATIONS.SEND)
  const [page, setPage] = useState(0)
  const [sendOpen, setSendOpen] = useState(false)

  const { data: stats, isLoading: statsLoading } = useInAppStats()
  const { data: inbox, isLoading: inboxLoading, refetch } = useInAppList(page, PAGE_SIZE)
  const { mutate: removeEntry, isPending: removing, variables: removingVars } = useRemoveInAppNotification()

  return (
    <div className="flex flex-col gap-4">
      <PendingBackendNotice reason="the NotificationLog entity has no in-app storage or read-state fields, and no in-app controller exists in notification-service yet." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NotificationStatCard
            label="Total"
            value={stats?.total}
            icon={MessageSquare}
            color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
            isLoading={statsLoading}
          />
          <NotificationStatCard
            label="Unread"
            value={stats?.unread}
            icon={Mail}
            color="bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400"
            isLoading={statsLoading}
          />
          <NotificationStatCard
            label="Read"
            value={stats?.read}
            icon={MailOpen}
            color="bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400"
            isLoading={statsLoading}
          />
        </div>
        {canSend && (
          <button
            onClick={() => setSendOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" />
            Compose
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <InAppInboxTable
          data={inbox?.content ?? []}
          isLoading={inboxLoading}
          page={page}
          totalPages={inbox?.totalPages ?? 0}
          totalElements={inbox?.totalElements ?? 0}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onRefresh={() => void refetch()}
          onDelete={(entry: InAppNotification) => removeEntry(entry.id)}
          deletingId={removing ? removingVars : undefined}
        />
      </div>

      <SendInAppModal open={sendOpen} onClose={() => setSendOpen(false)} />
    </div>
  )
}
