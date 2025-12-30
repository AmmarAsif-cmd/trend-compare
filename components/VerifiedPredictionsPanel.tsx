'use client';

import { CheckCircle2, TrendingUp, TrendingDown, AlertCircle, Info, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';

type VerifiedForecastPoint = {
  date: string;
  predictedValue: number;
  actualValue: number | null;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
};

type VerifiedForecast = {
  id: string;
  computedAt: string;
  evaluatedAt: string;
  horizon: number;
  winnerCorrect: boolean | null;
  intervalHitRate80: number | null;
  intervalHitRate95: number | null;
  mae: number | null;
  mape: number | null;
  points: VerifiedForecastPoint[];
};

type Props = {
  slug: string;
  termA: string;
  termB: string;
};

export default function VerifiedPredictionsPanel({ slug, termA, termB }: Props) {
  const [forecasts, setForecasts] = useState<VerifiedForecast[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch verified forecasts using new API
    fetch(`/api/forecasts/verified?slug=${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(data => {
        setForecasts(data.forecasts || []);
        setLoading(false);
      })
      .catch(() => {
        setForecasts([]);
        setLoading(false);
      });
  }, [slug]);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculatePointAccuracy = (predicted: number, actual: number | null): number | null => {
    if (actual === null) return null;
    const error = Math.abs(predicted - actual);
    if (actual === 0) {
      return predicted < 5 ? 95 : Math.max(0, 100 - predicted * 10);
    }
    const percentageError = (error / actual) * 100;
    return Math.max(0, Math.min(100, 100 - percentageError));
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return 'text-slate-500';
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBadge = (accuracy: number | null) => {
    if (accuracy === null) return 'bg-slate-100 text-slate-800 border-slate-200';
    if (accuracy >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (accuracy >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-200 rounded-lg animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="h-5 bg-slate-200 rounded animate-pulse mb-2 w-48" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return null; // Don't show if no verified forecasts
  }

  // Calculate aggregate statistics
  const totalForecasts = forecasts.length;
  const winnerCorrectCount = forecasts.filter(f => f.winnerCorrect === true).length;
  const winnerAccuracy = totalForecasts > 0 ? (winnerCorrectCount / totalForecasts) * 100 : 0;
  
  const intervalHitRates80 = forecasts
    .map(f => f.intervalHitRate80)
    .filter((r): r is number => r !== null);
  const avgIntervalHitRate80 = intervalHitRates80.length > 0
    ? intervalHitRates80.reduce((a, b) => a + b, 0) / intervalHitRates80.length
    : null;

  const maes = forecasts.map(f => f.mae).filter((m): m is number => m !== null);
  const avgMAE = maes.length > 0 ? maes.reduce((a, b) => a + b, 0) / maes.length : null;

  // Get all verified points from all forecasts
  const allVerifiedPoints = forecasts
    .flatMap(f => f.points.map(p => ({ ...p, forecastId: f.id, evaluatedAt: f.evaluatedAt })))
    .filter(p => p.actualValue !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Show last 10 verified points

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
            Verified Forecasts
          </h3>
          <p className="text-sm text-slate-600">
            Forecasts verified against actual data using our time-series forecasting system
          </p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Winner Accuracy</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {winnerAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">
            {winnerCorrectCount} of {totalForecasts} correct
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Interval Coverage</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {avgIntervalHitRate80 !== null ? avgIntervalHitRate80.toFixed(1) : 'N/A'}%
          </div>
          <div className="text-xs text-slate-500">
            80% confidence intervals
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Average Error</span>
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {avgMAE !== null ? avgMAE.toFixed(2) : 'N/A'}
          </div>
          <div className="text-xs text-slate-500">
            Mean Absolute Error
          </div>
        </div>
      </div>

      {/* Recent Verified Points */}
      {allVerifiedPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Verifications</h4>
          
          {allVerifiedPoints.map((point, idx) => {
            const accuracy = calculatePointAccuracy(point.predictedValue, point.actualValue);
            const difference = point.actualValue! - point.predictedValue;
            const isOver = difference > 0;
            const inInterval80 = point.actualValue! >= point.lower80 && point.actualValue! <= point.upper80;
            const inInterval95 = point.actualValue! >= point.lower95 && point.actualValue! <= point.upper95;
            
            return (
              <div key={`${point.date}-${idx}`} className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{formatDate(point.date)}</span>
                      {inInterval80 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">
                          80% ✓
                        </span>
                      )}
                      {inInterval95 && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">
                          95% ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-slate-500">Predicted:</span>
                        <span className="font-semibold text-slate-700 ml-1">{point.predictedValue.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Actual:</span>
                        <span className={`font-semibold ml-1 ${isOver ? 'text-green-600' : 'text-red-600'}`}>
                          {point.actualValue!.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isOver ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <span className={isOver ? 'text-green-600' : 'text-red-600'}>
                          {Math.abs(difference).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Interval: {point.lower80.toFixed(1)} - {point.upper80.toFixed(1)} (80%)
                    </div>
                  </div>
                  {accuracy !== null && (
                    <div className={`px-2 py-1 rounded text-xs font-semibold border ${getAccuracyBadge(accuracy)}`}>
                      {accuracy.toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Message */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Forecasts are automatically evaluated against actual data using our time-series forecasting system (ETS/ARIMA models). 
          We track winner accuracy, interval coverage, and error metrics to continuously improve our forecasting models.
        </p>
      </div>
    </div>
  );
}
