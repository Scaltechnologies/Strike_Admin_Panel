import { useState } from 'react'
import { Plus } from 'lucide-react'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation'
import { useTemplateList, useDeleteTemplate, useToggleTemplate } from '../../hooks/useTemplates'
import { PendingBackendNotice } from '../PendingBackendNotice'
import { TemplateTable } from './TemplateTable'
import { TemplateFormModal } from './TemplateFormModal'
import type { NotificationTemplate } from '../../types/notification.types'

const PAGE_SIZE = 20

export function TemplatesPanel() {
  const canEdit = usePermission(PERMISSIONS.NOTIFICATIONS.SEND)
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NotificationTemplate | undefined>(undefined)
  const [deleting, setDeleting] = useState<NotificationTemplate | undefined>(undefined)

  const { data, isLoading, refetch } = useTemplateList(page, PAGE_SIZE)
  const { mutate: deleteTemplate, isPending: deletingPending } = useDeleteTemplate()
  const { mutate: toggleTemplate, isPending: togglingPending, variables: togglingVars } = useToggleTemplate()

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(template: NotificationTemplate) {
    setEditing(template)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <PendingBackendNotice reason="no template entity or controller exists in notification-service yet — messages are freeform text passed at send time." />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Reusable message bodies for system-triggered and admin-composed sends across all channels.
        </p>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <TemplateTable
          data={data?.content ?? []}
          isLoading={isLoading}
          page={page}
          totalPages={data?.totalPages ?? 0}
          totalElements={data?.totalElements ?? 0}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onRefresh={() => void refetch()}
          onEdit={openEdit}
          onDelete={setDeleting}
          onToggle={(template) => toggleTemplate(template.id)}
          togglingId={togglingPending ? togglingVars : undefined}
        />
      </div>

      <TemplateFormModal open={formOpen} onClose={() => setFormOpen(false)} template={editing} />

      <DeleteConfirmation
        open={!!deleting}
        itemName={deleting?.name}
        isLoading={deletingPending}
        onCancel={() => setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return
          deleteTemplate(deleting.id, { onSuccess: () => setDeleting(undefined) })
        }}
      />
    </div>
  )
}
