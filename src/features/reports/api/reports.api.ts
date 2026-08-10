import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'

async function downloadCsv(url: string, filename: string): Promise<void> {
  const response = await axiosInstance.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data as BlobPart], { type: 'text/csv' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(href)
}

export const reportsApi = {
  downloadPayments: () => downloadCsv(ENDPOINTS.REPORTS.PAYMENTS_CSV, 'payments.csv'),
  downloadCommissions: () => downloadCsv(ENDPOINTS.REPORTS.COMMISSIONS_CSV, 'commissions.csv'),
  downloadWithdrawals: () => downloadCsv(ENDPOINTS.REPORTS.WITHDRAWALS_CSV, 'withdrawals.csv'),
}
