/**
 * WhatChanged Component
 * Shows what changed since last check or previous period
 */

'use client';

import { Info, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useState } from 'react';

interface WhatChangedProps {
  gapChangePoints: number;
  confidenceChange: number;
  agreementChange: number;
  volatilityDelta: number;
  hasHistory: boolean;
}

export default function WhatChanged({
  gapChangePoints,
  confidenceChange,
  agreementChange,
  volatilityDelta,
  hasHistory,
}: WhatChangedProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const changes = [
    {
      label: 'Gap',
      value: gapChangePoints,
      unit: 'points',
      direction: gapChangePoints > 0.1 ? 'widened' : gapChangePoints < -0.1 ? 'narrowed' : 'unchanged',
      magnitude: Math.abs(gapChangePoints),
      icon: gapChangePoints > 0.1 ? ArrowUp : gapChangePoints < -0.1 ? ArrowDown : Minus,
      color: gapChangePoints > 0.1 ? 'text-blue-600' : gapChangePoints < -0.1 ? 'text-green-600' : 'text-slate-500',
    },
    {
      label: 'Confidence',
      value: confidenceChange,
      unit: '%',
      direction: confidenceChange > 0.1 ? 'improved' : confidenceChange < -0.1 ? 'declined' : 'unchanged',
      magnitude: Math.abs(confidenceChange),
      icon: confidenceChange > 0.1 ? ArrowUp : confidenceChange < -0.1 ? ArrowDown : Minus,
      color: confidenceChange > 0.1 ? 'text-green-600' : confidenceChange < -0.1 ? 'text-amber-600' : 'text-slate-500',
    },
    {
      label: hasHistory ? 'Source agreement' : 'Volatility',
      value: hasHistory ? agreementChange : volatilityDelta,
      unit: hasHistory ? '%' : '%',
      direction: hasHistory
        ? (agreementChange > 0.1 ? 'improved' : agreementChange < -0.1 ? 'declined' : 'unchanged')
        : (volatilityDelta < -0.1 ? 'reduced' : volatilityDelta > 0.1 ? 'increased' : 'unchanged'),
      magnitude: Math.abs(hasHistory ? agreementChange : volatilityDelta),
      icon: hasHistory
        ? (agreementChange > 0.1 ? ArrowUp : agreementChange < -0.1 ? ArrowDown : Minus)
        : (volatilityDelta < -0.1 ? ArrowDown : volatilityDelta > 0.1 ? ArrowUp : Minus),
      color: hasHistory
        ? (agreementChange > 0.1 ? 'text-green-600' : agreementChange < -0.1 ? 'text-amber-600' : 'text-slate-500')
        : (volatilityDelta < -0.1 ? 'text-green-600' : volatilityDelta > 0.1 ? 'text-amber-600' : 'text-slate-500'),
    },
  ].filter(c => Math.abs(c.value) > 0.1); // Only show significant changes

  if (changes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
          What changed {hasHistory ? 'since last check' : 'vs previous period'}
        </h3>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-slate-500 hover:text-slate-700"
          >
            <Info className="w-4 h-4" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-6 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-10">
              {hasHistory 
                ? 'Compares current metrics with your last view of this comparison.'
                : 'Compares current period metrics with the previous period from the time series data.'}
            </div>
          )}
        </div>
      </div>
      <ul className="space-y-2.5">
        {changes.slice(0, 3).map((change, idx) => {
          const Icon = change.icon;
          return (
            <li key={idx} className="flex items-center gap-3 text-sm">
              <Icon className={`w-4 h-4 ${change.color} flex-shrink-0`} />
              <span className="text-slate-700 font-medium">
                {change.label} {change.direction}
                {change.direction !== 'unchanged' && (
                  <span className="text-slate-600 font-normal">
                    {' '}by {change.magnitude.toFixed(1)}{change.unit}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

