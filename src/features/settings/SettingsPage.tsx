import { useNavigate } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight, BellRing, CreditCard, History, Info, LayoutGrid, Palette, Percent, Power, RefreshCw, Settings2, UtensilsCrossed, type LucideIcon,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { useAlertsStore } from '@/features/alerts/alerts-store'
import { ApprovalSettingsPanel } from '@/features/menus/components/ApprovalSettingsPanel'
import { useSettingsOverview, type SettingsOverview } from './api/settings-overview.api'
import { AppAccessSection } from './components/AppAccessSection'
import { CommissionSection } from './components/CommissionSection'
import { AlertsSection, AppearanceSection } from './components/DeviceSections'
import { AboutSection, HistorySection } from './components/InfoSections'
import { OverviewSection } from './components/OverviewSection'
import { PaymentsSection } from './components/PaymentsSection'
import { Explain, SectionHead } from './components/SettingsBits'
import { APPROVAL_LABEL, PAYMENT_META, healthChecks, type SettingsTab } from './utils/settings-meta'

const TABS: { id: SettingsTab; label: string; icon: LucideIcon; group: 'platform' | 'you' | 'info' }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, group: 'platform' },
  { id: 'access', label: 'App access', icon: Power, group: 'platform' },
  { id: 'payments', label: 'Payments', icon: CreditCard, group: 'platform' },
  { id: 'commission', label: 'Commission', icon: Percent, group: 'platform' },
  { id: 'menus', label: 'Menu approvals', icon: UtensilsCrossed, group: 'platform' },
  { id: 'alerts', label: 'Alerts & sounds', icon: BellRing, group: 'you' },
  { id: 'appearance', label: 'Appearance', icon: Palette, group: 'you' },
  { id: 'history', label: 'Change history', icon: History, group: 'info' },
  { id: 'about', label: 'About', icon: Info, group: 'info' },
]

function HeroChip({ label, value, tone, pulse, onClick }: { label: string; value: string; tone: string; pulse?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/[0.12]">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-70', tone)} />}
        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', tone)} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">{value}</span>
        <span className="block truncate text-[11px] text-white/55">{label}</span>
      </span>
    </button>
  )
}

function MenusTab({ data }: { data: SettingsOverview | undefined }) {
  const allowed = hasPermission('SEC_MENUS')
  return (
    <div className="flex flex-col gap-4">
      <SectionHead icon={UtensilsCrossed} tone="bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/30" title="Menu approvals"
        body="Decide whether store owners and managers need your approval before menu changes go live in the customer app."
        right={data && data.menuApproval.pending > 0 ? (
          <Link to="/menus" search={{ tab: 'approvals' }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600">
            {data.menuApproval.pending} waiting for you <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : undefined} />
      {allowed ? <ApprovalSettingsPanel /> : (
        <Explain icon={Info} tone="warn">You don&apos;t have access to Menus, so you can&apos;t change this. Currently: <b>{data ? APPROVAL_LABEL[data.menuApproval.mode] : '…'}</b>.</Explain>
      )}
    </div>
  )
}

export function SettingsPage({ tab = 'overview' }: { tab?: SettingsTab }) {
  const navigate = useNavigate()
  const overview = useSettingsOverview()
  const o = overview.data
  const sound = useAlertsStore((s) => s.settings.sound)
  const issues = healthChecks(o, sound).filter((h) => h.level !== 'info').length
  const go = (id: SettingsTab) => {
    void navigate({ to: '/settings', search: { tab: id === 'overview' ? undefined : id }, replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
          className="pointer-events-none absolute -right-8 -top-8 text-white/[0.05]" aria-hidden>
          <Settings2 className="h-48 w-48" />
        </motion.span>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700 shadow-lg shadow-slate-500/40"><Settings2 className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">The switches that control the whole Strike platform — app access, payments, commission and menu approvals — plus your own preferences.</p>
              </div>
            </div>
            <button type="button" onClick={() => void overview.refetch()} aria-label="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/15">
              <RefreshCw className={cn('h-4 w-4', overview.isFetching && 'animate-spin')} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            <HeroChip label="Customer & vendor apps" value={!o ? '…' : o.maintenance.on ? 'Closed' : 'Open'} tone={o?.maintenance.on ? 'bg-red-500' : 'bg-emerald-400'} pulse onClick={() => go('access')} />
            <HeroChip label="Payments" value={!o ? '…' : PAYMENT_META[o.paymentMode.mode]?.short ?? o.paymentMode.mode} tone="bg-sky-400" onClick={() => go('payments')} />
            <HeroChip label="Default commission" value={!o ? '…' : `${Number(o.commission.rate)}%`} tone="bg-orange-400" onClick={() => go('commission')} />
            <HeroChip label="Menu approvals" value={!o ? '…' : APPROVAL_LABEL[o.menuApproval.mode]} tone="bg-amber-400" onClick={() => go('menus')} />
            <HeroChip label="Health check" value={!o ? '…' : issues ? `${issues} to look at` : 'All good'} tone={issues ? 'bg-amber-400' : 'bg-emerald-400'} pulse={issues > 0} onClick={() => go('overview')} />
          </div>
        </div>
      </motion.section>

      {overview.isError && !o && (
        <Explain icon={Info} tone="danger">Couldn&apos;t load the settings. Check your connection and press refresh.</Explain>
      )}

      <nav aria-label="Settings sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
        <div role="tablist" className="flex min-w-max items-center gap-1">
          {TABS.map(({ id, label, icon: Icon, group }, i) => {
            const on = tab === id
            const showDivider = i > 0 && TABS[i - 1].group !== group
            return (
              <div key={id} className="flex items-center gap-1">
                {showDivider && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
                <button type="button" role="tab" aria-selected={on} onClick={() => go(id)}
                  className={cn('relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  {on && <motion.span layoutId="settings-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#e01a00] to-[#ff6a00] shadow-md shadow-red-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                  {id === 'access' && o?.maintenance.on && <span className="relative h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />}
                  {id === 'menus' && (o?.menuApproval.pending ?? 0) > 0 && (
                    <span className={cn('relative rounded-full px-1.5 text-[10px] font-bold tabular-nums', on ? 'bg-white/25 text-white' : 'bg-amber-500 text-white')}>{o!.menuApproval.pending}</span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'overview' && <OverviewSection data={o} loading={overview.isLoading} go={go} />}
          {tab === 'access' && <AppAccessSection data={o} />}
          {tab === 'payments' && <PaymentsSection data={o} />}
          {tab === 'commission' && <CommissionSection data={o} />}
          {tab === 'menus' && <MenusTab data={o} />}
          {tab === 'alerts' && <AlertsSection />}
          {tab === 'appearance' && <AppearanceSection />}
          {tab === 'history' && <HistorySection data={o} />}
          {tab === 'about' && <AboutSection />}
        </ErrorBoundary>
      </motion.div>
    </div>
  )
}

export default SettingsPage
