import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageOff, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BannerResponse } from '../types/banner.types'
import { APP_RATIO } from '../utils/banner-meta'

/** The customer app's home screen with its banner carousel, auto-playing like the real one. */
export function PhonePreview({ banners, caption }: { banners: BannerResponse[]; caption: string }) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)
  const n = banners.length
  const idx = n ? i % n : 0

  useEffect(() => {
    if (!playing || n < 2) return
    const t = window.setInterval(() => setI((x) => x + 1), 3500)
    return () => window.clearInterval(t)
  }, [playing, n])

  const b = banners[idx]
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[260px] rounded-[38px] border-[8px] border-zinc-900 bg-zinc-900 shadow-2xl dark:border-zinc-700">
        <span className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-700" />
        <div className="overflow-hidden rounded-[30px] bg-white pb-4 dark:bg-zinc-950">
          <div className="flex items-center justify-between px-4 pb-2 pt-8">
            <div>
              <div className="h-2 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-1.5 h-3 w-24 rounded bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="px-3">
            <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900" style={{ aspectRatio: APP_RATIO }}>
              <AnimatePresence initial={false} mode="popLayout">
                {b ? (
                  <motion.img key={`${b.id}-${idx}`} src={b.imageUrl} alt={b.title}
                    initial={{ x: '100%', opacity: 0.6 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0.6 }} transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                    className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-400">
                    <ImageOff className="h-5 w-5" /><span className="text-[10px]">No banner — this space is hidden</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-1.5 flex justify-center gap-1">
              {banners.map((x, k) => (
                <button key={x.id} type="button" onClick={() => setI(k)} aria-label={`Show ${x.title}`}
                  className={cn('h-1.5 rounded-full transition-all', k === idx ? 'w-4 bg-[#e01a00]' : 'w-1.5 bg-zinc-300 dark:bg-zinc-700')} />
              ))}
            </div>
          </div>
          <div className="mt-2 space-y-2 px-3">
            <div className="h-2.5 w-20 rounded bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex gap-2">
              {[0, 1, 2].map((k) => <div key={k} className="h-16 flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-900" />)}
            </div>
            <div className="h-2.5 w-24 rounded bg-zinc-300 dark:bg-zinc-700" />
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
                <div className="flex-1 space-y-1"><div className="h-2 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-2 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{caption}</span>
        {n > 1 && (
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} className="rounded-full border border-border p-1 hover:bg-muted">
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        )}
      </div>
      {b && <p className="max-w-[260px] truncate text-center text-xs font-medium text-foreground">{idx + 1} of {n} · {b.title}</p>}
    </div>
  )
}
