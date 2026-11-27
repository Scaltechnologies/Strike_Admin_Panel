import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Loader2, MessageCircle, RotateCcw, Sparkles, Upload, Users, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { downloadCsv, mapRows, parseTable } from './csv'
import { apiError, useCreateVendors, type NewVendorInput, type VendorCreateResult } from './onboarding.api'
import { generatePin, mobileProblem, normalizeMobile, pinProblem, welcomeMessage, whatsappLink } from './pin'

const FIELDS = {
  hotelName: ['business name', 'business', 'store name', 'store', 'hotel name', 'hotel', 'shop name', 'shop', 'name', 'hotel_name'],
  mobile: ['mobile', 'mobile number', 'phone', 'phone number', 'number', 'contact', 'mobile_number'],
  pin: ['pin', 'login pin', 'starting pin'],
  address: ['address', 'location', 'area'],
  email: ['email', 'email address', 'mail'],
  commission: ['commission', 'commission %', 'commission percent', 'commission_percent', 'fee'],
  latitude: ['latitude', 'lat'],
  longitude: ['longitude', 'lng', 'long', 'lon'],
} as const
type Field = keyof typeof FIELDS

interface Row {
  n: number
  input: NewVendorInput
  pinGenerated: boolean
  problems: string[]
}

const CHUNK = 20

export function VendorImportPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [paste, setPaste] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [skipBad, setSkipBad] = useState(true)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<(VendorCreateResult & { pin: string; n: number })[] | null>(null)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bulk = useCreateVendors()

  const load = (text: string, name: string) => {
    const table = parseTable(text)
    const { records, missing } = mapRows<Field>(table, FIELDS)
    const required = (['hotelName', 'mobile', 'address'] as Field[]).filter((f) => missing.includes(f))
    if (required.length) {
      toast.error(`Missing column${required.length > 1 ? 's' : ''}: ${required.map((f) => FIELDS[f][0]).join(', ')}. Use the template.`)
      return
    }
    if (records.length === 0) { toast.error('No vendor rows found in the file'); return }
    if (records.length > 200) { toast.error('Upload at most 200 vendors at a time'); return }
    const seen = new Map<string, number>()
    const out: Row[] = records.map((r, i) => {
      const problems: string[] = []
      const mobile = normalizeMobile(r.mobile)
      const pinGenerated = !r.pin
      const pin = r.pin ? r.pin.replace(/\D/g, '').padStart(r.pin.length === 3 ? 4 : r.pin.length, '0') : generatePin()
      if (!r.hotelName) problems.push('Business name missing')
      const m = mobileProblem(r.mobile); if (m) problems.push(m)
      const p = pinProblem(pin); if (p) problems.push(p)
      if (!r.address) problems.push('Address missing')
      if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(r.email)) problems.push('Email looks wrong')
      const c = r.commission === '' ? null : Number(r.commission.replace('%', ''))
      if (c != null && (!Number.isFinite(c) || c < 0 || c > 100)) problems.push('Commission must be 0–100')
      const lat = r.latitude === '' ? null : Number(r.latitude)
      const lng = r.longitude === '' ? null : Number(r.longitude)
      if ((lat == null) !== (lng == null) || (lat != null && !Number.isFinite(lat)) || (lng != null && !Number.isFinite(lng))) problems.push('Give both latitude and longitude, or neither')
      if (mobile && seen.has(mobile)) problems.push(`Same mobile as row ${seen.get(mobile)}`)
      else if (mobile) seen.set(mobile, i + 1)
      return {
        n: i + 1, pinGenerated, problems,
        input: { hotelName: r.hotelName, mobileNumber: mobile, pin, address: r.address, email: r.email || undefined, commissionRate: c, latitude: lat, longitude: lng },
      }
    })
    setRows(out)
    setFileName(name)
    setResults(null)
  }

  const onFile = async (file?: File | null) => {
    if (!file) return
    if (/\.xlsx?$/i.test(file.name)) { toast.error('Please save the Excel sheet as CSV (File → Save as → CSV), or paste the rows instead'); return }
    load(await file.text(), file.name)
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); void onFile(e.dataTransfer.files?.[0]) }

  const good = useMemo(() => (rows ?? []).filter((r) => r.problems.length === 0), [rows])
  const bad = (rows?.length ?? 0) - good.length
  const toSend = skipBad ? good : rows ?? []

  const start = async () => {
    if (!toSend.length) return
    setProgress({ done: 0, total: toSend.length })
    const all: (VendorCreateResult & { pin: string; n: number })[] = []
    for (let i = 0; i < toSend.length; i += CHUNK) {
      const chunk = toSend.slice(i, i + CHUNK)
      try {
        const res = await bulk.mutateAsync(chunk.map((r) => r.input))
        res.results.forEach((r, j) => all.push({ ...r, pin: chunk[j].input.pin, n: chunk[j].n, hotelName: chunk[j].input.hotelName }))
      } catch (e) {
        chunk.forEach((r) => all.push({ ok: false, error: apiError(e, 'Upload failed'), pin: r.input.pin, n: r.n, hotelName: r.input.hotelName, mobileNumber: r.input.mobileNumber }))
      }
      setProgress({ done: Math.min(i + CHUNK, toSend.length), total: toSend.length })
    }
    setResults(all)
    setProgress(null)
    const ok = all.filter((r) => r.ok).length
    if (ok) toast.success(`${ok} vendor${ok === 1 ? '' : 's'} added`)
  }

  const template = () => downloadCsv('strike-vendors-template.csv', [
    ['Business name', 'Mobile', 'PIN', 'Address', 'Email', 'Commission %', 'Latitude', 'Longitude'],
    ['Annapurna Mess', '9876543210', '4826', '12 Temple Street, Guntur', 'owner@annapurna.in', '5', '16.3067', '80.4365'],
    ['Tea Point', '9123456780', '', 'Bus stand, Vijayawada', '', '', '', ''],
  ])
  const created = results?.filter((r) => r.ok) ?? []
  const failed = results?.filter((r) => !r.ok) ?? []
  const downloadSheet = () => downloadCsv('strike-vendor-sign-ins.csv', [
    ['Business name', 'Mobile', 'PIN', 'Vendor ID', 'Store ID'],
    ...created.map((r) => [r.hotelName ?? '', r.mobileNumber ?? '', r.pin, r.vendorId ?? '', r.storeId ?? '']),
  ])
  const copyAll = async () => {
    await navigator.clipboard.writeText(created.map((r) => welcomeMessage({ hotelName: r.hotelName ?? '', mobileNumber: r.mobileNumber ?? '', pin: r.pin })).join('\n\n———\n\n'))
    toast.success('All messages copied')
  }
  const reset = () => { setRows(null); setResults(null); setFileName(''); setPaste('') }
  const step = results ? 3 : rows ? 2 : 1

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <Link to="/vendors" className="inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Vendors
      </Link>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-teal-500 to-cyan-700 shadow-lg shadow-teal-600/40"><Users className="h-6 w-6" /></span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Add vendors in bulk</h1>
              <p className="mt-1 max-w-xl text-sm text-white/60">Fill the template, upload it, and every vendor gets an approved store and a sign-in PIN. Leave PIN empty and we’ll pick a safe one.</p>
            </div>
          </div>
          <ol className="flex items-center gap-2 text-xs font-semibold">
            {['Upload', 'Check', 'Done'].map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border transition-colors', step > i + 1 ? 'border-emerald-400 bg-emerald-400 text-black' : step === i + 1 ? 'border-white bg-white text-black' : 'border-white/30 text-white/50')}>
                  {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <span className={step >= i + 1 ? 'text-white' : 'text-white/50'}>{s}</span>
                {i < 2 && <span className="h-px w-6 bg-white/25" />}
              </li>
            ))}
          </ol>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
              className={cn('relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition-colors lg:col-span-2',
                drag ? 'border-primary bg-primary/5' : 'border-border bg-card')}>
              <motion.span animate={{ y: drag ? -6 : [0, -6, 0] }} transition={drag ? {} : { duration: 2.4, repeat: Infinity }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                <FileSpreadsheet className="h-8 w-8" />
              </motion.span>
              <p className="text-base font-semibold text-foreground">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground">or</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 px-4 text-sm font-semibold text-white shadow-md">
                  <Upload className="h-4 w-4" /> Choose file
                </button>
                <button type="button" onClick={() => setShowPaste((s) => !s)} className="flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
                  <ClipboardPaste className="h-4 w-4" /> Paste from Excel
                </button>
              </div>
              <input ref={fileRef} type="file" accept=".csv,text/csv,.txt" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
              <AnimatePresence>
                {showPaste && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full overflow-hidden">
                    <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={6} placeholder="Copy the rows (with the heading row) from Excel or Google Sheets and paste here"
                      className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button type="button" disabled={!paste.trim()} onClick={() => load(paste, 'Pasted rows')} className="mt-2 h-9 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40">Check these rows</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-amber-500" /> How it works</p>
              <ol className="space-y-2.5 text-sm text-muted-foreground">
                <li><span className="font-semibold text-foreground">1.</span> Download the template and fill one vendor per row.</li>
                <li><span className="font-semibold text-foreground">2.</span> Required: business name, mobile, address. PIN is optional (we’ll generate one).</li>
                <li><span className="font-semibold text-foreground">3.</span> Save as CSV and upload — we check every row before anything is created.</li>
                <li><span className="font-semibold text-foreground">4.</span> Download the sign-in sheet or send each vendor a WhatsApp message.</li>
              </ol>
              <button type="button" onClick={template} className="mt-auto flex h-10 items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted">
                <Download className="h-4 w-4" /> Download template
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && rows && (
          <motion.div key="check" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{fileName}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{good.length} ready</span>
              {bad > 0 && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{bad} need fixing</span>}
              {bad > 0 && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={skipBad} onChange={(e) => setSkipBad(e.target.checked)} className="accent-[#e01a00]" /> Skip rows that need fixing
                </label>
              )}
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={reset} className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"><RotateCcw className="h-4 w-4" /> Start over</button>
                <button type="button" disabled={!toSend.length || !!progress} onClick={() => void start()}
                  className="btn-shine flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-sm font-semibold text-white shadow-md disabled:opacity-50">
                  {progress ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Add {toSend.length} vendor{toSend.length === 1 ? '' : 's'}
                </button>
              </div>
            </div>
            {progress && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex justify-between text-xs text-muted-foreground"><span>Creating stores and sign-ins…</span><span className="tabular-nums">{progress.done} / {progress.total}</span></div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600" animate={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5">#</th><th className="px-3 py-2.5">Business</th><th className="px-3 py-2.5">Mobile</th><th className="px-3 py-2.5">PIN</th>
                    <th className="px-3 py-2.5">Address</th><th className="px-3 py-2.5">Commission</th><th className="px-3 py-2.5">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <motion.tr key={r.n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 30) * 0.015 }}
                      className={cn('border-b border-border/60 last:border-0', r.problems.length && 'bg-rose-50/50 dark:bg-rose-400/5')}>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.n}</td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{r.input.hotelName || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.input.mobileNumber || '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.input.pin}{r.pinGenerated && <span className="ml-1.5 rounded bg-amber-100 px-1 text-[9px] font-sans font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">auto</span>}</td>
                      <td className="max-w-[260px] truncate px-3 py-2.5 text-xs text-muted-foreground">{r.input.address || '—'}</td>
                      <td className="px-3 py-2.5 text-xs">{r.input.commissionRate != null ? `${r.input.commissionRate}%` : '—'}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {r.problems.length === 0
                          ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Ready</span>
                          : <span className="inline-flex items-start gap-1 font-medium text-rose-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{r.problems.join(' · ')}</span>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {step === 3 && results && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Big icon={CheckCircle2} tone="from-emerald-400 to-teal-600" value={created.length} label="vendors added — stores live" />
              <Big icon={XCircle} tone="from-rose-400 to-red-600" value={failed.length} label="couldn’t be added" />
              <div className="flex flex-col justify-center gap-2 rounded-2xl border border-border bg-card p-4">
                <button type="button" disabled={!created.length} onClick={downloadSheet} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 text-sm font-semibold text-white disabled:opacity-40"><Download className="h-4 w-4" /> Download sign-in sheet</button>
                <button type="button" disabled={!created.length} onClick={() => void copyAll()} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-40"><ClipboardPaste className="h-4 w-4" /> Copy all welcome messages</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5">#</th><th className="px-3 py-2.5">Business</th><th className="px-3 py-2.5">Mobile</th><th className="px-3 py-2.5">PIN</th><th className="px-3 py-2.5">Result</th><th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <motion.tr key={`${r.n}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 30) * 0.02 }} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.n}</td>
                      <td className="px-3 py-2.5 font-medium">
                        {r.ok && r.vendorId ? <Link to="/vendors/$vendorId" params={{ vendorId: String(r.vendorId) }} search={{ tab: undefined }} className="hover:text-primary hover:underline">{r.hotelName}</Link> : r.hotelName}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.mobileNumber}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.ok ? r.pin : '—'}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {r.ok ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Added</span>
                          : <span className="inline-flex items-center gap-1 font-medium text-rose-600"><XCircle className="h-3.5 w-3.5" /> {r.error}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {r.ok && r.mobileNumber && (
                          <a href={whatsappLink(r.mobileNumber, welcomeMessage({ hotelName: r.hotelName ?? '', mobileNumber: r.mobileNumber, pin: r.pin }))} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1 text-[11px] font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={reset} className="self-start text-sm font-medium text-primary hover:underline">Upload another file</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Big({ icon: Icon, tone, value, label }: { icon: typeof Users; tone: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', tone)}><Icon className="h-6 w-6" /></span>
      <div>
        <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-extrabold tabular-nums text-foreground">{value}</motion.p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default VendorImportPage
