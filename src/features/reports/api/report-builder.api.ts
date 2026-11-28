import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axiosInstance from '@/api/axios'

export type ReportType = 'daily' | 'sales' | 'refunds' | 'commissions' | 'settlement' | 'payouts' | 'customers' | 'cards' | 'redemptions'
export type ColType = 'text' | 'money' | 'number' | 'date' | 'percent' | 'status'

export interface ReportColumn {
  key: string
  label: string
  type: ColType
  total: boolean
}

export type ReportRow = Record<string, string | number | boolean | null>

export interface ReportResult {
  type: ReportType
  from: string
  to: string
  generatedAt: string
  columns: ReportColumn[]
  rows: ReportRow[]
  totalRows: number
  truncated: boolean
  totals: Record<string, number>
}

export interface DailyTotals {
  rows?: number
  sales?: number
  collected?: number
  online?: number
  at_store?: number
  refunded?: number
  commission?: number
  redeemed?: number
  visits?: number
  new_customers?: number
  new_vendors?: number
  paid_out?: number
}

export interface ReportSummary {
  from: string
  to: string
  previousFrom: string
  previousTo: string
  current: DailyTotals
  previous: DailyTotals
  series: ({ day: string } & DailyTotals)[]
}

const OPTS = { retry: 1, meta: { suppressError: true } } as const

export function useReportSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'summary', from, to],
    queryFn: () => axiosInstance.get<ReportSummary>('/api/admin/reports/summary', { params: { from, to } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    ...OPTS,
  })
}

export function useReport(type: ReportType | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'run', type, from, to],
    queryFn: () => axiosInstance.get<ReportResult>(`/api/admin/reports/run/${type}`, { params: { from, to } }).then((r) => r.data),
    enabled: !!type,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    ...OPTS,
  })
}

/** Downloads the full report (up to 50 000 rows) as the server-built CSV. */
export async function downloadReportCsv(type: ReportType, from: string, to: string): Promise<string> {
  const res = await axiosInstance.get(`/api/admin/reports/run/${type}`, { params: { from, to, format: 'csv' }, responseType: 'blob' })
  const name = `strike-${type}-${from}-to-${to}.csv`
  const href = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = href
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
  return name
}
