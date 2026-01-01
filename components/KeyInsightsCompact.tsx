/**
 * Key Insights Compact
 * Shows 3 bullets max of key insights
 */

'use client';

interface KeyInsightsCompactProps {
  insights: string[];
  category?: string;
}

export default function KeyInsightsCompact({
  insights,
  category,
}: KeyInsightsCompactProps) {
  if (!insights || insights.length === 0) return null;

  const displayInsights = insights.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-sm p-4 sm:p-5">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full" />
        Key Insights
      </h3>
      <ul className="space-y-2">
        {displayInsights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-purple-600 mt-1 flex-shrink-0">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

