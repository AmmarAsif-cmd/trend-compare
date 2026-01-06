import type { ParsedKeepaData } from "@/lib/services/keepa/types";

interface Props {
  keepaData: ParsedKeepaData;
}

export default function CompetitionMetrics({ keepaData }: Props) {
  // Calculate competition level based on sales rank and reviews
  const salesRank = keepaData.currentSalesRank || keepaData.averageSalesRank;
  const reviewCount = keepaData.reviewCount || 0;

  let competitionLevel: "low" | "medium" | "high" = "medium";
  let competitionColor = "text-yellow-600";
  let competitionBg = "bg-yellow-100";
  let competitionBorder = "border-yellow-300";

  if (salesRank && salesRank < 10000 && reviewCount > 1000) {
    competitionLevel = "high";
    competitionColor = "text-red-600";
    competitionBg = "bg-red-100";
    competitionBorder = "border-red-300";
  } else if (salesRank && salesRank > 50000 && reviewCount < 500) {
    competitionLevel = "low";
    competitionColor = "text-green-600";
    competitionBg = "bg-green-100";
    competitionBorder = "border-green-300";
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">
        ⚔️ Competition Analysis
      </h2>

      <div className={`${competitionBg} ${competitionBorder} border-2 rounded-xl p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-600 mb-1">
              Competition Level
            </div>
            <div className={`text-3xl font-bold ${competitionColor} uppercase`}>
              {competitionLevel}
            </div>
          </div>
          <div className="text-5xl">
            {competitionLevel === "low" ? "🟢" : competitionLevel === "high" ? "🔴" : "🟡"}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Sales Rank</div>
          <div className="text-2xl font-bold text-slate-900">
            {salesRank ? `#${salesRank.toLocaleString()}` : "N/A"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {salesRank && salesRank < 10000
              ? "Very competitive"
              : salesRank && salesRank < 50000
              ? "Moderately competitive"
              : "Lower competition"}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Total Reviews</div>
          <div className="text-2xl font-bold text-slate-900">
            {reviewCount.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {reviewCount > 1000
              ? "High market saturation"
              : reviewCount > 100
              ? "Established market"
              : "New market opportunity"}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm">
          💡 Competition Insights
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          {competitionLevel === "low" && (
            <>
              <li>✓ Lower competition makes it easier to rank</li>
              <li>✓ Less advertising spend needed to compete</li>
              <li>✓ Good opportunity for new sellers</li>
            </>
          )}
          {competitionLevel === "medium" && (
            <>
              <li>• Moderate competition requires differentiation</li>
              <li>• Focus on unique value proposition</li>
              <li>• Consider improving on existing products</li>
            </>
          )}
          {competitionLevel === "high" && (
            <>
              <li>⚠ High competition requires significant investment</li>
              <li>⚠ Difficult for new sellers to gain traction</li>
              <li>⚠ Consider finding a less competitive niche</li>
            </>
          )}
        </ul>
      </div>
    </section>
  );
}
