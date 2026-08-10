import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import { MobileSidebar } from '@/components/layout/sidebar/MobileSidebar'
import { Header } from '@/components/layout/header/Header'
import { TopLoadingBar } from '@/components/layout/TopLoadingBar'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TopLoadingBar />
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
