import { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  Bell,
  BarChart3,
  History,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  MessageSquare,
  LayoutTemplate,
  Mail,
  MessageCircle,
} from 'lucide-react'
import { Timeline } from '@/components/common/Timeline'
import { DetailTabs, type DetailTab } from '@/components/common/DetailTabs'
import { usePersistedTab } from '@/hooks/useDetailTabs'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { useNotificationList, useNotificationStats } from './hooks/useNotifications'
import { NotificationLogTable } from './components/NotificationLogTable'
import { SendNotificationModal } from './components/SendNotificationModal'
import { SendBulkNotificationModal } from './components/SendBulkNotificationModal'
import { NotificationStatCard } from './components/NotificationStatCard'
import { PushPanel } from './components/push/PushPanel'
import { InAppPanel } from './components/inapp/InAppPanel'
import { TemplatesPanel } from './components/templates/TemplatesPanel'

// `protectedGroupRoute` is a pathless layout route registered with `id: 'protected-group'`, so every
// child route's TanStack Router *id* (used by getRouteApi) is prefixed with it even though the id
// contributes no URL segment — the actual URL is still just "/notifications".
const routeApi = getRouteApi('/protected-group/notifications')
const PAGE_SIZE = 20

const TABS: DetailTab[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
  { id: 'bulk', label: 'Bulk Notifications', icon: Send, permission: PERMISSIONS.NOTIFICATIONS.SEND },
  { id: 'delivery', label: 'Delivery Status', icon: CheckCircle2 },
  { id: 'failed', label: 'Failed Deliveries', icon: XCircle },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'push', label: 'Push Notifications', icon: Smartphone },
  { id: 'inapp', label: 'In-App Notifications', icon: MessageSquare },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
]

export function NotificationsPage() {
  const { tab: urlTab } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const [activeTab, setActiveTabPersisted] = usePersistedTab('notifications', 'overview', urlTab)
  const [page, setPage] = useState(0)
  const [sendOpen, setSendOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const canSend = usePermission(PERMISSIONS.NOTIFICATIONS.SEND)

  function handleTabChange(tabId: string) {
    setActiveTabPersisted(tabId)
    setPage(0)
    void navigate({ search: (prev) => ({ ...prev, tab: tabId }), replace: true })
  }

  const { data: stats, isLoading: statsLoading } = useNotificationStats()

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useNotificationList(
    page,
    PAGE_SIZE,
    {},
    activeTab === 'history',
  )
  const { data: bulkData, isLoading: bulkLoading, refetch: refetchBulk } = useNotificationList(
    page,
    PAGE_SIZE,
    { type: 'ANNOUNCEMENT' },
    activeTab === 'bulk',
  )
  const { data: sentData, isLoading: sentLoading, refetch: refetchSent } = useNotificationList(
    page,
    PAGE_SIZE,
    { status: 'SENT' },
    activeTab === 'delivery',
  )
  const { data: failedData, isLoading: failedLoading, refetch: refetchFailed } = useNotificationList(
    page,
    PAGE_SIZE,
    { status: 'FAILED' },
    activeTab === 'failed',
  )
  const { data: timelineData, isLoading: timelineLoading } = useNotificationList(
    0,
    30,
    {},
    activeTab === 'timeline',
  )

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            SMS/Email logs and outbound messaging across the platform — Push, In-App and Templates are
            UI-complete but awaiting backend endpoints
          </p>
        </div>
        {canSend && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Send className="h-4 w-4" />
              Bulk Send
            </button>
            <button
              onClick={() => setSendOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Bell className="h-4 w-4" />
              Send Notification
            </button>
          </div>
        )}
      </div>

      <DetailTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} variant="page">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <NotificationStatCard label="Total Sent" value={stats?.total} icon={Bell} color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400" isLoading={statsLoading} />
            <NotificationStatCard label="Delivered" value={stats?.sent} icon={CheckCircle2} color="bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400" isLoading={statsLoading} />
            <NotificationStatCard label="Failed" value={stats?.failed} icon={XCircle} color="bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-400" isLoading={statsLoading} />
            <NotificationStatCard label="Mocked (dev)" value={stats?.mock} icon={MessageCircle} color="bg-zinc-100 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-400" isLoading={statsLoading} />
            <NotificationStatCard label="OTP" value={stats?.otpCount} icon={Smartphone} color="bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400" isLoading={statsLoading} />
            <NotificationStatCard label="Subscription" value={stats?.subscriptionCount} icon={Mail} color="bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400" isLoading={statsLoading} />
            <NotificationStatCard label="Redemption" value={stats?.redemptionCount} icon={History} color="bg-teal-100 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400" isLoading={statsLoading} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <NotificationLogTable
              data={historyData?.content ?? []}
              isLoading={historyLoading}
              page={page}
              totalPages={historyData?.totalPages ?? 0}
              totalElements={historyData?.totalElements ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onRefresh={() => void refetchHistory()}
            />
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Bulk sends target an explicit recipient list (mobile + ID + type each) — there is no
              "send to all users" capability on the backend.{' '}
              {canSend && (
                <button onClick={() => setBulkOpen(true)} className="font-medium text-primary hover:underline">
                  Start a bulk send →
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <NotificationLogTable
                data={bulkData?.content ?? []}
                isLoading={bulkLoading}
                page={page}
                totalPages={bulkData?.totalPages ?? 0}
                totalElements={bulkData?.totalElements ?? 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                onRefresh={() => void refetchBulk()}
                emptyMessage="No bulk (ANNOUNCEMENT-type) notifications sent yet"
              />
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <NotificationLogTable
              data={sentData?.content ?? []}
              isLoading={sentLoading}
              page={page}
              totalPages={sentData?.totalPages ?? 0}
              totalElements={sentData?.totalElements ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onRefresh={() => void refetchSent()}
              emptyMessage="No successfully delivered notifications"
            />
          </div>
        )}

        {activeTab === 'failed' && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <NotificationLogTable
              data={failedData?.content ?? []}
              isLoading={failedLoading}
              page={page}
              totalPages={failedData?.totalPages ?? 0}
              totalElements={failedData?.totalElements ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onRefresh={() => void refetchFailed()}
              emptyMessage="No failed deliveries"
              showError
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <DetailTabs.Panel
            status={timelineLoading ? 'loading' : (timelineData?.content.length ?? 0) === 0 ? 'empty' : 'ready'}
            emptyTitle="No activity yet"
            emptyDescription="Sent notifications will appear here chronologically."
          >
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Timeline
                entries={(timelineData?.content ?? []).map((n) => ({
                  id: n.id,
                  title: `${n.type} → ${n.recipientType}${n.recipientId != null ? ` #${n.recipientId}` : ''}`,
                  description: n.message,
                  timestamp: n.createdAt,
                  icon: n.status === 'FAILED' ? XCircle : Bell,
                  tone: n.status === 'FAILED' ? 'error' : n.status === 'SENT' ? 'success' : 'default',
                }))}
              />
            </div>
          </DetailTabs.Panel>
        )}

        {activeTab === 'push' && <PushPanel />}

        {activeTab === 'inapp' && <InAppPanel />}

        {activeTab === 'templates' && <TemplatesPanel />}
      </DetailTabs>

      <SendNotificationModal open={sendOpen} onClose={() => setSendOpen(false)} />
      <SendBulkNotificationModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  )
}
