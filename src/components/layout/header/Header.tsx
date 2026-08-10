import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { Breadcrumb } from './Breadcrumb'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

export function Header() {
  const { toggleMobileSidebar } = useUIStore()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 px-4 sm:px-5',
        'border-b border-border bg-background/80 backdrop-blur-md',
      )}
    >
      {/* Left: mobile hamburger + breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          aria-label="Open navigation"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground',
            'transition-colors hover:bg-accent hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'lg:hidden',
          )}
        >
          <Menu className="h-4.5 w-4.5" aria-hidden />
        </button>
        <Breadcrumb />
      </div>

      {/* Right: search + notifications + theme */}
      <div className="flex shrink-0 items-center gap-1.5">
        <GlobalSearch />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  )
}
