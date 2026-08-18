import { useState, useCallback } from 'react'
import { Image, ToggleLeft, ToggleRight, Pencil, Trash2, Plus, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/helpers/date'
import { useBannerList, useBannerStats, useToggleBanner, useDeleteBanner } from './hooks/useBanners'
import { BannerForm } from './components/BannerForm'
import type { BannerResponse } from './types/banner.types'

const PAGE_SIZE = 20

function StatCard({ label, value, color, isLoading }: { label: string; value: number | undefined; color: string; isLoading: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-5 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-xl font-bold text-foreground">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}

export function BannersPage() {
  const [page] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BannerResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const { data, isLoading } = useBannerList(page, PAGE_SIZE)
  const { data: stats, isLoading: statsLoading } = useBannerStats()
  const { mutate: toggle, isPending: toggling } = useToggleBanner()
  const { mutate: deleteBanner, isPending: deleting } = useDeleteBanner()

  const openCreate = useCallback(() => { setEditing(null); setFormOpen(true) }, [])
  const openEdit = useCallback((b: BannerResponse) => { setEditing(b); setFormOpen(true) }, [])
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(null) }, [])

  const banners = data?.content ?? []

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Banners</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage promotional banners shown in the app</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Banner
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats?.total} color="bg-blue-500" isLoading={statsLoading} />
        <StatCard label="Active" value={stats?.active} color="bg-green-500" isLoading={statsLoading} />
        <StatCard label="Inactive" value={stats?.inactive} color="bg-muted-foreground" isLoading={statsLoading} />
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
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <ImageOff className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No banners yet</p>
          <button onClick={openCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Create your first banner
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={openEdit}
              onToggle={(b) => toggle({ id: b.id, active: b.isActive })}
              onDelete={(b) => setDeleteConfirm(b.id)}
              isToggling={toggling}
            />
          ))}
        </div>
      )}

      <BannerForm open={formOpen} onClose={closeForm} editing={editing} />

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground">Delete Banner?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                className="flex-1 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 disabled:opacity-60">
                Cancel
              </button>
              <button
                onClick={() => deleteBanner(deleteConfirm, { onSuccess: () => setDeleteConfirm(null) })}
                disabled={deleting}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BannerCard({ banner, onEdit, onToggle, onDelete, isToggling }: {
  banner: BannerResponse
  onEdit: (b: BannerResponse) => void
  onToggle: (b: BannerResponse) => void
  onDelete: (b: BannerResponse) => void
  isToggling: boolean
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative h-36 bg-muted">
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className={cn(
          'absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium',
          banner.isActive
            ? 'bg-green-500 text-white'
            : 'bg-muted text-muted-foreground',
        )}>
          {banner.isActive ? 'Active' : 'Inactive'}
        </div>
        {banner.displayOrder > 0 && (
          <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            #{banner.displayOrder}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-medium text-foreground">{banner.title}</p>
        {banner.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{banner.description}</p>}
        {(banner.validFrom || banner.validUntil) && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {banner.validFrom && formatDate(banner.validFrom)}
            {banner.validFrom && banner.validUntil && ' – '}
            {banner.validUntil && formatDate(banner.validUntil)}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => onToggle(banner)} disabled={isToggling}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60">
            {banner.isActive ? <ToggleRight className="h-3.5 w-3.5 text-green-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
            {banner.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => onEdit(banner)}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button onClick={() => onDelete(banner)}
            className="ml-auto flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
