export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-20 h-4 rounded-full" />
      </div>
      <Skeleton className="w-24 h-8 rounded-lg" />
      <Skeleton className="w-16 h-4 rounded-lg" />
    </div>
  )
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-40 h-4 rounded-lg" />
            <Skeleton className="w-24 h-3 rounded-lg" />
          </div>
          <Skeleton className="w-20 h-8 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-16 h-3 rounded-lg" />
      </div>
      <Skeleton className="w-16 h-8 rounded-lg" />
    </div>
  )
}
