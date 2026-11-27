import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Loader2, Upload, UtensilsCrossed, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { useCategoryOptions } from '@/features/menus/hooks/useCategoryOptions'
import { downloadCsv, mapRows, parseTable } from '../csv'
import { useUploadMenu, type BulkResult, type MenuRowInput } from '../onboarding.api'

const FIELDS = {
  name: ['name', 'item', 'item name', 'dish', 'dish name'],
  price: ['price', 'rate', 'amount', 'mrp'],
  category: ['category', 'section', 'menu category'],
  type: ['type', 'veg', 'veg non veg', 'veg/non-veg', 'item type', 'food type'],
  description: ['description', 'details', 'about'],
  available: ['available', 'in stock', 'stock', 'availability'],
  image: ['image', 'image url', 'photo', 'photo url', 'picture'],
} as const
type Field = keyof typeof FIELDS

interface Row { n: number; item: MenuRowInput; problems: string[] }

/** Upload a whole menu for a store from a spreadsheet. Items go live at once. */
export function MenuUploadDialog({ open, onOpenChange, storeId, storeName }: { open: boolean; onOpenChange: (o: boolean) => void; storeId: number; storeName: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <Body storeId={storeId} storeName={storeName} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function Body({ storeId, storeName, onClose }: { storeId: number; storeName: string; onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [paste, setPaste] = useState('')
  const [createMissing, setCreateMissing] = useState(hasPermission('SEC_CATEGORIES'))
  const [result, setResult] = useState<BulkResult<{ row: number; name: string; ok: boolean; error?: string }> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useUploadMenu(storeId)
  const { names } = useCategoryOptions()
  const known = useMemo(() => new Set(Object.values(names).map((n) => n.trim().toLowerCase())), [names])

  const load = (text: string) => {
    const { records, missing } = mapRows<Field>(parseTable(text), FIELDS)
    const need = (['name', 'price', 'category'] as Field[]).filter((f) => missing.includes(f))
    if (need.length) { toast.error(`Missing column${need.length > 1 ? 's' : ''}: ${need.join(', ')}. Use the template.`); return }
    if (!records.length) { toast.error('No items found'); return }
    if (records.length > 500) { toast.error('Upload at most 500 items at a time'); return }
    setRows(records.map((r, i) => {
      const problems: string[] = []
      const price = Number(r.price.replace(/[₹,\s]/g, ''))
      if (!r.name) problems.push('Name missing')
      if (!Number.isFinite(price) || price <= 0) problems.push('Price must be above ₹0')
      if (!r.category) problems.push('Category missing')
      const avail = r.available.trim().toLowerCase()
      return {
        n: i + 1, problems,
        item: {
          name: r.name, price, category: r.category,
          itemType: /non|nv|egg|chicken|meat/i.test(r.type) ? 'NON_VEG' : 'VEG',
          description: r.description || undefined,
          available: !['no', 'n', 'false', '0', 'out', 'out of stock'].includes(avail),
          imageUrl: r.image || undefined,
        },
      }
    }))
    setResult(null)
  }

  const onFile = async (f?: File | null) => {
    if (!f) return
    if (/\.xlsx?$/i.test(f.name)) { toast.error('Please save the sheet as CSV, or paste the rows instead'); return }
    load(await f.text())
  }

  const good = rows?.filter((r) => r.problems.length === 0) ?? []
  const newCats = [...new Set(good.map((r) => r.item.category.trim()).filter((c) => !known.has(c.toLowerCase())))]
  const template = () => downloadCsv('strike-menu-template.csv', [
    ['Name', 'Price', 'Category', 'Type', 'Description', 'Available', 'Image URL'],
    ['Masala Dosa', '90', 'Tiffins', 'Veg', 'Crispy dosa with potato masala', 'Yes', ''],
    ['Chicken Biryani', '220', 'Biryanis', 'Non-Veg', 'Hyderabadi dum biryani', 'Yes', ''],
    ['Filter Coffee', '40', 'Beverages', 'Veg', '', 'Yes', ''],
  ])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><UtensilsCrossed className="h-5 w-5 text-primary" /> Upload menu · {storeName}</DialogTitle>
        <DialogDescription>Add many dishes at once from a spreadsheet. They go live on the store straight away.</DialogDescription>
      </DialogHeader>
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-400/10 dark:to-teal-400/5">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-lg font-bold text-foreground">{result.created} dish{result.created === 1 ? '' : 'es'} added</p>
                <p className="text-xs text-muted-foreground">{result.failed ? `${result.failed} couldn’t be added (see below)` : 'Everything went in'}{result.newCategories?.length ? ` · new categories: ${result.newCategories.join(', ')}` : ''}</p>
              </div>
            </div>
            {result.failed > 0 && (
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {result.results.filter((r) => !r.ok).map((r) => (
                  <li key={r.row} className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs dark:bg-rose-400/10">
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" /><span className="font-medium">Row {r.row} · {r.name || '—'}</span><span className="text-rose-700 dark:text-rose-300">{r.error}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setRows(null); setResult(null) }} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Upload more</button>
              <button type="button" onClick={onClose} className="h-10 rounded-lg bg-foreground px-5 text-sm font-semibold text-background">Done</button>
            </div>
          </motion.div>
        ) : !rows ? (
          <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void onFile(e.dataTransfer.files?.[0]) }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-[#e01a00] text-white shadow-lg"><FileSpreadsheet className="h-7 w-7" /></span>
              <p className="text-sm font-semibold">Drop a CSV here or choose a file</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 px-4 text-sm font-semibold text-white"><Upload className="h-4 w-4" /> Choose file</button>
              <input ref={fileRef} type="file" accept=".csv,text/csv,.txt" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
              <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} placeholder="…or paste rows from Excel / Google Sheets (with the heading row)"
                className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" disabled={!paste.trim()} onClick={() => load(paste)} className="flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-40"><ClipboardPaste className="h-4 w-4" /> Check pasted rows</button>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="text-sm font-semibold text-foreground">Columns</p>
              <p><b className="text-foreground">Name, Price, Category</b> — required</p>
              <p><b className="text-foreground">Type</b> — Veg or Non-Veg</p>
              <p><b className="text-foreground">Available</b> — Yes / No</p>
              <p><b className="text-foreground">Description, Image URL</b> — optional</p>
              <button type="button" onClick={template} className="mt-auto flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card font-semibold text-foreground hover:bg-muted"><Download className="h-4 w-4" /> Template</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="check" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{good.length} ready</span>
              {rows.length - good.length > 0 && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{rows.length - good.length} will be skipped</span>}
              {newCats.length > 0 && (
                <label className={cn('flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs', createMissing ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200' : 'border-border text-muted-foreground')}>
                  <input type="checkbox" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} className="accent-[#e01a00]" />
                  Create new categories: {newCats.join(', ')}
                </label>
              )}
            </div>
            <div className="max-h-[46vh] overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">#</th><th className="px-3 py-2">Dish</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isNew = r.item.category && !known.has(r.item.category.trim().toLowerCase())
                    return (
                      <tr key={r.n} className={cn('border-t border-border/60', r.problems.length && 'bg-rose-50/60 dark:bg-rose-400/5')}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{r.n}</td>
                        <td className="px-3 py-2 font-medium">{r.item.name || '—'}{r.item.available === false && <span className="ml-1.5 text-[10px] text-amber-600">out of stock</span>}</td>
                        <td className="px-3 py-2 tabular-nums">{Number.isFinite(r.item.price) ? `₹${r.item.price}` : '—'}</td>
                        <td className="px-3 py-2 text-xs">{r.item.category || '—'}{isNew && <span className="ml-1.5 rounded bg-amber-100 px-1 text-[9px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">new</span>}</td>
                        <td className="px-3 py-2 text-xs">{r.item.itemType === 'NON_VEG' ? '🔴 Non-veg' : '🟢 Veg'}</td>
                        <td className="px-3 py-2 text-xs">{r.problems.length ? <span className="inline-flex items-center gap-1 text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />{r.problems.join(' · ')}</span> : <span className="text-emerald-600">Ready</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRows(null)} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Back</button>
              <button type="button" disabled={!good.length || upload.isPending}
                onClick={() => upload.mutate({ items: good.map((r) => r.item), createMissing }, { onSuccess: setResult })}
                className="btn-shine flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-semibold text-white shadow-md disabled:opacity-50">
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Add {good.length} dish{good.length === 1 ? '' : 'es'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
