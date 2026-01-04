/**
 * AI Peak Explanations Component
 * Shows why keywords peaked at specific moments with REAL data
 * Uses PeakExplanation objects with citations and sources
 */

import { Sparkles, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import type { PeakExplanation } from "@/lib/peak-explanation-engine";

type PeakExplanationsProps = {
  peakExplanations?: {
    termA?: PeakExplanation | string;
    termB?: PeakExplanation | string;
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

function isPeakExplanation(obj: PeakExplanation | string): obj is PeakExplanation {
  return typeof obj === 'object' && obj !== null && 'explanation' in obj;
}

export default function AIPeakExplanations({
  peakExplanations,
  termA,
  termB,
}: PeakExplanationsProps) {
  if (!peakExplanations?.termA && !peakExplanations?.termB) return null;

  const renderPeakExplanation = (
    explanation: PeakExplanation | string | undefined,
    term: string
  ) => {
    if (!explanation) return null;

    // Handle string format (legacy/fallback)
    if (typeof explanation === 'string') {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-rose-200">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg">📈</span>
            <div className="flex-1">
              <p className="font-semibold text-xs sm:text-sm text-rose-700 mb-0.5">
                {prettyTerm(term)} Peak
              </p>
              <p className="text-xs text-rose-600/70">
                What caused this spike?
              </p>
            </div>
          </div>
          <div className="pl-7">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      );
    }

    // Handle PeakExplanation object (real data)
    const peak = explanation as PeakExplanation;
    const hasCitations = peak.citations && peak.citations.length > 0;
    const hasRealEventData = peak.relevanceScore > 0 && peak.sources && peak.sources.length > 0;
    const confidenceColor = peak.confidence >= 70 ? 'text-green-600' : peak.confidence >= 50 ? 'text-yellow-600' : 'text-orange-600';

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-rose-200">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-lg">📈</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-xs sm:text-sm text-rose-700">
                {prettyTerm(term)} Peak
              </p>
              {peak.verified && (
                <span title="Verified by multiple sources">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </span>
              )}
              {!hasRealEventData && (
                <span title="Limited event data available">
                  <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                </span>
              )}
            </div>
            <p className="text-xs text-rose-600/70">
              What caused this spike?
            </p>
          </div>
        </div>
        <div className="pl-7 space-y-3">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {peak.explanation}
          </p>

          {/* Citations - ALWAYS show if available */}
          {hasCitations && (
            <div className="mt-3 pt-3 border-t border-rose-100">
              <p className="text-xs font-semibold text-slate-600 mb-2">Sources & Links:</p>
              <div className="space-y-1.5">
                {peak.citations.slice(0, 5).map((citation, idx) => (
                  <a
                    key={idx}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{citation.title}</span>
                    <span className="text-slate-400 flex-shrink-0">({citation.source})</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-rose-100">
            {peak.sources && peak.sources.length > 0 && (
              <span>Sources: {peak.sources.join(', ')}</span>
            )}
            <span className={confidenceColor}>
              Confidence: {peak.confidence}%
            </span>
            {peak.relevanceScore > 0 && (
              <span>Relevance: {peak.relevanceScore}%</span>
            )}
          </div>
        </div>
      </div>
    );
  };

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
        {renderPeakExplanation(peakExplanations.termA, termA)}
        {renderPeakExplanation(peakExplanations.termB, termB)}
      </div>
    </div>
  );
}
