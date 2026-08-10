import { useState } from 'react'
import { Smartphone, CheckCircle2, XCircle, Tablet, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { useNotificationList } from '../../hooks/useNotifications'
import { usePushDeviceList, usePushDeviceStats, useRevokePushDevice } from '../../hooks/usePushNotifications'
import { NotificationLogTable } from '../NotificationLogTable'
import { NotificationStatCard } from '../NotificationStatCard'
import { PendingBackendNotice } from '../PendingBackendNotice'
import { PushDeviceTable } from './PushDeviceTable'
import { SendPushModal } from './SendPushModal'
import type { PushDevice } from '../../types/notification.types'

const PAGE_SIZE = 20

export function PushPanel() {
  const canSend = usePermission(PERMISSIONS.NOTIFICATIONS.SEND)
  const [subView, setSubView] = useState<'devices' | 'log'>('devices')
  const [devicePage, setDevicePage] = useState(0)
  const [logPage, setLogPage] = useState(0)
  const [sendOpen, setSendOpen] = useState(false)

  const { data: deviceStats, isLoading: statsLoading } = usePushDeviceStats()
  const { data: devices, isLoading: devicesLoading, refetch: refetchDevices } = usePushDeviceList(
    devicePage,
    PAGE_SIZE,
    {},
    subView === 'devices',
  )
  const { data: pushLog, isLoading: logLoading, refetch: refetchLog } = useNotificationList(
    logPage,
    PAGE_SIZE,
    { channel: 'PUSH' },
    subView === 'log',
  )
  const { mutate: revokeDevice, isPending: revoking, variables: revokingVars } = useRevokePushDevice()
  const revokingId = revoking ? revokingVars : undefined

  return (
    <div className="flex flex-col gap-4">
      <PendingBackendNotice reason="notification-service has no push channel (FCM/APNs) or device registry yet." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NotificationStatCard
            label="Registered Devices"
            value={deviceStats?.total}
            icon={Smartphone}
            color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
            isLoading={statsLoading}
          />
          <NotificationStatCard
            label="Active"
            value={deviceStats?.active}
            icon={CheckCircle2}
            color="bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400"
            isLoading={statsLoading}
          />
          <NotificationStatCard
            label="Inactive"
            value={deviceStats?.inactive}
            icon={XCircle}
            color="bg-zinc-100 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-400"
            isLoading={statsLoading}
          />
        </div>
        {canSend && (
          <button
            onClick={() => setSendOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Smartphone className="h-4 w-4" />
            Send Push
          </button>
        )}
      </div>

      <div className="flex w-fit gap-1 rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setSubView('devices')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            subView === 'devices'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Tablet className="h-3.5 w-3.5" />
          Registered Devices
        </button>
        <button
          onClick={() => setSubView('log')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            subView === 'log'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <List className="h-3.5 w-3.5" />
          Delivery Log
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {subView === 'devices' ? (
          <PushDeviceTable
            data={devices?.content ?? []}
            isLoading={devicesLoading}
            page={devicePage}
            totalPages={devices?.totalPages ?? 0}
            totalElements={devices?.totalElements ?? 0}
            pageSize={PAGE_SIZE}
            onPageChange={setDevicePage}
            onRefresh={() => void refetchDevices()}
            onRevoke={(device: PushDevice) => revokeDevice(device.id)}
            revokingId={revokingId}
          />
        ) : (
          <NotificationLogTable
            data={pushLog?.content ?? []}
            isLoading={logLoading}
            page={logPage}
            totalPages={pushLog?.totalPages ?? 0}
            totalElements={pushLog?.totalElements ?? 0}
            pageSize={PAGE_SIZE}
            onPageChange={setLogPage}
            onRefresh={() => void refetchLog()}
            emptyMessage="No push notifications sent yet"
          />
        )}
      </div>

      <SendPushModal open={sendOpen} onClose={() => setSendOpen(false)} />
    </div>
  )
}
