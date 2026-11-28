import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BellRing, CheckCircle2, ImagePlus, Info, Loader2, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { apiMessage, useSaveBanner, type BannerDraft } from '../api/banner-studio.api'
import type { BannerResponse } from '../types/banner.types'
import { APP_RATIO, IDEAL_SIZE, addDays, checkImage, indiaToday, type ImageCheck } from '../utils/banner-meta'

const INPUT = 'block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring'
const MAX_BYTES = 15 * 1024 * 1024

export function BannerEditor({ open, banner, onClose }: { open: boolean; banner?: BannerResponse | null; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-3xl">
        {open && <EditorBody key={banner?.id ?? 'new'} banner={banner} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function EditorBody({ banner, onClose }: { banner?: BannerResponse | null; onClose: () => void }) {
  const today = indiaToday()
  const [d, setD] = useState<BannerDraft>(() => ({
    title: banner?.title ?? '',
    description: banner?.description ?? '',
    validFrom: banner?.validFrom ?? '',
    validUntil: banner?.validUntil ?? '',
    isActive: banner?.isActive ?? true,
  }))
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(banner?.imageUrl ?? null)
  const [check, setCheck] = useState<ImageCheck | null>(null)
  const [push, setPush] = useState(false)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const save = useSaveBanner()
  const set = <K extends keyof BannerDraft>(k: K, v: BannerDraft[K]) => setD((s) => ({ ...s, [k]: v }))

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])

  const pick = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('That isn’t an image — choose a JPG, PNG or WebP.'); return }
    if (f.size > MAX_BYTES) { setError('That image is over 15 MB — choose a smaller one.'); return }
    setError(null)
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => setCheck(checkImage(img.naturalWidth, img.naturalHeight, f.size))
    img.src = url
    setFile(f)
    setPreview(url)
  }

  const problems: string[] = []
  if (!preview) problems.push('Add an image')
  if (!d.title.trim()) problems.push('Give it a name')
  if (d.validFrom && d.validUntil && d.validUntil < d.validFrom) problems.push('The end date is before the start date')
  const goesLiveNow = d.isActive && (!d.validFrom || d.validFrom <= today) && (!d.validUntil || d.validUntil >= today)

  const submit = () => {
    setError(null)
    save.mutate(
      { id: banner?.id, draft: d, file, imageUrl: banner?.imageUrl, push: !banner && push && d.isActive },
      { onSuccess: onClose, onError: (e) => setError(apiMessage(e, "Couldn't save the banner.")) },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary" />{banner ? 'Edit banner' : 'New banner'}</DialogTitle>
        <DialogDescription>Banners slide along the top of the customer app’s home screen.</DialogDescription>
      </DialogHeader>

      <div>
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
          onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') input.current?.click() }}
          className={cn('group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-colors', drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
          style={{ aspectRatio: APP_RATIO }}>
          {preview ? (
            <>
              <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <Upload className="mr-2 h-4 w-4" /> Change image
              </span>
              <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white">Exactly how the app crops it</span>
            </>
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }}><ImagePlus className="h-8 w-8" /></motion.span>
              <span className="text-sm font-medium text-foreground">Drop an image here, or click to choose</span>
              <span className="text-xs">Best size {IDEAL_SIZE.w} × {IDEAL_SIZE.h} px (wide, 2.2 : 1) · JPG, PNG or WebP · up to 15 MB</span>
            </span>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <AnimatePresence>
          {check && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn('mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs',
                check.level === 'good' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200'
                  : check.level === 'ok' ? 'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200' : 'border-red-500/30 bg-red-500/5 text-red-800 dark:text-red-200')}>
              {check.level === 'good' ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <span><b>{check.width} × {check.height} px · {check.sizeKb >= 1024 ? `${(check.sizeKb / 1024).toFixed(1)} MB` : `${check.sizeKb} KB`}.</b> {check.notes.join(' ')}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Name (for you — not shown in the app)</span>
          <input value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="Diwali festival week" maxLength={255} className={INPUT} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Note (optional, used as the push text)</span>
          <input value={d.description} onChange={(e) => set('description', e.target.value)} placeholder="20% off all cards this week" maxLength={500} className={INPUT} />
        </label>
      </div>

      <div>
        <span className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          When it shows (India dates)
          {([['Today only', today, today], ['7 days', today, addDays(today, 6)], ['30 days', today, addDays(today, 29)], ['No dates', '', '']] as const).map(([l, f, u]) => (
            <button key={l} type="button" onClick={() => setD((s) => ({ ...s, validFrom: f, validUntil: u }))}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] font-normal hover:bg-muted">{l}</button>
          ))}
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-[11px] text-muted-foreground">From (empty = from now)</span>
            <input type="date" value={d.validFrom} onChange={(e) => set('validFrom', e.target.value)} className={INPUT} /></label>
          <label className="block"><span className="mb-1 block text-[11px] text-muted-foreground">Until (empty = until you switch it off)</span>
            <input type="date" value={d.validUntil} min={d.validFrom || undefined} onChange={(e) => set('validUntil', e.target.value)} className={INPUT} /></label>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3.5 py-3 hover:bg-muted/40">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#e01a00]" checked={d.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          <span><span className="block text-sm font-medium text-foreground">Switched on</span>
            <span className="block text-xs text-muted-foreground">{!d.isActive ? 'Saved but hidden until you switch it on.' : goesLiveNow ? 'Shows in the app as soon as you save.' : 'Shows automatically on the start date.'}</span></span>
        </label>
        {!banner && (
          <label className={cn('flex items-start gap-3 rounded-xl border px-3.5 py-3', d.isActive ? 'cursor-pointer border-border hover:bg-muted/40' : 'border-border opacity-50')}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#e01a00]" disabled={!d.isActive} checked={push && d.isActive} onChange={(e) => setPush(e.target.checked)} />
            <span><span className="flex items-center gap-1.5 text-sm font-medium text-foreground"><BellRing className="h-3.5 w-3.5" /> Also send a push to every customer</span>
              <span className="block text-xs text-muted-foreground">Uses the name and note above. Use sparingly — it goes to everyone.</span></span>
          </label>
        )}
      </div>

      {!banner && push && d.isActive && !goesLiveNow && (
        <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />The push goes out now, even though the banner only starts showing on its start date.</p>
      )}

      {(error || (problems.length > 0 && (d.title || file))) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error ?? problems.join(' · ')}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
        <button type="button" onClick={submit} disabled={problems.length > 0 || save.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50">
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {save.isPending ? (file ? 'Uploading…' : 'Saving…') : banner ? 'Save changes' : push && d.isActive ? 'Add and send push' : 'Add banner'}
        </button>
      </div>
    </div>
  )
}
