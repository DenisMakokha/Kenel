import { cn } from "../../lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "rectangular"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded h-4",
        variant === "rectangular" && "rounded-lg",
        variant === "default" && "rounded-md",
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton patterns
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-slate-200 bg-slate-50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-slate-100 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-white">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4", `grid-cols-${Math.min(count, 4)}`, "md:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton variant="circular" className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-4" />
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Stats */}
      <SkeletonStats count={4} />
      
      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList, 
  SkeletonStats, 
  SkeletonForm,
  SkeletonDashboard 
}
