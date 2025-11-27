// components/Skeleton.tsx

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 2s infinite',
      }}
    />
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50/30 to-white">
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg p-5 sm:p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsightCardSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg p-5 sm:p-6">
      <Skeleton className="h-5 w-32 mb-3" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6 mt-2" />
    </div>
  );
}

export function TermAnalysisSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/70 via-white to-slate-50/40 shadow-lg p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-3 w-48 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
