/**
 * Search Interest Breakdown
 * Shows how search interest varies across different periods
 */

type DataPoint = {
  date: string;
  [key: string]: string | number;
};

type SearchBreakdownProps = {
  series: DataPoint[];
  termA: string;
  termB: string;
};

type QuarterData = {
  label: string;
  period: string;
  avgA: number;
  avgB: number;
  leader: string;
  gap: number;
};

export default function SearchBreakdown({ series, termA, termB }: SearchBreakdownProps) {
  if (series.length < 12) return null; // Need enough data

  // Calculate quarterly averages
  const quarters: QuarterData[] = [];
  const quarterSize = Math.floor(series.length / 4);

  for (let i = 0; i < 4; i++) {
    const start = i * quarterSize;
    const end = i === 3 ? series.length : (i + 1) * quarterSize;
    const quarterData = series.slice(start, end);

    const avgA =
      quarterData.reduce((sum, point) => sum + (Number(point[termA]) || 0), 0) /
      quarterData.length;
    const avgB =
      quarterData.reduce((sum, point) => sum + (Number(point[termB]) || 0), 0) /
      quarterData.length;

    const startDate = new Date(quarterData[0].date);
    const endDate = new Date(quarterData[quarterData.length - 1].date);

    quarters.push({
      label: `Q${i + 1}`,
      period: `${startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`,
      avgA: Math.round(avgA),
      avgB: Math.round(avgB),
      leader: avgA > avgB ? termA : termB,
      gap: Math.abs(Math.round(avgA - avgB)),
    });
  }

  return (
    <section className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
          Search Interest Breakdown
        </h2>
        <p className="text-sm text-slate-600">
          How interest levels changed across different periods
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quarters.map((q, idx) => (
          <div
            key={q.label}
            className="relative rounded-lg border-2 border-slate-200 bg-white p-4 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">{q.label}</span>
              <span className="text-xs text-slate-400">{q.period}</span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">{termA}</span>
                <span className="text-sm font-bold text-blue-600">{q.avgA}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">{termB}</span>
                <span className="text-sm font-bold text-purple-600">{q.avgB}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-600">
                <span className="font-semibold">{q.leader}</span> led by{' '}
                <span className="font-bold text-slate-900">{q.gap} points</span>
              </p>
            </div>

            {/* Trend indicator */}
            {idx > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                {quarters[idx].avgA + quarters[idx].avgB >
                quarters[idx - 1].avgA + quarters[idx - 1].avgB ? (
                  <span className="text-white text-xs">↑</span>
                ) : (
                  <span className="text-white text-xs">↓</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-slate-700">
          💡 <span className="font-semibold">Insight:</span> Compare how interest evolved over
          time. Green arrows indicate overall growth in that quarter.
        </p>
      </div>
    </section>
  );
}
