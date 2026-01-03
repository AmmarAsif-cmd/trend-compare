/**
 * Trust and Insights Section
 * Merged section: "Why you can trust this result"
 * Combines key insights and trust metrics
 */

'use client';

import { ShieldCheck } from 'lucide-react';

interface TrustAndInsightsProps {
  insights: string[];
  confidence: number;
  agreementIndex: number;
  dataFreshness: {
    lastUpdatedAt: string;
    source: string;
  };
}

export default function TrustAndInsights({
  insights,
  confidence,
  agreementIndex,
  dataFreshness,
}: TrustAndInsightsProps) {
  // Combine insights with trust metrics into 3 bullets max
  const bullets: string[] = [];

  // Add insights (limit to 2 to leave room for trust metrics)
  if (insights.length > 0) {
    bullets.push(...insights.slice(0, 2));
  }

  // Add trust metrics as bullets
  if (confidence >= 80) {
    bullets.push(`High confidence (${confidence.toFixed(0)}%) based on consistent data`);
  } else if (confidence >= 60) {
    bullets.push(`Moderate confidence (${confidence.toFixed(0)}%) - results are reliable`);
  }

  if (agreementIndex >= 80 && bullets.length < 3) {
    bullets.push(`Strong source agreement (${agreementIndex.toFixed(0)}%) across data sources`);
  }

  // Limit to 3 bullets
  const displayBullets = bullets.slice(0, 3);

  if (displayBullets.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
        Why you can trust this result
      </h3>
      <ul className="space-y-2.5">
        {displayBullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-green-600 mt-1 flex-shrink-0">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-3">
        Data updated: {new Date(dataFreshness.lastUpdatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

