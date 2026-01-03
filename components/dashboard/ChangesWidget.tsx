/**
 * Changes Widget
 * Shows top 5 tracked items that changed most since last check
 */

'use client';

import { TrendingUp, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ChangeItem {
  slug: string;
  termA: string;
  termB: string;
  marginChange: number;
  confidenceChange: number;
  alertTriggered?: boolean;
  lastChecked: Date;
}

interface ChangesWidgetProps {
  changes: ChangeItem[];
  filter?: 'tracked' | 'saved' | 'all';
}

export default function ChangesWidget({ changes, filter = 'all' }: ChangesWidgetProps) {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (changes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-900 font-medium mb-2">No significant changes detected</p>
          <p className="text-sm text-slate-600">
            Tracked comparisons will appear here when they change
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/80 to-red-50/80 px-6 py-5 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Recent Changes</h2>
          </div>
          <span className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
            {changes.length}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {changes.slice(0, 5).map((item, idx) => (
            <Link
              key={idx}
              href={`/compare/${item.slug}`}
              className="block p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-gradient-to-br hover:from-amber-50/50 hover:to-white transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors mb-2">
                    {formatTerm(item.termA)} vs {formatTerm(item.termB)}
                  </h3>
                  
                  <div className="flex flex-wrap gap-3 mb-2">
                    {Math.abs(item.marginChange) > 0.1 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        {item.marginChange > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={item.marginChange > 0 ? 'text-green-700' : 'text-red-700'}>
                          Gap {item.marginChange > 0 ? '+' : ''}{item.marginChange.toFixed(1)} pts
                        </span>
                      </div>
                    )}
                    
                    {Math.abs(item.confidenceChange) > 0.1 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        {item.confidenceChange > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={item.confidenceChange > 0 ? 'text-green-700' : 'text-red-700'}>
                          Confidence {item.confidenceChange > 0 ? '+' : ''}{item.confidenceChange.toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {item.alertTriggered && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 font-medium">Alert triggered</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Last checked {new Date(item.lastChecked).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

