'use client';

import { Trophy, TrendingUp, ArrowRight, Star, Youtube, Film, Search, Music, Gamepad2, ShoppingCart, CheckCircle } from 'lucide-react';

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
  const isTermAWinner = verdict.winner.toLowerCase() === termA.toLowerCase();
  
  const getCategoryIcon = () => {
    switch (verdict.category) {
      case 'movies':
        return <Film className="w-5 h-5" />;
      case 'products':
      case 'tech':
        return <Star className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getMarginLabel = () => {
    if (verdict.margin >= 20) return 'Clear winner';
    if (verdict.margin >= 10) return 'Ahead';
    if (verdict.margin >= 5) return 'Slight lead';
    return 'Very close';
  };

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
          {getCategoryIcon()}
        </div>
        <h2 className="text-lg font-bold text-gray-900">TrendArc Verdict</h2>
        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          {verdict.confidence}% confidence
        </span>
      </div>

      <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex-1 text-center ${isTermAWinner ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`text-2xl font-bold ${isTermAWinner ? 'text-purple-600' : 'text-gray-600'}`}>
              {formatTerm(termA)}
            </div>
            <div className="text-3xl font-black text-gray-900 mt-1">
              {isTermAWinner ? verdict.winnerScore : verdict.loserScore}
            </div>
            <div className="text-sm text-gray-500">TrendArc Score</div>
            {isTermAWinner && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Trophy className="w-4 h-4" />
                {getMarginLabel()}
              </div>
            )}
          </div>

          <div className="px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 font-bold">VS</span>
            </div>
          </div>

          <div className={`flex-1 text-center ${!isTermAWinner ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`text-2xl font-bold ${!isTermAWinner ? 'text-purple-600' : 'text-gray-600'}`}>
              {formatTerm(termB)}
            </div>
            <div className="text-3xl font-black text-gray-900 mt-1">
              {!isTermAWinner ? verdict.winnerScore : verdict.loserScore}
            </div>
            <div className="text-sm text-gray-500">TrendArc Score</div>
            {!isTermAWinner && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Trophy className="w-4 h-4" />
                {getMarginLabel()}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {verdict.headline}
          </p>
          <p className="text-gray-600">
            {verdict.recommendation}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Key Evidence
        </h3>
        <div className="flex flex-wrap gap-2">
          {verdict.evidence.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600"
            >
              <ArrowRight className="w-3 h-3 text-purple-500" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Data sources:</span>
          {verdict.sources.includes('Google Trends') && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
              <Search className="w-3 h-3" />
              Google Trends
            </span>
          )}
          {verdict.sources.includes('YouTube') && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded">
              <Youtube className="w-3 h-3" />
              YouTube
            </span>
          )}
          {verdict.sources.includes('TMDB') && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded">
              <Film className="w-3 h-3" />
              TMDB
            </span>
          )}
          {verdict.sources.includes('Spotify') && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded">
              <Music className="w-3 h-3" />
              Spotify
            </span>
          )}
          {verdict.sources.includes('Steam') && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded">
              <Gamepad2 className="w-3 h-3" />
              Steam
            </span>
          )}
          {verdict.sources.includes('Best Buy') && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded">
              <ShoppingCart className="w-3 h-3" />
              Best Buy
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
