import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Copy, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateApiKey } from '../hooks/useApiKeys'
import type { CreateApiKeyRequest, CreateApiKeyResponse } from '../types/api-key.types'

interface CreateApiKeyModalProps {
  open: boolean
  onClose: () => void
}

const inputCls = 'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

function CreatedKeyView({ result, onClose }: { result: CreateApiKeyResponse; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    void navigator.clipboard.writeText(result.rawKey).then(() => {
      setCopied(true)
      toast.success('API key copied to clipboard.')
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Copy this key now — it will never be shown again.</p>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400/80">Store it securely. If lost, you must generate a new key.</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">API Key</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2.5 font-mono text-xs text-foreground break-all">
            {result.rawKey}
          </code>
          <button onClick={copy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p><span className="font-medium text-foreground">Name:</span> {result.name}</p>
        <p><span className="font-medium text-foreground">Prefix:</span> <span className="font-mono">{result.keyPrefix}…</span></p>
        {result.expiresAt && <p><span className="font-medium text-foreground">Expires:</span> {result.expiresAt}</p>}
      </div>

      <button onClick={onClose}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Done
      </button>
    </div>
  )
}

export function CreateApiKeyModal({ open, onClose }: CreateApiKeyModalProps) {
  const [form, setForm] = useState<CreateApiKeyRequest>({ name: '', permissions: [], expiresAt: '' })
  const [created, setCreated] = useState<CreateApiKeyResponse | null>(null)
  const { mutate: create, isPending } = useCreateApiKey()

  function handleClose() {
    setForm({ name: '', permissions: [], expiresAt: '' })
    setCreated(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, expiresAt: form.expiresAt || undefined }
    create(payload, { onSuccess: (data) => setCreated(data) })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={!created ? handleClose : undefined} aria-hidden />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  {created ? 'API Key Created' : 'Create API Key'}
                </h2>
                {!created && (
                  <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {created ? (
                <CreatedKeyView result={created} onClose={handleClose} />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Key Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      className={inputCls}
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Mobile App Production"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Expires At (optional)</label>
                    <input
                      type="datetime-local"
                      className={inputCls}
                      value={form.expiresAt ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={handleClose} disabled={isPending}
                      className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted/80 disabled:opacity-60">
                      Cancel
                    </button>
                    <button type="submit" disabled={isPending || !form.name.trim()}
                      className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                      {isPending ? 'Creating…' : 'Create Key'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
