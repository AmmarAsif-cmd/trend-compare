'use client';

import { CheckCircle2, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

type VerifiedPrediction = {
  id: string;
  forecastDate: string;
  predictedValue: number;
  actualValue: number;
  accuracy: number;
  confidence: number;
  verifiedAt: string;
};

type Props = {
  slug: string;
  termA: string;
  termB: string;
};

export default function VerifiedPredictionsPanel({ slug, termA, termB }: Props) {
  const [predictions, setPredictions] = useState<{
    termA: VerifiedPrediction[];
    termB: VerifiedPrediction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch verified predictions for both terms
    Promise.all([
      fetch(`/api/predictions/verified?slug=${encodeURIComponent(slug)}&term=${encodeURIComponent(termA)}`)
        .then(res => res.json())
        .then(data => data.predictions || [])
        .catch(() => []),
      fetch(`/api/predictions/verified?slug=${encodeURIComponent(slug)}&term=${encodeURIComponent(termB)}`)
        .then(res => res.json())
        .then(data => data.predictions || [])
        .catch(() => []),
    ]).then(([termAPreds, termBPreds]) => {
      setPredictions({ termA: termAPreds, termB: termBPreds });
      setLoading(false);
    });
  }, [slug, termA, termB]);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBadge = (accuracy: number) => {
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

  if (!predictions || (predictions.termA.length === 0 && predictions.termB.length === 0)) {
    return null; // Don't show if no verified predictions
  }

  const totalVerified = predictions.termA.length + predictions.termB.length;
  const avgAccuracyA = predictions.termA.length > 0
    ? predictions.termA.reduce((sum, p) => sum + p.accuracy, 0) / predictions.termA.length
    : 0;
  const avgAccuracyB = predictions.termB.length > 0
    ? predictions.termB.reduce((sum, p) => sum + p.accuracy, 0) / predictions.termB.length
    : 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
            Verified Predictions
          </h3>
          <p className="text-sm text-slate-600">
            We've verified {totalVerified} prediction{totalVerified !== 1 ? 's' : ''} against actual data
          </p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {predictions.termA.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">{formatTerm(termA)}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded border ${getAccuracyBadge(avgAccuracyA)}`}>
                {avgAccuracyA.toFixed(1)}% avg
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{predictions.termA.length}</div>
            <div className="text-xs text-slate-500">verified predictions</div>
          </div>
        )}

        {predictions.termB.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">{formatTerm(termB)}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded border ${getAccuracyBadge(avgAccuracyB)}`}>
                {avgAccuracyB.toFixed(1)}% avg
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{predictions.termB.length}</div>
            <div className="text-xs text-slate-500">verified predictions</div>
          </div>
        )}
      </div>

      {/* Recent Verified Predictions */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Verifications</h4>
        
        {/* Term A Predictions */}
        {predictions.termA.slice(0, 5).map((pred) => {
          const difference = pred.actualValue - pred.predictedValue;
          const isOver = difference > 0;
          
          return (
            <div key={pred.id} className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{formatTerm(termA)}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">{formatDate(pred.forecastDate)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-500">Predicted:</span>
                      <span className="font-semibold text-slate-700 ml-1">{pred.predictedValue.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Actual:</span>
                      <span className={`font-semibold ml-1 ${isOver ? 'text-green-600' : 'text-red-600'}`}>
                        {pred.actualValue.toFixed(1)}
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
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold border ${getAccuracyBadge(pred.accuracy)}`}>
                  {pred.accuracy.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}

        {/* Term B Predictions */}
        {predictions.termB.slice(0, 5).map((pred) => {
          const difference = pred.actualValue - pred.predictedValue;
          const isOver = difference > 0;
          
          return (
            <div key={pred.id} className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{formatTerm(termB)}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">{formatDate(pred.forecastDate)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-500">Predicted:</span>
                      <span className="font-semibold text-slate-700 ml-1">{pred.predictedValue.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Actual:</span>
                      <span className={`font-semibold ml-1 ${isOver ? 'text-green-600' : 'text-red-600'}`}>
                        {pred.actualValue.toFixed(1)}
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
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold border ${getAccuracyBadge(pred.accuracy)}`}>
                  {pred.accuracy.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Message */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Predictions are automatically verified against actual Google Trends data as it becomes available. 
          We track accuracy to continuously improve our forecasting models.
        </p>
      </div>
    </div>
  );
}


