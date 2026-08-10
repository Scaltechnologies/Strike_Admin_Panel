const COL_WIDTHS = ['w-12', 'w-36', 'w-24', 'w-24', 'w-32', 'w-24']

export function UserTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
        {COL_WIDTHS.map((w, i) => (
          <div key={i} className={`h-3.5 rounded bg-muted animate-pulse ${w}`} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: 8 }).map((_, row) => (
        <div
          key={row}
          className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0"
        >
          <div className="h-4 w-4 rounded bg-muted/60 animate-pulse" />
          {COL_WIDTHS.map((w, col) => (
            <div
              key={col}
              className={`h-4 rounded bg-muted/60 animate-pulse ${w}`}
              style={{ animationDelay: `${row * 60 + col * 30}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
