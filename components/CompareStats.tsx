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
  return (
    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-center">
        {/* Total searches */}
        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
            {formatTotalSearches(totalSearches)}
          </div>
          <div className="text-xs sm:text-sm text-slate-500">
            Total searches
          </div>
        </div>

        {/* A share */}
        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
            {formatPercent(aShare)}
          </div>
          <div className="text-xs sm:text-sm text-slate-500">
            {aLabel} share
          </div>
        </div>

        {/* B share */}
        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
            {formatPercent(bShare)}
          </div>
          <div className="text-xs sm:text-sm text-slate-500">
            {bLabel} share
          </div>
        </div>
      </div>
    </div>
  );
}
