import { useState } from 'react'
import { Download, Banknote, Percent, ArrowDownCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { reportsApi } from './api/reports.api'

interface ReportCard {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  download: () => Promise<void>
  filename: string
}

const REPORTS: ReportCard[] = [
  {
    id: 'payments',
    title: 'Payments Report',
    description: 'All payment transactions including status, method, amount, and refunds.',
    icon: Banknote,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
    download: () => reportsApi.downloadPayments(),
    filename: 'payments.csv',
  },
  {
    id: 'commissions',
    title: 'Commissions Report',
    description: 'Vendor commission records including settled and pending amounts.',
    icon: Percent,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400',
    download: () => reportsApi.downloadCommissions(),
    filename: 'commissions.csv',
  },
  {
    id: 'withdrawals',
    title: 'Withdrawals Report',
    description: 'All vendor withdrawal requests with approval status and bank details.',
    icon: ArrowDownCircle,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
    download: () => reportsApi.downloadWithdrawals(),
    filename: 'withdrawals.csv',
  },
]

export function ReportsPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<Record<string, boolean>>({})

  async function handleDownload(report: ReportCard) {
    setLoading((p) => ({ ...p, [report.id]: true }))
    try {
      await report.download()
      setDone((p) => ({ ...p, [report.id]: true }))
      toast.success(`${report.filename} downloaded.`)
      setTimeout(() => setDone((p) => ({ ...p, [report.id]: false })), 3000)
    } catch {
      toast.error(`Failed to download ${report.filename}.`)
    } finally {
      setLoading((p) => ({ ...p, [report.id]: false }))
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Export platform data as CSV files</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon
          const isLoading = loading[report.id]
          const isDone = done[report.id]
          return (
            <div key={report.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${report.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{report.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{report.description}</p>
              <div className="mt-4">
                <span className="mb-2 block text-xs text-muted-foreground">Format: CSV</span>
                <button
                  onClick={() => void handleDownload(report)}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Downloaded
                    </>
                  ) : isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Downloading…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          Reports are generated in real-time from the database. Large datasets may take a few seconds to download.
          Files are exported in UTF-8 CSV format compatible with Excel and Google Sheets.
        </p>
      </div>
    </div>
  )
}
