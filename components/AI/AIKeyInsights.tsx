/**
 * AI Key Insights Component
 * Compact version showing top data insights
 * Designed to be shown at the top of the page
 */

import { Brain } from "lucide-react";

type AIKeyInsightsProps = {
  whatDataTellsUs: string[];
  category?: string;
};

export default function AIKeyInsights({
  whatDataTellsUs,
  category,
}: AIKeyInsightsProps) {
  if (!whatDataTellsUs || whatDataTellsUs.length === 0) return null;

  // Show only first 2-3 key insights to keep it compact
  const topInsights = whatDataTellsUs.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              🧠 AI Key Insights
            </h3>
            {category && (
              <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-300">
                {category}
              </span>
            )}
          </div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {topInsights.map((insight, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              {index + 1}
            </span>
            <span className="text-sm sm:text-base text-slate-800 leading-relaxed">
              {insight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
