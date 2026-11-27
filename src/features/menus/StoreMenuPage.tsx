import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, CreditCard, FileSpreadsheet, Hourglass, Leaf, Drumstick, MapPin, PackageX, Pencil, Plus, Search,
  ShieldCheck, Trash2, UserCog, UtensilsCrossed, X,
} from 'lucide-react'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { MenuUploadDialog } from '@/features/onboarding/components/MenuUploadDialog'
import { CardFormDialog } from '@/features/onboarding/components/CardFormDialog'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ErrorState } from '@/components/common/ErrorState'
import { TabError } from '@/components/common/TabError'
import { hasPermission } from '@/core/auth/auth'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/helpers/date'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { avatarGradient, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import {
  useApprovalSettings, useCreateItem, useDeleteItem, useMenuStore, useSaveApprovalSettings, useUpdateItem, type ItemFields,
} from './api/menu-admin.api'
import { ApprovalsPanel } from './components/ApprovalsPanel'
import { VegMark } from './components/ChangeCard'
import { ItemFormDialog } from './components/ItemFormDialog'
import { useCategoryOptions } from './hooks/useCategoryOptions'
import { useStoreItems, useStoreMenu } from './hooks/useMenus'
import type { MenuItemResponse } from './types/menu.types'
import { formatPrice, usableImage } from './utils/menu-meta'

type VegFilter = 'all' | 'veg' | 'nonveg'
type StockFilter = 'all' | 'in' | 'out'

export function StoreMenuPage({ storeId, openUpload, openCard }: { storeId: number; openUpload?: boolean; openCard?: boolean }) {
  const summary = useMenuStore(storeId)
  const items = useStoreItems(storeId)
  const cats = useStoreMenu(storeId)
  const settings = useApprovalSettings()
  const saveSettings = useSaveApprovalSettings()
  const createItem = useCreateItem(storeId)
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()

  const [search, setSearch] = useState('')
  const [veg, setVeg] = useState<VegFilter>('all')
  const [stock, setStock] = useState<StockFilter>('all')
  const [editing, setEditing] = useState<MenuItemResponse | 'new' | null>(null)
  const [removing, setRemoving] = useState<MenuItemResponse | null>(null)
  const [uploading, setUploading] = useState(!!openUpload)
  const [carding, setCarding] = useState(!!openCard)
  const cardCategories = useMemo(() => (cats.data ?? []).filter((c) => (c.items?.length ?? 0) > 0).map((c) => ({ id: c.id, name: c.name })), [cats.data])

  const storeCategoryNames = useMemo(() => Object.fromEntries((cats.data ?? []).map((c) => [String(c.id), c.name])), [cats.data])
  const { options, names } = useCategoryOptions(storeCategoryNames)
  const s = summary.data

  const all = useMemo(() => items.data ?? [], [items.data])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((i) =>
      (!q || i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q))
      && (veg === 'all' || (veg === 'veg' ? i.itemType !== 'NON_VEG' : i.itemType === 'NON_VEG'))
      && (stock === 'all' || (stock === 'out' ? i.availabilityStatus === 'OUT_OF_STOCK' : i.availabilityStatus !== 'OUT_OF_STOCK')))
  }, [all, search, veg, stock])
  const sections = useMemo(() => {
    const order = new Map((cats.data ?? []).map((c, i) => [c.id, c.displayOrder ?? i]))
    const groups = new Map<number, MenuItemResponse[]>()
    for (const i of filtered) {
      const k = i.categoryId ?? -1
      groups.set(k, [...(groups.get(k) ?? []), i])
    }
    return [...groups.entries()]
      .map(([id, list]) => ({ id, name: id < 0 ? 'No category' : names[String(id)] ?? `Category #${id}`, items: list.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999) || a.name.localeCompare(b.name))
  }, [filtered, cats.data, names])

  const trusted = !!s?.vendorId && !!settings.data?.trustedVendorIds.includes(s.vendorId)
  const toggleTrusted = () => {
    if (!s?.vendorId || !settings.data) return
    const ids = settings.data.trustedVendorIds
    saveSettings.mutate({ trustedVendorIds: trusted ? ids.filter((x) => x !== s.vendorId) : [...ids, s.vendorId] })
  }
  const vegPct = s && s.items > 0 ? Math.round((s.veg / s.items) * 100) : 0
  const mode = settings.data?.mode
  const filtering = !!search || veg !== 'all' || stock !== 'all'

  if (summary.isError) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <BackLink />
        <ErrorState title="Couldn't open this menu" description="The store may not exist, or the connection failed." onRetry={() => void summary.refetch()} />
      </div>
    )
  }

  const saveItem = (fields: ItemFields) => {
    if (editing === 'new') createItem.mutate(fields, { onSuccess: () => setEditing(null) })
    else if (editing) updateItem.mutate({ itemId: editing.id, body: fields }, { onSuccess: () => setEditing(null) })
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <BackLink />

      {!s ? <Skeleton className="h-52 w-full rounded-3xl" /> : (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
          <div className="auth-aurora pointer-events-none absolute inset-0 opacity-60" aria-hidden><span /><span /><span /></div>
          <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <span className={cn('flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-xl font-bold shadow-lg ring-2 ring-white/20', avatarGradient(storeId + 3))}>
                  {usableImage(s.logoUrl) ? <img src={usableImage(s.logoUrl)!} alt="" className="h-full w-full object-cover" /> : vendorInitials(s.name)}
                </span>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight">{s.name ?? `Store #${storeId}`}</h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/65">
                    {s.vendorId != null && (hasPermission('SEC_VENDORS') ? (
                      <Link to="/vendors/$vendorId" params={{ vendorId: String(s.vendorId) }} search={{ tab: undefined }} className="flex items-center gap-1 font-medium text-white hover:underline">
                        {s.vendorName ?? `Vendor #${s.vendorId}`} <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                      </Link>
                    ) : <span>{s.vendorName}</span>)}
                    {s.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.address}</span>}
                    {s.managerName && <span className="flex items-center gap-1"><UserCog className="h-3.5 w-3.5" />Manager: {s.managerName}</span>}
                    {s.lastUpdatedAt && <span>Menu updated {formatRelative(s.lastUpdatedAt)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mode && mode !== 'OFF' && (
                  <button type="button" onClick={toggleTrusted} disabled={saveSettings.isPending || !s.vendorId}
                    title={trusted ? 'Their changes go live without approval. Click to require approval again.' : 'Let this vendor change their menu without approval'}
                    className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                      trusted ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25' : 'border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/[0.12]')}>
                    {trusted ? <BadgeCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    {trusted ? 'Trusted — skips approval' : 'Trust this store'}
                  </button>
                )}
                <button type="button" onClick={() => setEditing('new')}
                  className="btn-shine flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e01a00] to-orange-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-orange-600/30">
                  <Plus className="h-4 w-4" /> Add item
                </button>
                <button type="button" onClick={() => setUploading(true)}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/[0.15]">
                  <FileSpreadsheet className="h-4 w-4" /> Upload menu
                </button>
                {hasPermission('SEC_CARDS') && (
                  <button type="button" onClick={() => setCarding(true)}
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/[0.15]">
                    <CreditCard className="h-4 w-4" /> Create card
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Fact label="Items" value={String(s.items)} />
              <Fact label="Categories" value={String(s.categories)} />
              <Fact label="Veg" value={s.items ? `${vegPct}%` : '—'} />
              <Fact label="Out of stock" value={String(s.outOfStock)} warn={s.outOfStock > 0} />
              <Fact label="Price range" value={s.items ? `${formatPrice(s.minPrice).replace('.00', '')} – ${formatPrice(s.maxPrice).replace('.00', '')}` : '—'} />
              <Fact label="Waiting for approval" value={String(s.pendingChanges)} warn={s.pendingChanges > 0} />
            </div>
          </div>
        </motion.section>
      )}

      {s && s.pendingChanges > 0 && (
        <Panel title="Waiting for your approval" subtitle="Changes this store asked for" icon={<Hourglass className="h-4 w-4" />}>
          <ErrorBoundary fallback={<TabError />}><ApprovalsPanel status="PENDING" storeId={storeId} compact /></ErrorBoundary>
        </Panel>
      )}

      <div className="sticky top-0 z-20 flex flex-col gap-3 rounded-2xl border border-border bg-card/90 p-3 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this menu…" aria-label="Search this menu"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
          <Segmented value={veg} onChange={setVeg} id="veg" options={[['all', 'All'], ['veg', 'Veg'], ['nonveg', 'Non-veg']]} />
          <Segmented value={stock} onChange={setStock} id="stock" options={[['all', 'Any stock'], ['in', 'In stock'], ['out', 'Out of stock']]} />
        </div>
        {sections.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto">
            {sections.map((sec) => (
              <button key={sec.id} type="button" onClick={() => document.getElementById(`menu-cat-${sec.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
                {sec.name} <span className="tabular-nums opacity-60">{sec.items.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {items.isError ? (
        <ErrorState title="Couldn't load the menu" description="Check the connection and try again." onRetry={() => void items.refetch()} />
      ) : items.isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <UtensilsCrossed className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">{filtering ? 'No items match' : 'This store has no menu yet'}</p>
          {!filtering && <button type="button" onClick={() => setEditing('new')} className="mt-3 text-sm font-medium text-primary hover:underline">Add the first item</button>}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((sec, si) => (
            <section key={sec.id} id={`menu-cat-${sec.id}`} className="scroll-mt-36">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="h-4 w-1 rounded-full bg-gradient-to-b from-orange-400 to-[#e01a00]" />
                {sec.name} <span className="text-xs font-normal text-muted-foreground">{sec.items.length} item{sec.items.length === 1 ? '' : 's'}</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {sec.items.map((item, i) => (
                    <MenuItemCard key={item.id} item={item} delay={Math.min(si * 3 + i, 18) * 0.03}
                      onEdit={() => setEditing(item)} onRemove={() => setRemoving(item)}
                      onToggleStock={() => updateItem.mutate({ itemId: item.id, body: { availabilityStatus: item.availabilityStatus === 'OUT_OF_STOCK' ? 'AVAILABLE' : 'OUT_OF_STOCK' } })} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}

      <ItemFormDialog open={editing != null} onOpenChange={(o) => { if (!o) setEditing(null) }}
        title={editing === 'new' ? 'Add a menu item' : `Edit ${editing?.name ?? 'item'}`}
        description="Saved changes go live on the store's menu at once — no approval needed for admins."
        initial={editing && editing !== 'new' ? editing : { availabilityStatus: 'AVAILABLE', itemType: 'VEG' }}
        categories={options} submitLabel={editing === 'new' ? 'Add item' : 'Save'} submitting={createItem.isPending || updateItem.isPending}
        onSubmit={saveItem} />

      <MenuUploadDialog open={uploading} onOpenChange={setUploading} storeId={storeId} storeName={s?.name ?? `Store #${storeId}`} />
      <CardFormDialog open={carding} onOpenChange={setCarding} storeId={storeId} storeName={s?.name ?? `Store #${storeId}`} categories={cardCategories} />

      <ConfirmationDialog open={removing != null} title={`Remove ${removing?.name ?? 'this item'}?`}
        description="It disappears from the store's menu straight away. Cards that only covered this item may stop working for it."
        confirmLabel="Remove" variant="destructive" isLoading={deleteItem.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && deleteItem.mutate(removing.id, { onSuccess: () => setRemoving(null) })} />
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/menus" search={{ tab: 'stores' }} className="inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> All store menus
    </Link>
  )
}

function Fact({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={cn('rounded-2xl border px-3.5 py-2.5 backdrop-blur-md', warn ? 'border-amber-400/30 bg-amber-400/10' : 'border-white/10 bg-white/[0.06]')}>
      <p className={cn('truncate text-lg font-bold tabular-nums', warn ? 'text-amber-200' : 'text-white')}>{value}</p>
      <p className="truncate text-[11px] text-white/55">{label}</p>
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: [T, string][]; id: string }) {
  return (
    <div role="radiogroup" className="flex gap-1 rounded-xl bg-muted/60 p-1">
      {options.map(([v, label]) => {
        const on = value === v
        return (
          <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onChange(v)}
            className={cn('relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function MenuItemCard({ item, delay, onEdit, onRemove, onToggleStock }: {
  item: MenuItemResponse; delay: number; onEdit: () => void; onRemove: () => void; onToggleStock: () => void
}) {
  const img = usableImage(item.imageUrl)
  const [imgOk, setImgOk] = useState(true)
  const veg = item.itemType !== 'NON_VEG'
  const out = item.availabilityStatus === 'OUT_OF_STOCK'
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('group relative flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/[0.04]', out && 'bg-muted/30')}>
      <div className={cn('relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br',
        veg ? 'from-emerald-100 to-teal-200 dark:from-emerald-500/15 dark:to-teal-500/10' : 'from-rose-100 to-orange-200 dark:from-rose-500/15 dark:to-orange-500/10')}>
        {img && imgOk ? <img src={img} alt="" onError={() => setImgOk(false)} className={cn('h-full w-full object-cover transition-transform duration-500 group-hover:scale-110', out && 'grayscale')} />
          : (veg ? <Leaf className="h-8 w-8 text-emerald-600/60" /> : <Drumstick className="h-8 w-8 text-rose-600/60" />)}
        {out && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-white">Sold out</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('flex min-w-0 items-center gap-1.5 text-sm font-semibold', out ? 'text-muted-foreground' : 'text-foreground')}>
            <VegMark veg={veg} /> <span className="truncate">{item.name}</span>
          </p>
          <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{formatPrice(item.price).replace('.00', '')}</span>
        </div>
        {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <button type="button" role="switch" aria-checked={!out} aria-label={`${item.name} in stock`} onClick={onToggleStock}
              className={cn('relative h-5 w-9 rounded-full transition-colors', !out ? 'bg-emerald-500' : 'bg-muted-foreground/30')}>
              <motion.span layout className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow', !out ? 'right-0.5' : 'left-0.5')} />
            </button>
            {out ? <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><PackageX className="h-3 w-3" />Out of stock</span> : 'In stock'}
          </span>
          <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button type="button" onClick={onEdit} aria-label={`Edit ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={onRemove} aria-label={`Remove ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default StoreMenuPage
