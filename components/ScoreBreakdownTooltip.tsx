"use client";

import { Info, TrendingUp, Users, Award, Zap, HelpCircle } from "lucide-react";
import { useState } from "react";

type ScoreBreakdown = {
  searchInterest: number;
  socialBuzz: number;
  authority: number;
  momentum: number;
};

type ScoreBreakdownTooltipProps = {
  overallScore: number;
  breakdown: ScoreBreakdown;
  category: string;
  termName: string;
};

/**
 * Score Breakdown Tooltip Component
 * 
 * Interactive tooltip explaining TrendArc Score calculation
 * Shows breakdown of each component with explanations
 * 
 * Mobile-friendly with touch support
 */
export default function ScoreBreakdownTooltip({
  overallScore,
  breakdown,
  category,
  termName,
}: ScoreBreakdownTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const components = [
    {
      name: "Search Interest",
      value: breakdown.searchInterest,
      weight: 40,
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
      description: "Google Trends search volume (0-100 scale). Primary indicator of public interest.",
    },
    {
      name: "Social Buzz",
      value: breakdown.socialBuzz,
      weight: 30,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      description: "YouTube views, Spotify streams, social engagement. Measures online conversation.",
    },
    {
      name: "Authority",
      value: breakdown.authority,
      weight: 20,
      icon: Award,
      color: "from-emerald-500 to-emerald-600",
      description: "Ratings, reviews, and quality metrics from TMDB, Steam, Best Buy, etc.",
    },
    {
      name: "Momentum",
      value: breakdown.momentum,
      weight: 10,
      icon: Zap,
      color: "from-amber-500 to-orange-600",
      description: "Recent growth rate and trend direction. Shows if interest is rising or falling.",
    },
  ];

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => {
          // Close on blur, but with delay to allow clicking inside
          setTimeout(() => setIsOpen(false), 200);
        }}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-700 font-medium transition-colors touch-manipulation"
        aria-label="Show score breakdown"
        aria-expanded={isOpen}
      >
        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">How is this calculated?</span>
        <span className="sm:hidden">Breakdown</span>
      </button>

      {/* Tooltip Content */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 sm:left-auto sm:right-0 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                TrendArc Score Breakdown
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                How we calculate the score for <strong>{termName}</strong>
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 -mt-1 -mr-1"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 mb-4 border border-blue-100">
            <div className="text-xs text-slate-500 mb-1">Overall TrendArc Score</div>
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {overallScore}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              Weighted combination of all factors below
            </div>
          </div>

          {/* Components */}
          <div className="space-y-3 sm:space-y-4">
            {components.map((component, index) => {
              const Icon = component.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 sm:p-2 bg-gradient-to-br ${component.color} rounded-lg flex-shrink-0`}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-slate-900">
                          {component.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {component.weight}% weight
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-lg sm:text-xl font-bold text-slate-900">
                        {component.value}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${component.color} rounded-full transition-all duration-500`}
                        style={{ width: `${component.value}%` }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {component.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Scores are calculated using real-time data from multiple sources. 
                Higher scores indicate greater overall interest and engagement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

