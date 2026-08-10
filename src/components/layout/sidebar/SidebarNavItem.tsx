import { memo } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, TrendingUp, Users, Store, Building2, GitBranch,
  ArrowDownCircle, Tag, Image, UtensilsCrossed, Bell,
  BarChart2, Settings, FileText, Key, Banknote, Layers, User, Receipt,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SidebarItem } from '@/core/navigation/sidebar'

type IconComponent = React.ComponentType<LucideProps>

const ICON_MAP: Record<string, IconComponent> = {
  LayoutDashboard, TrendingUp, Users, Store, Building2, GitBranch,
  ArrowDownCircle, Tag, Image, UtensilsCrossed, Bell,
  BarChart2, Settings, FileText, Key, Banknote, Layers, User, Receipt,
}

interface SidebarNavItemProps {
  item: SidebarItem
  /** Icon-only rail mode — hides the label and shows it in a hover/focus tooltip instead. */
  collapsed?: boolean
  onMobileClose?: () => void
}

export const SidebarNavItem = memo(function SidebarNavItem({ item, collapsed, onMobileClose }: SidebarNavItemProps) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname })
  const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path))
  const IconComponent = ICON_MAP[item.icon]

  return (
    <Link
      to={item.path}
      onClick={onMobileClose}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group/item relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        collapsed ? 'justify-center px-2' : 'px-3',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {IconComponent && (
        <IconComponent
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover/item:text-foreground',
          )}
          aria-hidden
        />
      )}

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          {item.badge !== undefined && (
            <span className={cn(
              'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
              isActive ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary',
            )}>
              {item.badge}
            </span>
          )}
        </>
      )}

      {collapsed && (
        <>
          {item.badge !== undefined && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          )}
          <span
            role="tooltip"
            className={cn(
              'pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md',
              'bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-border',
              'opacity-0 transition-opacity duration-150 group-hover/item:opacity-100 group-focus-visible/item:opacity-100',
            )}
          >
            {item.title}
            {item.badge !== undefined && <span className="ml-1.5 text-muted-foreground">({item.badge})</span>}
          </span>
        </>
      )}
    </Link>
  )
})
