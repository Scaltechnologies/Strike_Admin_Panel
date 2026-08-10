import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBranchDetail } from '../hooks/useBranches'
import { BranchProfileCard } from './BranchProfileCard'
import { BranchManagersCard } from './BranchManagersCard'
import type { Branch } from '../types/branch.types'

type DrawerTab = 'details' | 'managers'

const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'managers', label: 'Managers' },
]

interface BranchDrawerProps {
  branch: Branch | null
  onClose: () => void
}

export function BranchDrawer({ branch, onClose }: BranchDrawerProps) {
  return (
    <AnimatePresence>
      {branch && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          {/* key on branch.id remounts DrawerContent when switching branches */}
          <DrawerContent key={branch.id} branch={branch} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerContent({ branch, onClose }: { branch: Branch; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('details')
  const { data: detail, isLoading } = useBranchDetail(branch.id)
  const currentBranch = detail ?? branch

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  return (
    <motion.div
      key="branch-drawer"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-2xl sm:w-[480px] lg:w-[540px]"
      role="dialog"
      aria-modal="true"
      aria-label="Branch details"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Branch Details
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
            #{branch.id} · {branch.name}
          </p>
          <div className="mt-1">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                currentBranch.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  currentBranch.isActive ? 'bg-green-500' : 'bg-gray-400',
                )}
              />
              {currentBranch.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <button
          onClick={close}
          aria-label="Close drawer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-border px-5">
        <div className="-mb-px flex gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition-colors focus-visible:outline-none',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'details' && (
          <BranchProfileCard
            branch={currentBranch}
            isLoading={isLoading && !detail}
          />
        )}
        {activeTab === 'managers' && (
          <BranchManagersCard branch={currentBranch} />
        )}
      </div>
    </motion.div>
  )
}
