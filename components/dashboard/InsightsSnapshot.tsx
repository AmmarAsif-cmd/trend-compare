/**
 * Insights Snapshot
 * Category-level summaries (rule-based)
 */

'use client';

import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';

export interface CategoryInsight {
  category: string;
  summary: string;
  type: 'volatility' | 'stability' | 'trend';
}

interface InsightsSnapshotProps {
  insights: CategoryInsight[];
}

export default function InsightsSnapshot({ insights }: InsightsSnapshotProps) {
  if (insights.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'volatility':
        return TrendingUp;
      case 'stability':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'volatility':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'stability':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 px-6 py-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Insights Snapshot</h2>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = getIcon(insight.type);
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">{insight.category}</p>
                    <p className="text-sm">{insight.summary}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

