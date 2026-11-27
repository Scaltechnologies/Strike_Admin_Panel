import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Check, Info, Loader2, Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { avatarGradient, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { useApprovalSettings, useSaveApprovalSettings, type ApprovalMode } from '../api/menu-admin.api'
import { MODE_META } from '../utils/menu-meta'

const MODES: ApprovalMode[] = ['ALL', 'MANAGERS', 'OFF']

/** The switch: who needs approval for menu changes, and which vendors are trusted to skip it. */
export function ApprovalSettingsPanel() {
  const settings = useApprovalSettings()
  const save = useSaveApprovalSettings()
  const [search, setSearch] = useState('')
  const vendors = useVendors(0, 50, { q: search.trim(), status: '', kycStatus: '' })
  // Unsaved edits sit on top of what's saved; null = not touched.
  const [draftMode, setMode] = useState<ApprovalMode | null>(null)
  const [draftTrusted, setDraftTrusted] = useState<{ vendorId: number; name: string | null }[] | null>(null)
  const mode = draftMode ?? settings.data?.mode ?? 'ALL'
  const trusted = useMemo(() => draftTrusted ?? settings.data?.trustedVendors ?? [], [draftTrusted, settings.data])
  const setTrusted = (fn: (l: { vendorId: number; name: string | null }[]) => { vendorId: number; name: string | null }[]) => setDraftTrusted(fn(trusted))
  const reset = () => { setMode(null); setDraftTrusted(null) }

  const dirty = !!settings.data && (mode !== settings.data.mode
    || trusted.map((t) => t.vendorId).sort().join() !== [...settings.data.trustedVendorIds].sort().join())
  const trustedIds = useMemo(() => new Set(trusted.map((t) => t.vendorId)), [trusted])
  const suggestions = (vendors.data?.content ?? []).filter((v) => !trustedIds.has(v.vendorId)).slice(0, 6)

  if (settings.isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <Panel title="Who needs approval?" subtitle="Applies the moment you save — to every store" icon={<BadgeCheck className="h-4 w-4" />} className="xl:col-span-3">
        <div role="radiogroup" aria-label="Approval mode" className="flex flex-col gap-3">
          {MODES.map((m) => {
            const meta = MODE_META[m]
            const on = mode === m
            return (
              <motion.button key={m} type="button" role="radio" aria-checked={on} onClick={() => setMode(m)} whileTap={{ scale: 0.99 }}
                className={cn('relative flex items-start gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-colors',
                  on ? 'border-transparent' : 'border-border hover:bg-muted/40')}>
                {on && <motion.span layoutId="mode-ring" className="absolute inset-0 rounded-2xl ring-2 ring-primary" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                <span className={cn('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', meta.tone)}>
                  <meta.icon className="h-5 w-5" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{meta.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{meta.description}</span>
                </span>
                <span className={cn('relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30')}>
                  {on && <Check className="h-3 w-3" />}
                </span>
              </motion.button>
            )
          })}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Marking items in or out of stock never needs approval, so stores can keep running. Changes made here by admins always go live at once.
        </p>
      </Panel>

      <Panel title="Trusted vendors" subtitle="Their changes skip approval, whatever the setting" icon={<BadgeCheck className="h-4 w-4" />} className="xl:col-span-2">
        <div className="flex flex-col gap-3">
          {trusted.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-5 text-center text-xs text-muted-foreground">No trusted vendors</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {trusted.map((t) => (
                <motion.li key={t.vendorId} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2 text-xs shadow-sm">
                  <span className={cn('flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white', avatarGradient(t.vendorId))}>{vendorInitials(t.name)}</span>
                  <span className="font-medium text-foreground">{t.name ?? `Vendor #${t.vendorId}`}</span>
                  <button type="button" aria-label={`Remove ${t.name ?? t.vendorId}`} onClick={() => setTrusted((l) => l.filter((x) => x.vendorId !== t.vendorId))}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-3 w-3" /></button>
                </motion.li>
              ))}
            </ul>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a vendor to trust…" aria-label="Find a vendor"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <ul className="flex flex-col gap-1">
            {suggestions.map((v) => (
              <li key={v.vendorId}>
                <button type="button" onClick={() => setTrusted((l) => [...l, { vendorId: v.vendorId, name: v.hotelName }])}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted">
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white', avatarGradient(v.vendorId))}>{vendorInitials(v.hotelName)}</span>
                  <span className="min-w-0 flex-1 truncate">{v.hotelName}</span>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <motion.div initial={false} animate={{ opacity: dirty ? 1 : 0.6 }}
        className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur xl:col-span-5">
        <p className="text-sm text-muted-foreground">{dirty ? 'You have unsaved changes.' : `Approval is ${MODE_META[settings.data?.mode ?? 'ALL'].short.toLowerCase()}.`}</p>
        <div className="flex gap-2">
          {dirty && (
            <button type="button" onClick={reset}
              className="h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted">Undo</button>
          )}
          <button type="button" disabled={!dirty || save.isPending} onClick={() => save.mutate({ mode, trustedVendorIds: trusted.map((t) => t.vendorId) }, { onSuccess: reset })}
            className="btn-shine flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 px-4 text-sm font-semibold text-white shadow-md shadow-orange-500/25 disabled:opacity-50">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </motion.div>
    </div>
  )
}
