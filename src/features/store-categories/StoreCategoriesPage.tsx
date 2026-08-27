import { useState, useCallback } from 'react'
import { Tag, Pencil, Trash2, Plus, LayoutGrid } from 'lucide-react'
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation'
import { formatDateTime } from '@/utils/helpers/date'
import { useStoreCategoryList, useDeleteStoreCategory } from './hooks/useStoreCategories'
import { StoreCategoryForm } from './components/StoreCategoryForm'
import type { StoreCategoryResponse } from './types/store-category.types'

export function StoreCategoriesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StoreCategoryResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StoreCategoryResponse | null>(null)
  const [createNonce, setCreateNonce] = useState(0)

  const { data, isLoading } = useStoreCategoryList()
  const { mutate: deleteCategory, isPending: deleting } = useDeleteStoreCategory()

  const openCreate = useCallback(() => { setEditing(null); setCreateNonce((n) => n + 1); setFormOpen(true) }, [])
  const openEdit = useCallback((c: StoreCategoryResponse) => { setEditing(c); setFormOpen(true) }, [])
  const closeForm = useCallback(() => setFormOpen(false), [])

  const categories = data ?? []

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Store Categories</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The list vendors pick from when setting their store&apos;s category
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">All Categories</p>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="py-16 text-center">
              <LayoutGrid className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No categories yet</p>
              <button onClick={openCreate} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Create your first category
              </button>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Order {category.displayOrder ?? 0} · Added {formatDateTime(category.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(category)}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(category)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <StoreCategoryForm
        key={editing ? `edit-${editing.id}` : `create-${createNonce}`}
        open={formOpen}
        onClose={closeForm}
        editing={editing}
      />

      <DeleteConfirmation
        open={deleteTarget !== null}
        itemName={deleteTarget?.name}
        isLoading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteCategory(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }}
      />
    </div>
  )
}
