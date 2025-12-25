"use client";

import { Trophy, TrendingUp, Info, Sparkles } from "lucide-react";
import { useState } from "react";

type QuickSummaryCardProps = {
  winner: string;
  loser: string;
  winnerScore: number;
  loserScore: number;
  margin: number;
  confidence: number;
  category: string;
  termA: string;
  termB: string;
};

/**
 * Quick Summary Card Component
 * 
 * Displays a concise summary at the top of comparison page:
 * - Winner and margin
 * - Key insight (one sentence)
 * - Confidence level
 * 
 * Mobile-friendly with responsive design
 */
export default function QuickSummaryCard({
  winner,
  loser,
  winnerScore,
  loserScore,
  margin,
  confidence,
  category,
  termA,
  termB,
}: QuickSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getMarginLabel = () => {
    if (margin >= 20) return 'Dominant Lead';
    if (margin >= 10) return 'Clear Winner';
    if (margin >= 5) return 'Ahead';
    return 'Slight Edge';
  };

  const getMarginColor = () => {
    if (margin >= 20) return 'from-emerald-500 to-green-600';
    if (margin >= 10) return 'from-blue-500 to-indigo-600';
    if (margin >= 5) return 'from-purple-500 to-pink-600';
    return 'from-amber-500 to-orange-600';
  };

  const getConfidenceColor = () => {
    if (confidence >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (confidence >= 60) return 'bg-blue-100 text-blue-700 border-blue-300';
    return 'bg-amber-100 text-amber-700 border-amber-300';
  };

  const getCategoryEmoji = () => {
    switch (category.toLowerCase()) {
      case 'movies': return '🎬';
      case 'music': return '🎵';
      case 'games': return '🎮';
      case 'products': return '🛍️';
      case 'tech': return '💻';
      default: return '📊';
    }
  };

  const isTermAWinner = winner.toLowerCase().replace(/[^a-z0-9]/g, '') === termA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const winnerTerm = isTermAWinner ? formatTerm(termA) : formatTerm(termB);
  const loserTerm = isTermAWinner ? formatTerm(termB) : formatTerm(termA);

  // Generate one-sentence takeaway
  const getTakeaway = () => {
    if (margin >= 20) {
      return `${winnerTerm} has a dominant lead with ${margin.toFixed(1)}% more interest than ${loserTerm}.`;
    } else if (margin >= 10) {
      return `${winnerTerm} is clearly ahead with ${margin.toFixed(1)}% more search interest than ${loserTerm}.`;
    } else if (margin >= 5) {
      return `${winnerTerm} leads by ${margin.toFixed(1)}% over ${loserTerm}, showing a notable advantage.`;
    } else {
      return `${winnerTerm} has a slight edge (${margin.toFixed(1)}%) over ${loserTerm} - very close competition.`;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Quick Summary</h2>
              <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-1.5">
                <span>{getCategoryEmoji()}</span>
                <span className="capitalize">{category}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-white/80 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg"
            aria-label={showDetails ? "Hide details" : "Show details"}
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Winner Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className={`p-2 sm:p-3 bg-gradient-to-br ${getMarginColor()} rounded-xl shadow-lg flex-shrink-0`}>
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Winner</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">
                {winnerTerm}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-br bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {winnerScore}
              </div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
          </div>

          {/* Margin Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r ${getMarginColor()} text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5`}>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {getMarginLabel()}
            </div>
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border-2 ${getConfidenceColor()}`}>
              {confidence}% Confidence
            </div>
          </div>
        </div>

        {/* Key Takeaway */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-100 mb-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed flex-1">
              {getTakeaway()}
            </p>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/80 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Winner Score</div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{winnerScore}</div>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Loser Score</div>
                <div className="text-xl sm:text-2xl font-bold text-slate-600">{loserScore}</div>
              </div>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Margin</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900">{margin.toFixed(1)}%</div>
              <div className="text-xs text-slate-600 mt-1">
                {winnerTerm} has {margin.toFixed(1)}% more interest than {loserTerm}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

