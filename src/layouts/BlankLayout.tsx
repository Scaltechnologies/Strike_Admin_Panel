import type { ReactNode } from 'react'

interface BlankLayoutProps {
  children: ReactNode
}

export function BlankLayout({ children }: BlankLayoutProps) {
  return <div className="min-h-screen bg-background">{children}</div>
}
