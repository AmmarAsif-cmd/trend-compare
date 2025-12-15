'use client';

import { Trophy, TrendingUp, ArrowRight, Star, Youtube, Film, Search, Music, Gamepad2, ShoppingCart, CheckCircle, Sparkles, Award, Zap, BookOpen } from 'lucide-react';

type VerdictData = {
  winner: string;
  loser: string;
  winnerScore: number;
  loserScore: number;
  margin: number;
  confidence: number;
  headline: string;
  recommendation: string;
  evidence: string[];
  category: string;
  sources: string[];
};

type Props = {
  verdict: VerdictData;
  termA: string;
  termB: string;
};

export default function ComparisonVerdict({ verdict, termA, termB }: Props) {
  // Normalize both for comparison (handle case and special characters)
  const normalizeTerm = (term: string) => term.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normalizedWinner = normalizeTerm(verdict.winner);
  const normalizedTermA = normalizeTerm(termA);
  const normalizedTermB = normalizeTerm(termB);
  
  // Determine which term is the winner by string matching
  const isTermAWinner = normalizedWinner === normalizedTermA;
  
  // Get scores - map winnerScore/loserScore to termA/termB based on winner string
  // But verify with score comparison to catch any mismatches
  let termAScore: number = verdict.winnerScore;
  let termBScore: number = verdict.loserScore;
  let displayIsTermAWinner: boolean = isTermAWinner;
  
  if (isTermAWinner) {
    // Term A is the winner
    termAScore = verdict.winnerScore;
    termBScore = verdict.loserScore;
    displayIsTermAWinner = true;
  } else {
    // Term B is the winner
    termAScore = verdict.loserScore;
    termBScore = verdict.winnerScore;
    displayIsTermAWinner = false;
  }
  
  // Double-check: if scores don't match expected winner, trust the scores
  if (termAScore > termBScore && !displayIsTermAWinner) {
    console.warn('[ComparisonVerdict] Score mismatch - termA has higher score but verdict says termB wins. Using score-based determination.');
    displayIsTermAWinner = true;
    // Swap scores
    const temp = termAScore;
    termAScore = termBScore;
    termBScore = temp;
  } else if (termBScore > termAScore && displayIsTermAWinner) {
    console.warn('[ComparisonVerdict] Score mismatch - termB has higher score but verdict says termA wins. Using score-based determination.');
    displayIsTermAWinner = false;
    // Swap scores
    const temp = termAScore;
    termAScore = termBScore;
    termBScore = temp;
  }
  
  // Calculate winner/loser scores for progress bars (must be after all score assignments)
  const winnerScore = Math.max(termAScore, termBScore);
  const loserScore = Math.min(termAScore, termBScore);
  
  const getCategoryIcon = () => {
    switch (verdict.category) {
      case 'movies':
        return <Film className="w-5 h-5" />;
      case 'products':
      case 'tech':
        return <ShoppingCart className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      case 'games':
        return <Gamepad2 className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getMarginLabel = () => {
    if (verdict.margin >= 20) return 'Dominant';
    if (verdict.margin >= 10) return 'Clear Winner';
    if (verdict.margin >= 5) return 'Ahead';
    return 'Slight Edge';
  };

  const getConfidenceColor = () => {
    if (verdict.confidence >= 80) return 'text-green-200 bg-green-500/20 border-green-400/30';
    if (verdict.confidence >= 60) return 'text-blue-200 bg-blue-500/20 border-blue-400/30';
    return 'text-yellow-200 bg-amber-500/20 border-amber-400/30';
  };

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const maxScore = Math.max(winnerScore, loserScore, 100);
  const winnerPercentage = (winnerScore / maxScore) * 100;
  const loserPercentage = (loserScore / maxScore) * 100;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 rounded-3xl shadow-2xl border border-purple-500/20 mb-6 sm:mb-8">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-indigo-600/10 animate-pulse" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black !text-white mb-1 truncate">
                TrendArc Verdict
              </h2>
              <p className="text-xs sm:text-sm text-purple-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                <span className="truncate">Multi-source analysis</span>
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border backdrop-blur-sm flex-shrink-0 ${getConfidenceColor()}`}>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{verdict.confidence}% Confidence</span>
          </div>
        </div>

        {/* Main Score Comparison */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6 lg:p-8 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center">
            {/* Term A */}
            <div className={`relative ${displayIsTermAWinner ? 'order-1 sm:order-1' : 'order-2 sm:order-3'}`}>
              <div className={`text-center transition-all duration-300 ${displayIsTermAWinner ? 'scale-105' : 'scale-95 opacity-70'}`}>
                <div className="mb-3">
                  <div className={`text-lg sm:text-xl font-bold mb-2 ${displayIsTermAWinner ? 'text-purple-200' : 'text-slate-300'}`}>
                    {formatTerm(termA)}
                  </div>
                  <div className="relative inline-block">
                    <div className={`text-4xl sm:text-5xl lg:text-6xl font-black ${displayIsTermAWinner ? 'text-white' : 'text-slate-300'} mb-2`}>
                      {termAScore}
                    </div>
                    {displayIsTermAWinner && (
                      <div className="absolute -top-2 -right-2">
                        <Award className="w-6 h-6 text-yellow-400 animate-bounce" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 font-medium">TrendArc Score</div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isTermAWinner ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-slate-600'}`}
                      style={{ width: `${displayIsTermAWinner ? winnerPercentage : loserPercentage}%` }}
                    />
                  </div>
                </div>

                {displayIsTermAWinner && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-full">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-300">{getMarginLabel()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="order-2 sm:order-2 flex justify-center my-3 sm:my-0">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-purple-400/30 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-black text-sm sm:text-base md:text-lg lg:text-xl">VS</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />
              </div>
            </div>

            {/* Term B */}
            <div className={`relative ${!displayIsTermAWinner ? 'order-2 sm:order-1' : 'order-3 sm:order-3'}`}>
              <div className={`text-center transition-all duration-300 ${!displayIsTermAWinner ? 'scale-105' : 'scale-95 opacity-70'}`}>
                <div className="mb-3">
                  <div className={`text-lg sm:text-xl font-bold mb-2 ${!displayIsTermAWinner ? 'text-purple-200' : 'text-slate-300'}`}>
                    {formatTerm(termB)}
                  </div>
                  <div className="relative inline-block">
                    <div className={`text-4xl sm:text-5xl lg:text-6xl font-black ${!displayIsTermAWinner ? 'text-white' : 'text-slate-300'} mb-2`}>
                      {termBScore}
                    </div>
                    {!displayIsTermAWinner && (
                      <div className="absolute -top-2 -right-2">
                        <Award className="w-6 h-6 text-yellow-400 animate-bounce" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 font-medium">TrendArc Score</div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${!isTermAWinner ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-slate-600'}`}
                      style={{ width: `${!displayIsTermAWinner ? winnerPercentage : loserPercentage}%` }}
                    />
                  </div>
                </div>

                {!displayIsTermAWinner && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-full">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-300">{getMarginLabel()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verdict Text */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xl sm:text-2xl font-bold !text-white mb-2">
                  {verdict.headline}
                </h3>
                <p className="text-base sm:text-lg text-purple-50 leading-relaxed">
                  {verdict.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Evidence */}
        {verdict.evidence && verdict.evidence.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-300" />
              <h3 className="text-lg font-bold !text-white">Key Evidence</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {verdict.evidence.map((item, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-purple-50 hover:bg-white/15 hover:border-purple-400/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="break-words">{item}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Sources */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-purple-200">Powered by:</span>
            {verdict.sources.includes('Google Trends') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg backdrop-blur-sm">
                <Search className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-xs font-medium text-blue-200">Google Trends</span>
              </div>
            )}
            {verdict.sources.includes('YouTube') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm">
                <Youtube className="w-3.5 h-3.5 text-red-300" />
                <span className="text-xs font-medium text-red-200">YouTube</span>
              </div>
            )}
            {verdict.sources.includes('TMDB') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-lg backdrop-blur-sm">
                <Film className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-xs font-medium text-purple-200">TMDB</span>
              </div>
            )}
            {verdict.sources.includes('Spotify') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-400/30 rounded-lg backdrop-blur-sm">
                <Music className="w-3.5 h-3.5 text-green-300" />
                <span className="text-xs font-medium text-green-200">Spotify</span>
              </div>
            )}
            {verdict.sources.includes('Steam') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/20 border border-slate-400/30 rounded-lg backdrop-blur-sm">
                <Gamepad2 className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-xs font-medium text-slate-200">Steam</span>
              </div>
            )}
            {verdict.sources.includes('Best Buy') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-400/30 rounded-lg backdrop-blur-sm">
                <ShoppingCart className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-xs font-medium text-yellow-200">Best Buy</span>
              </div>
            )}
            {verdict.sources.includes('Wikipedia') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg backdrop-blur-sm">
                <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-xs font-medium text-blue-200">Wikipedia</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
