import { useState, useCallback } from 'react'
import { Key, ShieldCheck, ShieldOff, Trash2, Plus, RefreshCw, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'
import { useApiKeyList, useApiKeyStats, useRevokeApiKey, useDeleteApiKey } from './hooks/useApiKeys'
import { CreateApiKeyModal } from './components/CreateApiKeyModal'
import { PaymentGatewaySection } from '@/features/payment-gateway/components/PaymentGatewaySection'
import type { ApiKeyResponse, ApiKeyStatus } from './types/api-key.types'

const PAGE_SIZE = 20

function statusStyle(s: ApiKeyStatus) {
  if (s === 'ACTIVE') return 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
  if (s === 'REVOKED') return 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400'
  return 'bg-muted text-muted-foreground'
}

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

export function ApiKeysPage() {
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const { data, isLoading, refetch } = useApiKeyList(page, PAGE_SIZE)
  const { data: stats, isLoading: statsLoading } = useApiKeyStats()
  const { mutate: revoke, isPending: revoking } = useRevokeApiKey()
  const { mutate: deleteKey, isPending: deleting } = useDeleteApiKey()

  const openCreate = useCallback(() => setCreateOpen(true), [])
  const closeCreate = useCallback(() => setCreateOpen(false), [])

  const keys = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">API Keys</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Payment gateway credentials and programmatic access to the platform</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New API Key
        </button>
      </div>

      <PaymentGatewaySection />

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={stats?.totalKeys} color="bg-blue-500" isLoading={statsLoading} />
        <StatCard label="Active" value={stats?.activeKeys} color="bg-green-500" isLoading={statsLoading} />
        <StatCard label="Revoked" value={stats?.revokedKeys} color="bg-red-500" isLoading={statsLoading} />
        <StatCard label="Expired" value={stats?.expiredKeys} color="bg-muted-foreground" isLoading={statsLoading} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Platform API Keys</p>
          <button onClick={() => void refetch()} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          ) : keys.length === 0 ? (
            <div className="py-16 text-center">
              <Key className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No API keys yet</p>
            </div>
          ) : (
            keys.map((key) => (
              <ApiKeyRow
                key={key.id}
                apiKey={key}
                onRevoke={() => revoke(key.id)}
                onDelete={() => setDeleteConfirm(key.id)}
                isRevoking={revoking}
              />
            ))
          )}
        </div>
        {totalElements > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{totalElements} total</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40">
                Previous
              </button>
              <span className="text-xs text-muted-foreground">{page + 1} / {Math.max(1, totalPages)}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateApiKeyModal open={createOpen} onClose={closeCreate} />

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground">Delete API Key?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Any integrations using this key will immediately stop working.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                className="flex-1 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 disabled:opacity-60">
                Cancel
              </button>
              <button onClick={() => deleteKey(deleteConfirm, { onSuccess: () => setDeleteConfirm(null) })} disabled={deleting}
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

function ApiKeyRow({ apiKey, onRevoke, onDelete, isRevoking }: {
  apiKey: ApiKeyResponse
  onRevoke: () => void
  onDelete: () => void
  isRevoking: boolean
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Key className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{apiKey.name}</p>
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusStyle(apiKey.status))}>
            {apiKey.status}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{apiKey.keyPrefix}…</span>
          <span>Created {formatDateTime(apiKey.createdAt)}</span>
          {apiKey.lastUsedAt && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Last used {formatDateTime(apiKey.lastUsedAt)}</span>}
          {apiKey.expiresAt && <span>Expires {formatDateTime(apiKey.expiresAt)}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {apiKey.status === 'ACTIVE' && (
          <button onClick={onRevoke} disabled={isRevoking}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60">
            <ShieldOff className="h-3.5 w-3.5" />
            Revoke
          </button>
        )}
        {apiKey.status === 'REVOKED' && (
          <div className="flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs text-muted-foreground dark:border-green-400/20">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            Revoked
          </div>
        )}
        <button onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
