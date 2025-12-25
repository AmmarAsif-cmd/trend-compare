'use client';

import { TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle, Info } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { calculateTrendArcScoreTimeSeries } from '@/lib/trendarc-score-time-series';
import type { ComparisonCategory } from '@/lib/category-resolver';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type PredictionData = {
  predictions: Array<{
    date: string;
    value: number;
    confidence: number;
  }>;
  trend: 'rising' | 'falling' | 'stable';
  confidence: number;
  forecastPeriod: number;
  methods: string[];
  explanation: string;
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  metrics?: {
    dataQuality: number;
    volatility: number;
    trendStrength: number;
  };
};

type Props = {
  termA: string;
  termB: string;
  series: Array<{ date: string; [key: string]: any }>;
  predictionsA?: PredictionData | null;
  predictionsB?: PredictionData | null;
  historicalDataPoints?: number; // Actual number of data points used for predictions
  category?: ComparisonCategory; // Category for TrendArc Score calculation
};

export default function TrendPrediction({ termA, termB, series, predictionsA, predictionsB, historicalDataPoints, category = 'general' }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (!predictionsA && !predictionsB) {
    return null;
  }

  // Validate series is an array
  if (!series || !Array.isArray(series) || series.length === 0) {
    console.warn('[TrendPrediction] Invalid series data:', { series, type: typeof series, isArray: Array.isArray(series) });
    return null;
  }

  // Find matching keys in the series (handle normalized/slugified variations)
  const firstPoint = series[0];
  if (!firstPoint || typeof firstPoint !== 'object') {
    console.warn('[TrendPrediction] Invalid first point in series:', firstPoint);
    return null;
  }
  
  const availableKeys = Object.keys(firstPoint).filter(k => k !== 'date');
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Find matching keys
  const termAKey = availableKeys.find(k => 
    k === termA ||
    k.toLowerCase() === termA.toLowerCase() ||
    normalizeKey(k) === normalizeKey(termA) ||
    k.toLowerCase().replace(/\s+/g, '-') === termA.toLowerCase() ||
    k.toLowerCase().replace(/-/g, ' ') === termA.toLowerCase()
  ) || availableKeys[0];
  
  const termBKey = availableKeys.find(k => 
    (k === termB ||
    k.toLowerCase() === termB.toLowerCase() ||
    normalizeKey(k) === normalizeKey(termB) ||
    k.toLowerCase().replace(/\s+/g, '-') === termB.toLowerCase() ||
    k.toLowerCase().replace(/-/g, ' ') === termB.toLowerCase()) &&
    k !== termAKey
  ) || availableKeys[1] || availableKeys[0];

  // Calculate TrendArc Score for historical data to match prediction scale
  // Predictions use TrendArc Score, so historical data should too for consistency
  let historicalDates: string[] = [];
  let historicalValuesA: number[] = [];
  let historicalValuesB: number[] = [];
  
  try {
    // Calculate TrendArc Score time-series for both terms
    const trendArcScoresA = calculateTrendArcScoreTimeSeries(series, termAKey, category);
    const trendArcScoresB = calculateTrendArcScoreTimeSeries(series, termBKey, category);
    
    // Validate we got different data for each term
    if (trendArcScoresA.length > 0 && trendArcScoresB.length > 0) {
      const avgA = trendArcScoresA.reduce((sum, s) => sum + s.score, 0) / trendArcScoresA.length;
      const avgB = trendArcScoresB.reduce((sum, s) => sum + s.score, 0) / trendArcScoresB.length;
      
      if (Math.abs(avgA - avgB) < 0.1 && termAKey === termBKey) {
        console.warn(`[TrendPrediction] ⚠️ Warning: Both terms appear to be using the same series key "${termAKey}". Values may be identical.`);
      }
      
      // Use TrendArc Score values (matches prediction scale)
      // Get all unique dates from both series
      const allDates = new Set([
        ...trendArcScoresA.map(s => s.date),
        ...trendArcScoresB.map(s => s.date)
      ]);
      historicalDates = Array.from(allDates).sort();
      
      // Map values for each date, ensuring both series align
      historicalValuesA = historicalDates.map(date => {
        const score = trendArcScoresA.find(s => s.date === date);
        return score ? score.score : 0;
      });
      
      historicalValuesB = historicalDates.map(date => {
        const score = trendArcScoresB.find(s => s.date === date);
        return score ? score.score : 0;
      });
      
      // Validate values are in 0-100 range
      historicalValuesA = historicalValuesA.map(v => Math.max(0, Math.min(100, v)));
      historicalValuesB = historicalValuesB.map(v => Math.max(0, Math.min(100, v)));
      
      console.log(`[TrendPrediction] Historical data prepared: TermA avg=${avgA.toFixed(2)}, TermB avg=${avgB.toFixed(2)}, difference=${Math.abs(avgA - avgB).toFixed(2)}`);
    } else {
      // Fallback to raw Google Trends if TrendArc Score calculation fails
      console.warn('[TrendPrediction] TrendArc Score calculation failed, using raw Google Trends');
      historicalDates = series.map(p => p.date);
      historicalValuesA = series.map(p => {
        const val = Number(p[termAKey] || 0);
        return isFinite(val) ? val : 0;
      });
      historicalValuesB = series.map(p => {
        const val = Number(p[termBKey] || 0);
        return isFinite(val) ? val : 0;
      });
    }
  } catch (error) {
    console.error('[TrendPrediction] Error calculating TrendArc Score for historical data:', error);
    // Fallback to raw Google Trends
    historicalDates = series.map(p => p.date);
    historicalValuesA = series.map(p => {
      const val = Number(p[termAKey] || 0);
      return isFinite(val) ? val : 0;
    });
    historicalValuesB = series.map(p => {
      const val = Number(p[termBKey] || 0);
      return isFinite(val) ? val : 0;
    });
  }

  const predictionDatesA = predictionsA?.predictions.map(p => p.date) || [];
  const predictionValuesA = predictionsA?.predictions.map(p => p.value) || [];
  const predictionDatesB = predictionsB?.predictions.map(p => p.date) || [];
  const predictionValuesB = predictionsB?.predictions.map(p => p.value) || [];

  const allDates = [...historicalDates, ...predictionDatesA, ...predictionDatesB];
  const uniqueDates = Array.from(new Set(allDates)).sort();

  // Create datasets
  const datasets: any[] = [];

  // Historical data for Term A
  datasets.push({
    label: `${formatTerm(termA)} (Historical)`,
    data: uniqueDates.map(date => {
      const idx = historicalDates.indexOf(date);
      return idx >= 0 ? historicalValuesA[idx] : null;
    }),
    borderColor: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    fill: false,
    pointRadius: 2,
    borderDash: [],
  });

  // Prediction data for Term A
  if (predictionsA && predictionDatesA.length > 0) {
    datasets.push({
      label: `${formatTerm(termA)} (Predicted)`,
      data: uniqueDates.map(date => {
        const idx = predictionDatesA.indexOf(date);
        return idx >= 0 ? predictionValuesA[idx] : null;
      }),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: false,
      pointRadius: 3,
      borderDash: [5, 5],
    });

    // Confidence interval for Term A
    if (predictionsA.confidenceInterval.lower.length > 0) {
      datasets.push({
        label: `${formatTerm(termA)} (Lower Bound)`,
        data: uniqueDates.map(date => {
          const idx = predictionDatesA.indexOf(date);
          return idx >= 0 ? predictionsA.confidenceInterval.lower[idx] : null;
        }),
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 1,
        fill: '+1',
        pointRadius: 0,
        borderDash: [2, 2],
      });

      datasets.push({
        label: `${formatTerm(termA)} (Upper Bound)`,
        data: uniqueDates.map(date => {
          const idx = predictionDatesA.indexOf(date);
          return idx >= 0 ? predictionsA.confidenceInterval.upper[idx] : null;
        }),
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        borderDash: [2, 2],
      });
    }
  }

  // Historical data for Term B
  datasets.push({
    label: `${formatTerm(termB)} (Historical)`,
    data: uniqueDates.map(date => {
      const idx = historicalDates.indexOf(date);
      return idx >= 0 ? historicalValuesB[idx] : null;
    }),
    borderColor: 'rgb(168, 85, 247)',
    backgroundColor: 'rgba(168, 85, 246, 0.1)',
    borderWidth: 2,
    fill: false,
    pointRadius: 2,
    borderDash: [],
  });

  // Prediction data for Term B
  if (predictionsB && predictionDatesB.length > 0) {
    datasets.push({
      label: `${formatTerm(termB)} (Predicted)`,
      data: uniqueDates.map(date => {
        const idx = predictionDatesB.indexOf(date);
        return idx >= 0 ? predictionValuesB[idx] : null;
      }),
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 246, 0.1)',
      borderWidth: 2,
      fill: false,
      pointRadius: 3,
      borderDash: [5, 5],
    });

    // Confidence interval for Term B
    if (predictionsB.confidenceInterval.lower.length > 0) {
      datasets.push({
        label: `${formatTerm(termB)} (Lower Bound)`,
        data: uniqueDates.map(date => {
          const idx = predictionDatesB.indexOf(date);
          return idx >= 0 ? predictionsB.confidenceInterval.lower[idx] : null;
        }),
        borderColor: 'rgba(168, 85, 247, 0.3)',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        borderWidth: 1,
        fill: '+1',
        pointRadius: 0,
        borderDash: [2, 2],
      });

      datasets.push({
        label: `${formatTerm(termB)} (Upper Bound)`,
        data: uniqueDates.map(date => {
          const idx = predictionDatesB.indexOf(date);
          return idx >= 0 ? predictionsB.confidenceInterval.upper[idx] : null;
        }),
        borderColor: 'rgba(168, 85, 247, 0.3)',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        borderDash: [2, 2],
      });
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'falling':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'falling':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 50) return 'text-blue-600';
    return 'text-amber-600';
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
              Advanced Trend Forecast
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              30-Day Statistical Forecast | Based on {(() => {
                const dataPoints = historicalDataPoints || series.length;
                if (dataPoints > 200) return '~5 years';
                if (dataPoints > 100) return '~1 year';
                return `${dataPoints} days`;
              })()} of historical data
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                Linear Regression
              </span>
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                Holt-Winters
              </span>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                Moving Average
              </span>
              {(predictionsA?.metrics || predictionsB?.metrics) && (
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                  Ensemble Model
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {predictionsA && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">{formatTerm(termA)}</span>
              {getTrendIcon(predictionsA.trend)}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${getTrendColor(predictionsA.trend)}`}>
                {predictionsA.trend.charAt(0).toUpperCase() + predictionsA.trend.slice(1)}
              </span>
              <span className={`text-xs font-semibold ${getConfidenceColor(predictionsA.confidence)}`}>
                {predictionsA.confidence}% confidence
              </span>
            </div>
            {predictionsA.predictions.length > 0 && (
              <div className="text-xs text-slate-600">
                Avg forecast: {Math.round((predictionsA.predictions.reduce((sum, p) => sum + p.value, 0) / predictionsA.predictions.length) * 100) / 100}
              </div>
            )}
          </div>
        )}

        {predictionsB && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">{formatTerm(termB)}</span>
              {getTrendIcon(predictionsB.trend)}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${getTrendColor(predictionsB.trend)}`}>
                {predictionsB.trend.charAt(0).toUpperCase() + predictionsB.trend.slice(1)}
              </span>
              <span className={`text-xs font-semibold ${getConfidenceColor(predictionsB.confidence)}`}>
                {predictionsB.confidence}% confidence
              </span>
            </div>
            {predictionsB.predictions.length > 0 && (
              <div className="text-xs text-slate-600">
                Avg forecast: {Math.round((predictionsB.predictions.reduce((sum, p) => sum + p.value, 0) / predictionsB.predictions.length) * 100) / 100}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mb-4 sm:mb-6" style={{ height: '300px', position: 'relative' }}>
        <Line
          data={{
            labels: uniqueDates.map(date => {
              const d = new Date(date);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets,
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: {
                    size: 11,
                  },
                  usePointStyle: true,
                },
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f1f5f9',
                bodyColor: '#e2e8f0',
                padding: 12,
                borderColor: 'rgba(148, 163, 184, 0.3)',
                borderWidth: 1,
                cornerRadius: 8,
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                  font: {
                    size: 10,
                  },
                },
              },
              y: {
                beginAtZero: true,
                max: 100, // Clamp Y-axis to 0-100 for TrendArc Score
                grid: {
                  color: 'rgba(226, 232, 240, 0.5)',
                },
                ticks: {
                  font: {
                    size: 10,
                  },
                  callback: (value) => {
                    return `${value}%`;
                  },
                },
              },
            },
          }}
        />
      </div>

      {/* Metrics Dashboard */}
      {(predictionsA?.metrics || predictionsB?.metrics) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {(predictionsA?.metrics || predictionsB?.metrics) && (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-600 font-medium mb-1">Data Quality</div>
                <div className="text-lg font-bold text-blue-900">
                  {Math.round((predictionsA?.metrics?.dataQuality || predictionsB?.metrics?.dataQuality || 0))}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">Trend Strength</div>
                <div className="text-lg font-bold text-purple-900">
                  {Math.round((predictionsA?.metrics?.trendStrength || predictionsB?.metrics?.trendStrength || 0) * 100)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
                <div className="text-xs text-amber-600 font-medium mb-1">Volatility</div>
                <div className="text-lg font-bold text-amber-900">
                  {((predictionsA?.metrics?.volatility || predictionsB?.metrics?.volatility || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                <div className="text-xs text-green-600 font-medium mb-1">Model Confidence</div>
                <div className="text-lg font-bold text-green-900">
                  {Math.round(predictionsA?.confidence || predictionsB?.confidence || 0)}%
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Explanation */}
      {(predictionsA?.explanation || predictionsB?.explanation) && (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-4 sm:p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Forecast Analysis</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {predictionsA?.explanation || predictionsB?.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Methods Used */}
      {(predictionsA?.methods.length || predictionsB?.methods.length) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold">Methods:</span>
          {[...new Set([...(predictionsA?.methods || []), ...(predictionsB?.methods || [])])].map(method => (
            <span key={method} className="px-2 py-1 bg-slate-100 rounded-full">
              {method === 'linear' ? 'Linear Regression' : method === 'exponential' ? 'Exponential Smoothing' : 'Moving Average'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

