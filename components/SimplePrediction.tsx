'use client';

import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import Link from 'next/link';

type SimplePredictionData = {
  trend: 'rising' | 'falling' | 'stable';
  direction: string;
  confidence: number;
  explanation: string;
};

type Props = {
  termA: string;
  termB: string;
  predictionA: SimplePredictionData | null;
  predictionB: SimplePredictionData | null;
};

export default function SimplePrediction({ termA, termB, predictionA, predictionB }: Props) {
  const formatTerm = (term: string) => term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'falling':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'falling':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2.5 mb-1">
              <span className="w-2 h-6 sm:h-7 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              Basic Trend Direction
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Simple trend analysis based on recent data
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 border border-purple-300 rounded-lg">
            <Lock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700">Free</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        {predictionA && (
          <div className={`rounded-lg border-2 p-4 ${getTrendColor(predictionA.trend)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTrendIcon(predictionA.trend)}
                <h3 className="font-bold text-base sm:text-lg">{formatTerm(termA)}</h3>
              </div>
              <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded">
                {predictionA.confidence}% confidence
              </span>
            </div>
            <p className="text-sm mt-2">{predictionA.explanation}</p>
          </div>
        )}

        {predictionB && (
          <div className={`rounded-lg border-2 p-4 ${getTrendColor(predictionB.trend)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTrendIcon(predictionB.trend)}
                <h3 className="font-bold text-base sm:text-lg">{formatTerm(termB)}</h3>
              </div>
              <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded">
                {predictionB.confidence}% confidence
              </span>
            </div>
            <p className="text-sm mt-2">{predictionB.explanation}</p>
          </div>
        )}

        {(!predictionA || !predictionB) && (
          <div className="text-center py-4 text-sm text-slate-500">
            Insufficient data for trend analysis
          </div>
        )}

        {/* Upgrade CTA */}
        <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 mb-1">Unlock Advanced Predictions</h4>
              <p className="text-sm text-purple-700 mb-3">
                Get detailed 30-day forecasts with confidence intervals, accuracy tracking, and statistical analysis.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


