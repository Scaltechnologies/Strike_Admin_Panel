import { useState, useCallback } from 'react'
import { Image, ToggleLeft, ToggleRight, Pencil, Trash2, Plus, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveImageUrl } from '@/utils/helpers/media-url'
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation'
import { useCategoryList, useUpdateCategoryStatus, useDeleteCategory } from './hooks/useCategories'
import { CategoryForm } from './components/CategoryForm'
import type { CategoryResponse } from './types/category.types'

export function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null)
  const [createNonce, setCreateNonce] = useState(0)

  const { data, isLoading } = useCategoryList()
  const { mutate: toggleStatus, isPending: toggling } = useUpdateCategoryStatus()
  const { mutate: deleteCategory, isPending: deleting } = useDeleteCategory()

  const openCreate = useCallback(() => { setEditing(null); setCreateNonce((n) => n + 1); setFormOpen(true) }, [])
  const openEdit = useCallback((c: CategoryResponse) => { setEditing(c); setFormOpen(true) }, [])
  const closeForm = useCallback(() => setFormOpen(false), [])

  const categories = data ?? []

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categories</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Global master menu categories — power menu organization and card eligibility platform-wide
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
              <div className="h-36 rounded-t-xl bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No categories yet</p>
          <button onClick={openCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Create your first category
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={openEdit}
              onToggle={(c) => toggleStatus({ id: c.id, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
              onDelete={(c) => setDeleteTarget(c)}
              isToggling={toggling}
            />
          ))}
        </div>
      )}

      <CategoryForm
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

function CategoryCard({ category, onEdit, onToggle, onDelete, isToggling }: {
  category: CategoryResponse
  onEdit: (c: CategoryResponse) => void
  onToggle: (c: CategoryResponse) => void
  onDelete: (c: CategoryResponse) => void
  isToggling: boolean
}) {
  const isActive = category.status === 'ACTIVE'
  const imageUrl = resolveImageUrl(category.imageUrl)
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative h-36 bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={category.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className={cn(
          'absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium',
          isActive ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground',
        )}>
          {isActive ? 'Active' : 'Inactive'}
        </div>
        {category.displayOrder != null && (
          <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            #{category.displayOrder}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-medium text-foreground">{category.name}</p>
        {category.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>}
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => onToggle(category)} disabled={isToggling}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60">
            {isActive ? <ToggleRight className="h-3.5 w-3.5 text-green-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => onEdit(category)}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button onClick={() => onDelete(category)}
            className="ml-auto flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
