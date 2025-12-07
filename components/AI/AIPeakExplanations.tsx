/**
 * AI Peak Explanations Component
 * Shows why keywords peaked at specific moments
 * Designed to be placed near the chart
 */

import { Sparkles } from "lucide-react";

type PeakExplanationsProps = {
  peakExplanations?: {
    termA?: string;
    termB?: string;
  };
  termA: string;
  termB: string;
};

function prettyTerm(t: string): string {
  return t
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AIPeakExplanations({
  peakExplanations,
  termA,
  termB,
}: PeakExplanationsProps) {
  if (!peakExplanations?.termA && !peakExplanations?.termB) return null;

  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-l-4 border-rose-500 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-rose-600" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          🎯 Why These Peaks Happened
        </h3>
      </div>
      <div className="space-y-3">
        {peakExplanations.termA && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-rose-200">
            <p className="font-semibold text-xs sm:text-sm text-rose-700 mb-1.5">
              📈 {prettyTerm(termA)} Peak
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {peakExplanations.termA}
            </p>
          </div>
        )}
        {peakExplanations.termB && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-rose-200">
            <p className="font-semibold text-xs sm:text-sm text-rose-700 mb-1.5">
              📈 {prettyTerm(termB)} Peak
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {peakExplanations.termB}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
