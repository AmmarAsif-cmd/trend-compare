// components/CompareTable.tsx
"use client";

type Row = {
  term: string;
  avg: number;            // average over the timeframe
  peakValue: number;      // highest point
  peakDate: string;       // YYYY-MM-DD
  momentumPct: number;    // recent change vs early period (percent)
  latest: number;         // last point
};

function formatPct(x: number) {
  const s = `${x >= 0 ? "+" : ""}${Math.round(x)}%`;
  return s;
}

export default function CompareTable({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="text-left px-4 py-3">Term</th>
            <th className="text-right px-4 py-3">Average</th>
            <th className="text-right px-4 py-3">Latest</th>
            <th className="text-right px-4 py-3">Momentum</th>
            <th className="text-right px-4 py-3">Peak</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.term} className="text-slate-800">
              <td className="px-4 py-3 font-medium">{r.term}</td>
              <td className="px-4 py-3 text-right">{Math.round(r.avg)}</td>
              <td className="px-4 py-3 text-right">{Math.round(r.latest)}</td>
              <td className="px-4 py-3 text-right">
                <span className={r.momentumPct >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {formatPct(r.momentumPct)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {r.peakValue} on <span className="tabular-nums">{r.peakDate}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
