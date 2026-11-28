import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Eye, GalleryHorizontalEnd, Hourglass, Plus, PowerOff, RefreshCw, Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { useAllBanners, useReorderBanners, useTodayBanners } from './api/banner-studio.api'
import { BannerBoard, BannerSchedule } from './components/BannerBoard'
import { BannerEditor } from './components/BannerEditor'
import { PhonePreview } from './components/PhonePreview'
import type { BannerResponse } from './types/banner.types'
import { addDays, bannerState, dayLabel, indiaToday, showsOn } from './utils/banner-meta'

function HeaderStat({ icon: Icon, label, value, hint, tone }: { icon: LucideIcon; label: string; value: number | undefined; hint?: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg', tone)}><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        {value == null ? <span className="block text-xl font-bold leading-none text-white">—</span> : <AnimatedNumber value={value} className="block text-xl font-bold leading-none text-white" />}
        <span className="mt-1 block truncate text-[11px] text-white/60">{label}</span>
        {hint && <span className="block truncate text-[10px] text-white/40">{hint}</span>}
      </span>
    </div>
  )
}

export function BannersPage() {
  const all = useAllBanners()
  const today = useTodayBanners()
  const reorder = useReorderBanners()
  const [editing, setEditing] = useState<BannerResponse | null | undefined>(undefined)
  const [previewDay, setPreviewDay] = useState<string>('')
  const day = indiaToday()
  const banners = useMemo(() => all.data ?? [], [all.data])

  const counts = useMemo(() => {
    const c = { LIVE: 0, SCHEDULED: 0, ENDED: 0, OFF: 0 }
    for (const b of banners) c[bannerState(b, day)] += 1
    return c
  }, [banners, day])

  /** The next time the carousel changes: a banner starting or a last day passing. */
  const next = useMemo(() => {
    const evs: { day: string; text: string }[] = []
    for (const b of banners) {
      if (!b.isActive) continue
      if (b.validFrom && b.validFrom > day) evs.push({ day: b.validFrom, text: `“${b.title}” starts` })
      if (b.validUntil && b.validUntil >= day) evs.push({ day: addDays(b.validUntil, 1), text: `“${b.title}” stops` })
    }
    return evs.sort((a, b) => a.day.localeCompare(b.day))[0]
  }, [banners, day])

  const previewList = previewDay ? banners.filter((b) => showsOn(b, previewDay)) : (today.data ?? [])

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <GalleryHorizontalEnd className="auth-float pointer-events-none absolute -right-6 -top-4 h-44 w-44 text-white/[0.04]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-300 via-fuchsia-500 to-violet-700 shadow-lg shadow-fuchsia-600/40"><GalleryHorizontalEnd className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">The pictures that slide along the top of the customer app’s home screen. Plan them by date, drag them into order and preview exactly what customers see.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { void all.refetch(); void today.refetch() }} aria-label="Refresh"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/15">
                <RefreshCw className={cn('h-4 w-4', (all.isFetching || today.isFetching) && 'animate-spin')} />
              </button>
              <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setEditing(null)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b0c10] shadow-lg">
                <Plus className="h-4 w-4" /> New banner
              </motion.button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <HeaderStat icon={Eye} label="In the app now" value={all.data ? counts.LIVE : undefined} tone="bg-gradient-to-br from-emerald-400 to-teal-600" />
            <HeaderStat icon={CalendarClock} label="Starting later" value={all.data ? counts.SCHEDULED : undefined} tone="bg-gradient-to-br from-sky-400 to-indigo-600" />
            <HeaderStat icon={Hourglass} label="Ended" value={all.data ? counts.ENDED : undefined} tone="bg-gradient-to-br from-slate-400 to-slate-600" />
            <HeaderStat icon={PowerOff} label="Switched off" value={all.data ? counts.OFF : undefined} tone="bg-gradient-to-br from-amber-400 to-orange-600" />
            <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md sm:col-span-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-fuchsia-600 text-white shadow-lg"><Sparkles className="h-4 w-4" /></span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{next ? (next.day === day ? 'Today' : dayLabel(next.day)) : 'Nothing planned'}</span>
                <span className="block truncate text-[11px] text-white/60">{next ? next.text : 'Next change to the carousel'}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {all.isLoading ? (
            <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>
          ) : all.isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center text-sm text-red-700">Couldn&apos;t load banners. <button type="button" className="font-semibold underline" onClick={() => void all.refetch()}>Try again</button></div>
          ) : banners.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-600"><GalleryHorizontalEnd className="h-7 w-7" /></span>
              <p className="text-sm font-semibold text-foreground">No banners yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">Add a wide picture (about 1320 × 600) to show at the top of the customer app.</p>
              <button type="button" onClick={() => setEditing(null)} className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add the first banner</button>
            </motion.div>
          ) : (
            <BannerBoard key={banners.map((b) => `${b.id}:${b.displayOrder}:${b.isActive}`).join()} banners={banners}
              onEdit={setEditing} onReorder={(ids) => reorder.mutate(ids)} saving={reorder.isPending} />
          )}
          {banners.length > 0 && <BannerSchedule banners={banners} />}
        </div>

        <aside className="flex flex-col items-center gap-4 xl:sticky xl:top-4 xl:self-start">
          <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">What customers see</p>
            <p className="mb-3 text-xs text-muted-foreground">{previewDay ? 'Worked out from the dates you set.' : 'Live — the same list the app loads right now.'}</p>
            <div className="mb-4 flex items-center gap-2">
              <input type="date" value={previewDay} min={day} onChange={(e) => setPreviewDay(e.target.value)} aria-label="Preview another day"
                className="flex-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-sm" />
              {previewDay && <button type="button" onClick={() => setPreviewDay('')} className="rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-muted">Today</button>}
            </div>
            <PhonePreview key={previewDay || 'today'} banners={previewList}
              caption={`${previewDay ? dayLabel(previewDay, true) : 'Today'} · ${previewList.length} banner${previewList.length === 1 ? '' : 's'}`} />
            <p className="mt-3 text-center text-[11px] text-muted-foreground">The app also slides in its own “new card” cards after these.</p>
          </div>
        </aside>
      </div>

      <BannerEditor open={editing !== undefined} banner={editing} onClose={() => setEditing(undefined)} />
    </div>
  )
}

export default BannersPage
