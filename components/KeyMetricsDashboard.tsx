'use client';

import { TrendingUp, TrendingDown, Minus, Calendar, Award, BarChart3, Zap } from 'lucide-react';
import type { SeriesPoint } from '@/lib/trends';

type Props = {
  series: SeriesPoint[];
  termA: string;
  termB: string;
  winner: string;
  winnerScore: number;
  loserScore: number;
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

export default function KeyMetricsDashboard({ 
  series, 
  termA, 
  termB, 
  winner, 
  winnerScore, 
  loserScore,
  breakdownA,
  breakdownB,
}: Props) {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Calculate key metrics
  const calculateMetrics = () => {
    if (!series || series.length === 0) return null;

    const valuesA = series.map(p => Number(p[termA] || 0));
    const valuesB = series.map(p => Number(p[termB] || 0));

    // Peak values and dates
    const maxA = Math.max(...valuesA);
    const maxB = Math.max(...valuesB);
    const maxAIndex = valuesA.indexOf(maxA);
    const maxBIndex = valuesB.indexOf(maxB);
    const peakDateA = series[maxAIndex]?.date || '';
    const peakDateB = series[maxBIndex]?.date || '';

    // Average values
    const avgA = valuesA.reduce((a, b) => a + b, 0) / valuesA.length;
    const avgB = valuesB.reduce((a, b) => a + b, 0) / valuesB.length;

    // Growth rates (comparing first half vs second half)
    const midPoint = Math.floor(valuesA.length / 2);
    const firstHalfAvgA = valuesA.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint;
    const secondHalfAvgA = valuesA.slice(midPoint).reduce((a, b) => a + b, 0) / (valuesA.length - midPoint);
    const firstHalfAvgB = valuesB.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint;
    const secondHalfAvgB = valuesB.slice(midPoint).reduce((a, b) => a + b, 0) / (valuesB.length - midPoint);
    
    const growthRateA = ((secondHalfAvgA - firstHalfAvgA) / firstHalfAvgA) * 100;
    const growthRateB = ((secondHalfAvgB - firstHalfAvgB) / firstHalfAvgB) * 100;

    // Volatility (standard deviation)
    const varianceA = valuesA.reduce((acc, val) => acc + Math.pow(val - avgA, 2), 0) / valuesA.length;
    const varianceB = valuesB.reduce((acc, val) => acc + Math.pow(val - avgB, 2), 0) / valuesB.length;
    const volatilityA = Math.sqrt(varianceA);
    const volatilityB = Math.sqrt(varianceB);

    // Lead percentage (how often each term leads)
    let leadsA = 0;
    let leadsB = 0;
    for (let i = 0; i < valuesA.length; i++) {
      if (valuesA[i] > valuesB[i]) leadsA++;
      else if (valuesB[i] > valuesA[i]) leadsB++;
    }
    const leadPercentageA = (leadsA / valuesA.length) * 100;
    const leadPercentageB = (leadsB / valuesB.length) * 100;

    // Biggest gap
    let biggestGap = 0;
    let biggestGapDate = '';
    for (let i = 0; i < valuesA.length; i++) {
      const gap = Math.abs(valuesA[i] - valuesB[i]);
      if (gap > biggestGap) {
        biggestGap = gap;
        biggestGapDate = series[i]?.date || '';
      }
    }

    return {
      peakA: { value: maxA, date: peakDateA },
      peakB: { value: maxB, date: peakDateB },
      avgA,
      avgB,
      growthRateA,
      growthRateB,
      volatilityA,
      volatilityB,
      leadPercentageA,
      leadPercentageB,
      biggestGap,
      biggestGapDate,
    };
  };

  const metrics = calculateMetrics();
  if (!metrics) return null;

  const isTermAWinner = winner.toLowerCase() === termA.toLowerCase();
  
  // Determine scores for termA and termB
  const termAScore = isTermAWinner ? winnerScore : loserScore;
  const termBScore = isTermAWinner ? loserScore : winnerScore;
  
  // Get breakdowns - use provided breakdowns or defaults
  const breakdownAValues = breakdownA || { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 };
  const breakdownBValues = breakdownB || { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 };

  const getTrendIcon = (rate: number) => {
    if (rate > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (rate < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
          Key Metrics Dashboard
        </h2>
      </div>

      {/* Overall Score and Breakdown Metrics */}
      {breakdownA && breakdownB && (
        <div className="mb-4 sm:mb-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Metric</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-blue-600">{formatTerm(termA)}</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-purple-600">{formatTerm(termB)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                  <td className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900">Overall TrendArc Score</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-base sm:text-lg font-bold text-blue-600">{termAScore}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-base sm:text-lg font-bold text-purple-600">{termBScore}</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      <span>Search Interest</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-blue-600">{breakdownAValues.searchInterest}</span>
                      {breakdownAValues.searchInterest > breakdownBValues.searchInterest && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-purple-600">{breakdownBValues.searchInterest}</span>
                      {breakdownBValues.searchInterest > breakdownAValues.searchInterest && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-3 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      <span>Social Buzz</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-blue-600">{breakdownAValues.socialBuzz}</span>
                      {breakdownAValues.socialBuzz > breakdownBValues.socialBuzz && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-purple-600">{breakdownBValues.socialBuzz}</span>
                      {breakdownBValues.socialBuzz > breakdownAValues.socialBuzz && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Authority</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-blue-600">{breakdownAValues.authority}</span>
                      {breakdownAValues.authority > breakdownBValues.authority && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-purple-600">{breakdownBValues.authority}</span>
                      {breakdownBValues.authority > breakdownAValues.authority && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-3 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Momentum</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-blue-600">{breakdownAValues.momentum}</span>
                      {breakdownAValues.momentum > breakdownBValues.momentum && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-purple-600">{breakdownBValues.momentum}</span>
                      {breakdownBValues.momentum > breakdownAValues.momentum && (
                        <span className="text-xs text-green-600 font-bold">↑</span>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Peak Values */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Peak Value</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termA)}</span>
              <span className="text-sm sm:text-base font-bold text-blue-600">{metrics.peakA.value.toFixed(0)}</span>
            </div>
            <div className="text-xs text-slate-500">{formatDate(metrics.peakA.date)}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termB)}</span>
              <span className="text-sm sm:text-base font-bold text-purple-600">{metrics.peakB.value.toFixed(0)}</span>
            </div>
            <div className="text-xs text-slate-500">{formatDate(metrics.peakB.date)}</div>
          </div>
        </div>

        {/* Average Scores */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Average Score</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termA)}</span>
              <span className="text-sm sm:text-base font-bold text-blue-600">{metrics.avgA.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termB)}</span>
              <span className="text-sm sm:text-base font-bold text-purple-600">{metrics.avgB.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Growth Rate</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termA)}</span>
              <div className="flex items-center gap-1.5">
                {getTrendIcon(metrics.growthRateA)}
                <span className={`text-sm sm:text-base font-bold ${
                  metrics.growthRateA > 5 ? 'text-green-600' : 
                  metrics.growthRateA < -5 ? 'text-red-600' : 
                  'text-slate-600'
                }`}>
                  {metrics.growthRateA > 0 ? '+' : ''}{metrics.growthRateA.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termB)}</span>
              <div className="flex items-center gap-1.5">
                {getTrendIcon(metrics.growthRateB)}
                <span className={`text-sm sm:text-base font-bold ${
                  metrics.growthRateB > 5 ? 'text-green-600' : 
                  metrics.growthRateB < -5 ? 'text-red-600' : 
                  'text-slate-600'
                }`}>
                  {metrics.growthRateB > 0 ? '+' : ''}{metrics.growthRateB.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Percentage */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Time Leading</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termA)}</span>
              <span className="text-sm sm:text-base font-bold text-blue-600">{metrics.leadPercentageA.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${metrics.leadPercentageA}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termB)}</span>
              <span className="text-sm sm:text-base font-bold text-purple-600">{metrics.leadPercentageB.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
              <div 
                className="bg-purple-500 h-1.5 rounded-full transition-all"
                style={{ width: `${metrics.leadPercentageB}%` }}
              />
            </div>
          </div>
        </div>

        {/* Volatility */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Volatility</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termA)}</span>
              <span className="text-sm sm:text-base font-bold text-slate-700">{metrics.volatilityA.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-600 truncate">{formatTerm(termB)}</span>
              <span className="text-sm sm:text-base font-bold text-slate-700">{metrics.volatilityB.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Biggest Gap */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Biggest Gap</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm sm:text-base font-bold text-slate-900">{metrics.biggestGap.toFixed(0)} points</div>
            <div className="text-xs text-slate-500">{formatDate(metrics.biggestGapDate)}</div>
            <div className="text-xs text-slate-600 mt-2">
              {isTermAWinner ? formatTerm(termA) : formatTerm(termB)} had the largest lead
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


