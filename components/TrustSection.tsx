/**
 * Trust & Reliability Section
 * Shows confidence, data freshness, agreement index, and forecast availability
 */

'use client';

import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

interface TrustSectionProps {
  confidence: number;
  dataFreshness: {
    lastUpdatedAt: string;
    source: string;
  };
  agreementIndex: number;
  hasForecast: boolean;
  volatility: number;
  disagreementFlag: boolean;
}

export default function TrustSection({
  confidence,
  dataFreshness,
  agreementIndex,
  hasForecast,
  volatility,
  disagreementFlag,
}: TrustSectionProps) {
  const getConfidenceColor = () => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAgreementColor = () => {
    if (agreementIndex >= 80) return 'text-green-600';
    if (agreementIndex >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  // Generate "What would break this forecast?" bullets
  const getBreakConditions = (): string[] => {
    const conditions: string[] = [];
    
    if (volatility > 50) {
      conditions.push('High volatility could cause unexpected swings');
    }
    
    if (disagreementFlag) {
      conditions.push('Source disagreement suggests uncertainty');
    }
    
    if (confidence < 60) {
      conditions.push('Low confidence indicates limited data reliability');
    }
    
    if (conditions.length === 0) {
      conditions.push('Forecast appears stable based on current data');
    }
    
    return conditions.slice(0, 3);
  };

  const breakConditions = getBreakConditions();

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-5 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
        Trust & Reliability
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getConfidenceColor()} bg-opacity-10`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600">Confidence</p>
            <p className={`text-lg font-bold ${getConfidenceColor()}`}>
              {confidence.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAgreementColor()} bg-opacity-10`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600">Source Agreement</p>
            <p className={`text-lg font-bold ${getAgreementColor()}`}>
              {agreementIndex.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 bg-blue-50">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600">Data Freshness</p>
            <p className="text-sm font-medium text-slate-900">
              {new Date(dataFreshness.lastUpdatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasForecast ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600">Forecast</p>
            <p className={`text-sm font-medium ${hasForecast ? 'text-green-700' : 'text-slate-500'}`}>
              {hasForecast ? 'Available' : 'Not available'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          What would break this forecast?
        </h4>
        <ul className="space-y-2">
          {breakConditions.map((condition, idx) => (
            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span>{condition}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

