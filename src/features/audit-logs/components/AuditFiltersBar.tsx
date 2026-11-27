import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditFacets, AuditFilters, AuditRange } from '../types/audit-log.types'
import { ACTOR_TYPES, humanize } from '../utils/audit-display'

interface AuditFiltersBarProps {
  filters: AuditFilters
  search: string
  onSearch: (q: string) => void
  onChange: (patch: Partial<AuditFilters>) => void
  onReset: () => void
  facets: AuditFacets | undefined
}

const RANGES: { value: AuditRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
]

const selectCls =
  'h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T | undefined; options: { value: T | undefined; label: string }[]; onChange: (v: T | undefined) => void; label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl border border-border bg-muted/50 p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={o.label} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={cn(
              'whitespace-nowrap rounded-[10px] px-3 py-1.5 text-xs font-medium transition-all',
              on ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function AuditFiltersBar({ filters, search, onSearch, onChange, onReset, facets }: AuditFiltersBarProps) {
  const chips: { key: string; label: string; clear: Partial<AuditFilters> }[] = []
  if (filters.actorEmail) chips.push({ key: 'who', label: `Person: ${filters.actorEmail}`, clear: { actorEmail: undefined } })
  if (filters.entityType) {
    chips.push({
      key: 'item',
      label: `Item: ${filters.entityType}${filters.entityId != null ? ` #${filters.entityId}` : ''}`,
      clear: { entityType: undefined, entityId: undefined },
    })
  }
  if (filters.storeId != null) chips.push({ key: 'store', label: `Store #${filters.storeId}`, clear: { storeId: undefined } })
  if (filters.action) chips.push({ key: 'action', label: `Action: ${humanize(filters.action)}`, clear: { action: undefined } })
  if (filters.source) {
    chips.push({ key: 'source', label: `From the ${filters.source === 'VENDOR_APP' ? 'vendor app' : filters.source === 'CUSTOMER_APP' ? 'Strike app' : 'admin panel'}`, clear: { source: undefined } })
  }

  const filtered = chips.length > 0 || !!filters.actorType || !!filters.outcome || !!search || filters.range !== '7d'

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by person, action, item, IP address…"
            aria-label="Search audit logs"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button type="button" onClick={() => onSearch('')} aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Who" value={filters.actorType} onChange={(v) => onChange({ actorType: v })}
            options={[{ value: undefined, label: 'Everyone' }, ...ACTOR_TYPES]} />
          <Segmented label="Result" value={filters.outcome} onChange={(v) => onChange({ outcome: v })}
            options={[{ value: undefined, label: 'All results' }, { value: 'SUCCESS', label: 'Succeeded' }, { value: 'FAILED', label: 'Failed' }]} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Period" value={filters.range} onChange={(v) => onChange({ range: v ?? '7d' })} options={RANGES} />
        <select aria-label="Action" className={selectCls} value={filters.action ?? ''}
          onChange={(e) => onChange({ action: e.target.value || undefined })}>
          <option value="">All actions</option>
          {(facets?.actions ?? []).map((a) => <option key={a} value={a}>{humanize(a)}</option>)}
        </select>
        <select aria-label="Item type" className={selectCls} value={filters.entityType ?? ''}
          onChange={(e) => onChange({ entityType: e.target.value || undefined, entityId: undefined })}>
          <option value="">All items</option>
          {(facets?.entityTypes ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select aria-label="Where" className={selectCls} value={filters.source ?? ''}
          onChange={(e) => onChange({ source: (e.target.value || undefined) as AuditFilters['source'] })}>
          <option value="">Anywhere</option>
          <option value="ADMIN_PANEL">Admin panel</option>
          <option value="VENDOR_APP">Vendor app</option>
          <option value="CUSTOMER_APP">Strike app (customers)</option>
        </select>
        {chips.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-xs font-medium text-primary">
            {c.label}
            <button type="button" onClick={() => onChange(c.clear)} aria-label={`Remove filter ${c.label}`}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/15">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {filtered && (
          <button type="button" onClick={onReset} className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground">
            Reset filters
          </button>
        )}
      </div>
    </div>
  )
}
