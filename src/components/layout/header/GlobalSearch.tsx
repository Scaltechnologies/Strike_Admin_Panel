import { useEffect, useCallback } from 'react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Search, LayoutDashboard, Users, Store, UtensilsCrossed,
  Layers, Tag, Banknote, ArrowDownCircle, Bell, Image,
  TrendingUp, BarChart2, Settings, Key, FileText, User,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Users', path: '/users', icon: Users },
      { label: 'Vendors', path: '/vendors', icon: Store },
      { label: 'Menus', path: '/menus', icon: UtensilsCrossed },
    ],
  },
  {
    heading: 'Commerce',
    items: [
      { label: 'Cards', path: '/cards', icon: Layers },
      { label: 'Coupons', path: '/coupons', icon: Tag },
      { label: 'Payments', path: '/payments', icon: Banknote },
      { label: 'Withdrawals', path: '/withdrawals', icon: ArrowDownCircle },
    ],
  },
  {
    heading: 'Marketing',
    items: [
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'Banners', path: '/banners', icon: Image },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { label: 'Analytics', path: '/analytics', icon: TrendingUp },
      { label: 'Reports', path: '/reports', icon: BarChart2 },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'API Keys', path: '/api-keys', icon: Key },
      { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
      { label: 'Profile', path: '/profile', icon: User },
    ],
  },
]

export function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useUIStore()
  const navigate = useNavigate()

  const open = useCallback(() => setSearchOpen(true), [setSearchOpen])
  const close = useCallback(() => setSearchOpen(false), [setSearchOpen])

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  function handleSelect(path: string) {
    close()
    void navigate({ to: path })
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={open}
        aria-label="Open search (Ctrl+K)"
        className={cn(
          'flex h-8 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground',
          'transition-colors hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'hidden sm:flex',
        )}
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden md:inline">Search…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Mobile icon trigger */}
      <button
        onClick={open}
        aria-label="Open search"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground sm:hidden',
          'transition-colors hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>

      {/* Command dialog */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search"
        description="Search pages and navigation"
      >
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground/70">
          <CommandInput placeholder="Search pages and navigation…" />
          <CommandList className="max-h-96 overflow-auto p-1.5">
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>
            {NAV_GROUPS.map((group, i) => (
              <span key={group.heading}>
                {i > 0 && <CommandSeparator className="my-1 h-px bg-border" />}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <CommandItem
                        key={item.path}
                        value={`${group.heading} ${item.label}`}
                        onSelect={() => handleSelect(item.path)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground data-[selected]:bg-accent data-[selected]:text-foreground"
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {item.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </span>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
