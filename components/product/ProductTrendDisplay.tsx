"use client";

import type { ProductTrendData } from "@/lib/services/product/trends";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  trendData: ProductTrendData | null;
  isLoading?: boolean;
}

export default function ProductTrendDisplay({ trendData, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          📈 Search Trend Analysis
        </h2>
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading trend data...</span>
        </div>
      </section>
    );
  }

  if (!trendData) {
    return null;
  }

  const trendIcon =
    trendData.trend === "rising" ? (
      <TrendingUp className="w-6 h-6 text-green-600" />
    ) : trendData.trend === "falling" ? (
      <TrendingDown className="w-6 h-6 text-red-600" />
    ) : (
      <Minus className="w-6 h-6 text-slate-400" />
    );

  const trendColor =
    trendData.trend === "rising"
      ? "text-green-600 bg-green-100 border-green-300"
      : trendData.trend === "falling"
      ? "text-red-600 bg-red-100 border-red-300"
      : "text-slate-600 bg-slate-100 border-slate-300";

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">
        📈 Search Trend Analysis
      </h2>

      <div className="space-y-4">
        {/* Trend Summary */}
        <div className={`${trendColor} border-2 rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">
                Trend Direction
              </div>
              <div className="text-3xl font-bold uppercase">{trendData.trend}</div>
            </div>
            <div className="text-4xl">{trendIcon}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-xs text-slate-600 mb-1">Growth Rate</div>
              <div className="text-lg font-bold">
                {trendData.growthRate > 0 ? "+" : ""}
                {trendData.growthRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Search Volume</div>
              <div className="text-lg font-bold">
                {trendData.searchVolume.toLocaleString()}/mo
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Peak Value</div>
              <div className="text-lg font-bold">{Math.round(trendData.peakValue)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Current Value</div>
              <div className="text-lg font-bold">{Math.round(trendData.currentValue)}</div>
            </div>
          </div>
        </div>

        {/* Trend Insights */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-2 text-sm">
            💡 Trend Insights
          </h3>
          <ul className="space-y-1 text-sm text-slate-700">
            {trendData.trend === "rising" && (
              <>
                <li>✓ Search interest is growing - good time to enter market</li>
                <li>✓ Increasing demand suggests opportunity for new sellers</li>
                <li>✓ Consider launching before market saturates</li>
              </>
            )}
            {trendData.trend === "falling" && (
              <>
                <li>⚠ Search interest is declining - market may be saturated</li>
                <li>⚠ Consider finding a niche within this category</li>
                <li>⚠ May need strong differentiation to compete</li>
              </>
            )}
            {trendData.trend === "stable" && (
              <>
                <li>• Stable demand indicates consistent market</li>
                <li>• Lower risk but also lower growth potential</li>
                <li>• Focus on quality and customer service to compete</li>
              </>
            )}
            {trendData.searchVolume > 50000 && (
              <li className="text-amber-600">
                ⚠ High search volume indicates competitive market
              </li>
            )}
            {trendData.searchVolume < 10000 && trendData.searchVolume > 0 && (
              <li className="text-blue-600">
                ℹ Lower search volume may mean niche opportunity
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

