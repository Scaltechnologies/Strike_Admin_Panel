import { memo, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { hasPermission } from '@/core/auth/auth'
import { SidebarNavItem } from './SidebarNavItem'
import { cn } from '@/lib/utils'
import type { SidebarGroup } from '@/core/navigation/sidebar'

interface SidebarNavGroupProps {
  group: SidebarGroup
  /** Icon-only rail mode — group headers/toggles are hidden, items render as a flat icon stack. */
  collapsed?: boolean
  onMobileClose?: () => void
}

export const SidebarNavGroup = memo(function SidebarNavGroup({ group, collapsed, onMobileClose }: SidebarNavGroupProps) {
  const [expanded, setExpanded] = useState(true)
  const listId = useId()

  const visibleItems = group.items.filter(
    (item) => !item.permission || hasPermission(item.permission),
  )

  if (visibleItems.length === 0) return null

  return (
    <div className="mb-5">
      {collapsed ? (
        <div className="mb-1.5 h-px bg-border" aria-hidden />
      ) : (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={listId}
          className="mb-1.5 flex w-full items-center justify-between rounded px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {group.title}
          <ChevronDown
            className={cn('h-3 w-3 shrink-0 transition-transform duration-150', expanded ? 'rotate-0' : '-rotate-90')}
            aria-hidden
          />
        </button>
      )}
      {(collapsed || expanded) && (
        <ul id={listId} className="space-y-0.5" role="list">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <SidebarNavItem item={item} collapsed={collapsed} onMobileClose={onMobileClose} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
