import { useState } from 'react'
import { Sun, Moon, Monitor, Check, AlertTriangle, Percent, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/core/theme/use-theme'
import type { Theme } from '@/constants/theme'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { formatDate } from '@/utils/helpers/date'
import {
  useMaintenanceMode,
  useUpdateMaintenanceMode,
  useGlobalCommissionRate,
  useGlobalCommissionRateHistory,
  useUpdateGlobalCommissionRate,
} from './hooks/useSettings'

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Clean light interface' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follows OS setting' },
]

const DEFAULT_MAINTENANCE_MESSAGE = "App is in maintenance, we'll be back soon."

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function MaintenanceModeCard() {
  const canEdit = usePermission(PERMISSIONS.SETTINGS.EDIT)
  const { data: setting, isLoading } = useMaintenanceMode()
  const { mutate: updateMaintenanceMode, isPending } = useUpdateMaintenanceMode()

  const [showConfirm, setShowConfirm] = useState(false)

  const maintenanceOn = setting?.settingValue === 'true'

  function handleEnable() {
    updateMaintenanceMode(true, { onSuccess: () => setShowConfirm(false) })
  }

  function handleDisable() {
    updateMaintenanceMode(false)
  }

  return (
    <SectionCard
      title="Maintenance Mode"
      description="Block user and vendor app access while you work on the backend"
    >
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          <div
            className={cn(
              'flex items-center justify-between gap-4 rounded-lg border p-4',
              maintenanceOn
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-border bg-muted/20',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  maintenanceOn ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
                )}
              >
                <AlertTriangle className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {maintenanceOn ? 'Maintenance mode is ON' : 'Maintenance mode is OFF'}
                </p>
                <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                  {maintenanceOn
                    ? `User and vendor apps are showing: "${DEFAULT_MAINTENANCE_MESSAGE}"`
                    : 'User and vendor apps are accessible normally.'}
                </p>
              </div>
            </div>

            {canEdit && (
              <button
                type="button"
                role="switch"
                aria-checked={maintenanceOn}
                onClick={() => (maintenanceOn ? handleDisable() : setShowConfirm(true))}
                disabled={isPending}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                  maintenanceOn ? 'bg-destructive' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    maintenanceOn ? 'translate-x-5' : 'translate-x-0.5',
                  )}
                />
              </button>
            )}
          </div>

          {!canEdit && (
            <p className="mt-3 text-xs text-muted-foreground">
              You don't have permission to change maintenance mode.
            </p>
          )}
        </>
      )}

      <ConfirmationDialog
        open={showConfirm}
        title="Enable maintenance mode?"
        description={`This will immediately block access to the user and vendor apps, showing: "${DEFAULT_MAINTENANCE_MESSAGE}". Only the admin panel stays accessible.`}
        confirmLabel="Enable maintenance mode"
        variant="destructive"
        onConfirm={handleEnable}
        onCancel={() => setShowConfirm(false)}
        isLoading={isPending}
      />
    </SectionCard>
  )
}

function DefaultCommissionCard() {
  const canEdit = usePermission(PERMISSIONS.COMMISSION.EDIT)
  const [historyPage, setHistoryPage] = useState(0)
  const [showRateDialog, setShowRateDialog] = useState(false)
  const [rateInput, setRateInput] = useState('')
  const [rateError, setRateError] = useState('')

  const { data: rate, isLoading: rateLoading } = useGlobalCommissionRate()
  const { data: history, isLoading: historyLoading } = useGlobalCommissionRateHistory(historyPage)
  const { mutate: updateRate, isPending: updatingRate } = useUpdateGlobalCommissionRate()

  function openDialog() {
    setRateInput(String(Number(rate?.globalCommissionRate ?? 0).toFixed(2)))
    setRateError('')
    setShowRateDialog(true)
  }

  function handleConfirm() {
    const value = parseFloat(rateInput)
    if (isNaN(value) || value < 0 || value > 100) {
      setRateError('Rate must be between 0 and 100')
      return
    }
    updateRate(value, { onSuccess: () => setShowRateDialog(false) })
  }

  return (
    <SectionCard
      title="Default Commission Rate"
      description="Platform-wide commission percentage applied to card purchases, unless a vendor has a custom rate"
    >
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Percent className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current default rate</p>
            {rateLoading ? (
              <div className="mt-1 h-7 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {Number(rate?.globalCommissionRate ?? 0).toFixed(2)}%
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <button
            onClick={openDialog}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Update Rate
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Example: at {Number(rate?.globalCommissionRate ?? 0).toFixed(2)}%, a ₹3,000 card purchase earns the
        platform ₹{((3000 * Number(rate?.globalCommissionRate ?? 0)) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}.
      </p>

      <div className="mt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Rate Change History
        </p>
        {historyLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !history?.content.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No rate history.</p>
        ) : (
          <div className="space-y-2">
            {history.content.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="text-sm">
                    <span className="text-muted-foreground line-through">{h.oldRate ?? '—'}%</span>
                    {' → '}
                    <span className="font-semibold text-foreground">{Number(h.newRate).toFixed(2)}%</span>
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
                  {h.changedByEmail && <p className="text-xs text-muted-foreground">{h.changedByEmail}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {history && history.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
              disabled={historyPage === 0}
              className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
            >
              Prev
            </button>
            <span className="text-xs text-muted-foreground">
              {historyPage + 1} / {history.totalPages}
            </span>
            <button
              onClick={() => setHistoryPage((p) => Math.min(history.totalPages - 1, p + 1))}
              disabled={historyPage >= history.totalPages - 1}
              className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={showRateDialog}
        title="Update default commission rate"
        description="This applies to every vendor without a custom commission rate."
        confirmLabel="Update"
        onConfirm={handleConfirm}
        onCancel={() => { setShowRateDialog(false); setRateError('') }}
        isLoading={updatingRate}
      >
        <div className="mt-1">
          <label className="text-xs font-medium text-muted-foreground">New Rate (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={rateInput}
            onChange={(e) => { setRateInput(e.target.value); setRateError('') }}
            className={cn(
              'mt-1.5 block w-full rounded-lg border bg-card px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              rateError ? 'border-destructive' : 'border-border',
            )}
          />
          {rateError && <p className="mt-1 text-xs text-destructive">{rateError}</p>}
        </div>
      </ConfirmationDialog>
    </SectionCard>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage your preferences and application settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Maintenance Mode */}
        <MaintenanceModeCard />

        {/* Default Commission Rate */}
        <DefaultCommissionCard />

        {/* Appearance */}
        <SectionCard
          title="Appearance"
          description="Customize how the admin panel looks on your device"
        >
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-center transition-all',
                    active
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/50',
                  )}
                >
                  {active && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <Icon className="h-6 w-6" />
                  <div>
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </SectionCard>

        {/* About */}
        <SectionCard
          title="About"
          description="Application version and environment information"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Application</span>
              <span className="font-medium text-foreground">Strike Admin Panel</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Backend</span>
              <span className="font-medium text-foreground">Spring Boot Microservices</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">UI Framework</span>
              <span className="font-medium text-foreground">React 19 + Vite + TanStack</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
