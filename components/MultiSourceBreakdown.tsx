'use client';

import { BarChart3, TrendingUp } from 'lucide-react';
import ScoreBreakdownTooltip from './ScoreBreakdownTooltip';

type SourceScore = {
  name: string;
  termA: number;
  termB: number;
  weight?: number;
};

type Props = {
  termA: string;
  termB: string;
  scoreA: number;
  scoreB: number;
  sources: SourceScore[];
  category: string;
  breakdownA?: {
    searchInterest: number;
    socialBuzz: number;
    authority: number;
    momentum: number;
  };
  breakdownB?: {
    searchInterest: number;
    socialBuzz: number;
    authority: number;
    momentum: number;
  };
};

export default function MultiSourceBreakdown({
  termA,
  termB,
  scoreA,
  scoreB,
  sources,
  category,
  breakdownA,
  breakdownB,
}: Props) {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      movies: '🎬 Movies',
      music: '🎵 Music',
      games: '🎮 Games',
      products: '🛒 Products',
      tech: '💻 Tech',
      people: '👤 People',
      brands: '🏢 Brands',
    };
    return labels[cat] || '📊 General';
  };

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 flex-1">
          <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Multi-Source Score Breakdown
          </h3>
        </div>
        <span className="text-xs sm:text-sm text-slate-500 sm:ml-auto">
          {getCategoryLabel(category)}
        </span>
      </div>

      {/* Final Scores Comparison */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <div className="text-xs sm:text-sm text-slate-600 mb-1 truncate">{formatTerm(termA)}</div>
          <div className="flex items-center justify-center gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{scoreA}</div>
            {breakdownA && (
              <ScoreBreakdownTooltip
                overallScore={scoreA}
                breakdown={breakdownA}
                category={category}
                termName={formatTerm(termA)}
              />
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">TrendArc Score</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-sm text-slate-600 mb-1 truncate">{formatTerm(termB)}</div>
          <div className="flex items-center justify-center gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{scoreB}</div>
            {breakdownB && (
              <ScoreBreakdownTooltip
                overallScore={scoreB}
                breakdown={breakdownB}
                category={category}
                termName={formatTerm(termB)}
              />
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">TrendArc Score</div>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="space-y-3 sm:space-y-4">
        <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
          Score Components:
        </div>

        {sources
          .filter((source) => {
            // Hide social buzz if both scores are 50 (indicates no data)
            if (source.name.toLowerCase().includes('social buzz')) {
              return !(source.termA === 50 && source.termB === 50);
            }
            return true;
          })
          .map((source, idx) => {
          const maxScore = Math.max(source.termA, source.termB, 1);
          const widthA = (source.termA / maxScore) * 100;
          const widthB = (source.termB / maxScore) * 100;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs">
                <span className="font-medium text-slate-700">
                  {source.name}
                  {source.weight && (
                    <span className="ml-1 text-slate-400 hidden sm:inline">
                      ({Math.round(source.weight * 100)}% weight)
                    </span>
                  )}
                </span>
                <div className="flex gap-3 sm:gap-4 text-slate-500">
                  <span className="font-medium">{source.termA.toFixed(0)}</span>
                  <span className="font-medium">{source.termB.toFixed(0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Term A Bar */}
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${widthA}%` }}
                  >
                    {widthA > 20 && (
                      <span className="text-xs font-semibold text-white">
                        {source.termA.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Term B Bar */}
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${widthB}%` }}
                  >
                    {widthB > 20 && (
                      <span className="text-xs font-semibold text-white">
                        {source.termB.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex gap-2 items-start">
          <TrendingUp className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <span className="font-semibold">How it works:</span> Each data source is scored 0-100,
            then weighted based on the comparison category ({category}).
            The final TrendArc Score combines all sources using category-specific weights.
          </p>
        </div>
      </div>
    </div>
  );
}
