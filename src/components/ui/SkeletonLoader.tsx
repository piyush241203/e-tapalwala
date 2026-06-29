'use client';

// ─── Primitive skeleton block ─────────────────────────────────────────────────
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`skeleton-pulse rounded-lg ${className}`} style={style} />
  );
}

// ─── Stat card skeleton ───────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="stat-card flex-col items-start gap-3 p-5">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="w-full space-y-2">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ─── Table row skeleton ───────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3 border-b border-gray-50">
          <Skeleton className={`h-4 ${i === 0 ? 'w-32' : i % 3 === 0 ? 'w-16' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Table skeleton (header + rows) ──────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <Skeleton className="h-3 w-20 bg-gray-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Dashboard grid skeleton ─────────────────────────────────────────────────
export function DashboardStatsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={`grid gap-4 ${
      count <= 4
        ? 'grid-cols-2 md:grid-cols-4'
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
    }`}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────
export function ChartSkeleton() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-40" />
      <div className="flex items-end gap-2 h-40 pt-4">
        {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Card skeleton ────────────────────────────────────────────────────────────
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}

// ─── Action card skeleton ─────────────────────────────────────────────────────
export function ActionCardSkeleton() {
  return (
    <div className="card flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}
