import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

function Cell({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('h-4 animate-pulse rounded bg-muted', className)} style={style} />
}

export function VendorTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['ID', 'Hotel / Vendor', 'Contact', 'Status', 'KYC', 'Commission', 'Registered'].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-border/60 last:border-b-0">
              <td className="px-4 py-3.5">
                <Cell className="w-10" style={{ animationDelay: `${i * 40}ms` }} />
              </td>
              <td className="px-4 py-3.5">
                <div className="space-y-1.5">
                  <Cell className="w-36" style={{ animationDelay: `${i * 40 + 20}ms` }} />
                  <Cell className="h-3 w-24" style={{ animationDelay: `${i * 40 + 40}ms` }} />
                </div>
              </td>
              <td className="px-4 py-3.5">
                <Cell className="w-28" style={{ animationDelay: `${i * 40 + 60}ms` }} />
              </td>
              <td className="px-4 py-3.5">
                <Cell className="h-5 w-20 rounded-full" style={{ animationDelay: `${i * 40 + 80}ms` }} />
              </td>
              <td className="px-4 py-3.5">
                <Cell className="h-5 w-20 rounded-full" style={{ animationDelay: `${i * 40 + 100}ms` }} />
              </td>
              <td className="px-4 py-3.5">
                <Cell className="w-12" style={{ animationDelay: `${i * 40 + 120}ms` }} />
              </td>
              <td className="px-4 py-3.5">
                <Cell className="w-24" style={{ animationDelay: `${i * 40 + 140}ms` }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
