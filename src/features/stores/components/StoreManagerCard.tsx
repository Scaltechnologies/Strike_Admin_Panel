import { useState } from 'react'
import { User, Phone, Edit2, Save, X } from 'lucide-react'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { useUpdateStoreManager } from '../hooks/useStores'
import type { StoreRecord } from '../types/store.types'

interface StoreManagerCardProps {
  store: StoreRecord
}

export function StoreManagerCard({ store }: StoreManagerCardProps) {
  const canEdit = usePermission(PERMISSIONS.STORES.EDIT)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(store.managerName ?? '')
  const [phoneInput, setPhoneInput] = useState(store.managerPhone ?? '')

  const { mutate: updateManager, isPending } = useUpdateStoreManager()

  function handleSave() {
    updateManager(
      {
        storeId: store.id,
        managerName: nameInput || undefined,
        managerPhone: phoneInput || undefined,
      },
      {
        onSuccess: () => setEditing(false),
      },
    )
  }

  function handleCancel() {
    setNameInput(store.managerName ?? '')
    setPhoneInput(store.managerPhone ?? '')
    setEditing(false)
  }

  const hasManager = store.managerName || store.managerPhone

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-400/10">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Branch Manager</p>
            <p className="text-xs text-muted-foreground">Assigned contact for this store</p>
          </div>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Edit2 className="h-3 w-3" aria-hidden />
            Edit
          </button>
        )}
      </div>

      {/* View mode */}
      {!editing && (
        <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20 px-4">
          {hasManager ? (
            <>
              {store.managerName && (
                <Row icon={User} label="Name" value={store.managerName} />
              )}
              {store.managerPhone && (
                <Row icon={Phone} label="Phone" value={<span className="font-mono">{store.managerPhone}</span>} />
              )}
            </>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No manager assigned to this store.
            </div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Manager Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. John Doe"
              disabled={isPending}
              className={cn(
                'block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:opacity-60',
              )}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Manager Phone
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              disabled={isPending}
              className={cn(
                'block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:opacity-60',
              )}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className={cn(
                'flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground',
                'transition-colors hover:bg-primary/90',
                'disabled:opacity-60',
              )}
            >
              <Save className="h-3 w-3" aria-hidden />
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              <X className="h-3 w-3" aria-hidden />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">
          Manager details are for internal reference only. The vendor owns this store and manages
          their own operations independently.
        </p>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}
