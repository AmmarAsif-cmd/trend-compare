/**
 * Verdict Hero Card
 * Single source of truth: winner, margin, confidence, stability, volatility, agreement
 * Plus 1 sentence verdict with time language
 */

'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

interface VerdictHeroProps {
  winner: string;
  loser: string;
  winnerScore: number;
  loserScore: number;
  margin: number;
  confidence: number;
  stability: 'stable' | 'hype' | 'volatile';
  volatility: number;
  agreementIndex: number;
  topDrivers: Array<{ name: string; impact: number }>;
  riskFlags: string[];
  gapChangePoints: number;
  termA: string;
  termB: string;
}

export default function VerdictCardV2({
  winner,
  loser,
  winnerScore,
  loserScore,
  margin,
  confidence,
  stability,
  volatility,
  agreementIndex,
  topDrivers,
  riskFlags,
  gapChangePoints,
  termA,
  termB,
}: VerdictHeroProps) {
  const prettyTerm = (t: string) => t.replace(/-/g, ' ');

  // Generate time-aware sentence
  const getVerdictSentence = () => {
    const winnerName = prettyTerm(winner);
    
    if (gapChangePoints < -2) {
      return `${winnerName} still leads, but the gap narrowed vs previous period.`;
    } else if (gapChangePoints > 2) {
      return `${winnerName} extended its lead vs previous period.`;
    } else {
      return `Lead is stable vs previous period.`;
    }
  };

  const getStabilityLabel = () => {
    switch (stability) {
      case 'stable':
        return { label: 'Stable', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'hype':
        return { label: 'Hype', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'volatile':
        return { label: 'Volatile', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  const getVolatilityLabel = () => {
    if (volatility < 20) return { label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' };
    if (volatility < 40) return { label: 'Medium', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'High', color: 'bg-red-100 text-red-800 border-red-300' };
  };

  const getConfidenceLabel = () => {
    if (confidence >= 80) return { label: 'High', color: 'bg-green-100 text-green-800 border-green-300' };
    if (confidence >= 60) return { label: 'Medium', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Low', color: 'bg-red-100 text-red-800 border-red-300' };
  };

  const stabilityInfo = getStabilityLabel();
  const volatilityInfo = getVolatilityLabel();
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-xl sm:rounded-2xl border-2 border-violet-500 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
      <div className="p-6 sm:p-8 text-white">
        {/* Top Section: Winner vs Loser + Margin + Verdict Sentence */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
            <h2 className="text-xl sm:text-2xl font-extrabold">Verdict</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-xs text-white/70 mb-1">Winner</p>
              <p className="text-lg sm:text-xl font-bold">{prettyTerm(winner)}</p>
              <p className="text-base sm:text-lg font-bold text-yellow-300">{winnerScore.toFixed(1)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-xs text-white/70 mb-1">Runner-up</p>
              <p className="text-lg sm:text-xl font-bold">{prettyTerm(loser)}</p>
              <p className="text-base sm:text-lg font-bold text-white/70">{loserScore.toFixed(1)}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-white/70 mb-1">Margin</p>
            <p className="text-2xl sm:text-3xl font-bold">{margin.toFixed(1)} points</p>
          </div>

          {/* Verdict Sentence - Largest text */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-white font-semibold leading-tight">
            {getVerdictSentence()}
          </p>
        </div>

        {/* Secondary Row: Confidence, Stability, Volatility, Agreement */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pb-4 border-b border-white/20">
          <div>
            <p className="text-xs text-white/70 mb-1">Confidence</p>
            <p className="text-lg font-bold">{confidence.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-white/70 mb-1">Stability</p>
            <p className="text-sm font-bold">{stabilityInfo.label}</p>
          </div>
          <div>
            <p className="text-xs text-white/70 mb-1">Volatility</p>
            <p className="text-sm font-bold">{volatilityInfo.label}</p>
          </div>
          <div>
            <p className="text-xs text-white/70 mb-1">Agreement</p>
            <p className="text-lg font-bold">{agreementIndex !== undefined ? agreementIndex.toFixed(0) : 'N/A'}%</p>
          </div>
        </div>

        {/* Collapsible "Why this verdict" */}
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="w-full flex items-center justify-between text-sm text-white/90 hover:text-white transition-colors"
        >
          <span className="font-medium">Why this verdict?</span>
          {showWhy ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showWhy && (
          <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
            {/* Top 2 drivers */}
            {topDrivers.length > 0 && (
              <div>
                <p className="text-xs text-white/70 mb-1">Top drivers:</p>
                <div className="flex flex-wrap gap-2">
                  {topDrivers.slice(0, 2).map((driver, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded text-xs font-medium"
                    >
                      {driver.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 1 risk factor */}
            {riskFlags.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-white/10 rounded">
                <AlertTriangle className="w-3 h-3 text-yellow-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/90">{riskFlags[0]}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

