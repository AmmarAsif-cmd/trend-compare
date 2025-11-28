// components/CompareStats.tsx

type CompareStatsProps = {
  totalSearches: number;   // raw total for both
  aLabel: string;
  bLabel: string;
  aShare: number;          // can be 0–1 or 0–100
  bShare: number;          // same as above
};

function formatTotalSearches(n: number): string {
  if (n >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return `${v.toFixed(v >= 10 ? 0 : 1)}B`;
  }
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v.toFixed(v >= 10 ? 0 : 1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v.toFixed(v >= 10 ? 0 : 1)}K`;
  }
  return `${n}`;
}

function formatPercent(n: number): string {
  const value = n <= 1 ? n * 100 : n;
  return `${Math.round(value)}%`;
}

export default function CompareStats({
  totalSearches,
  aLabel,
  bLabel,
  aShare,
  bShare,
}: CompareStatsProps) {
  const aPercent = aShare <= 1 ? aShare * 100 : aShare;
  const bPercent = bShare <= 1 ? bShare * 100 : bShare;

  return (
    <div className="space-y-6">
      {/* Progress bars */}
      <div className="space-y-4">
        <div className="group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-blue-600">{aLabel}</span>
            <span className="text-sm font-bold text-blue-600 transition-transform group-hover:scale-110">{formatPercent(aShare)}</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${aPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
        <div className="group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-purple-600">{bLabel}</span>
            <span className="text-sm font-bold text-purple-600 transition-transform group-hover:scale-110">{formatPercent(bShare)}</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${bPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* A share */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 text-center border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-default">
          <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-2 uppercase tracking-wide">
            {aLabel}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1 group-hover:scale-110 transition-transform">
            {formatPercent(aShare)}
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-600">
            Search Interest
          </div>
        </div>

        {/* B share */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-5 text-center border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-default">
          <div className="text-xs sm:text-sm text-purple-600 font-semibold mb-2 uppercase tracking-wide">
            {bLabel}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-1 group-hover:scale-110 transition-transform">
            {formatPercent(bShare)}
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-600">
            Search Interest
          </div>
        </div>
      </div>

      <p className="text-center text-xs sm:text-sm text-slate-500 mt-2">
        Percentages show relative search interest. Higher % means more popular in searches.
      </p>
    </div>
  );
}
