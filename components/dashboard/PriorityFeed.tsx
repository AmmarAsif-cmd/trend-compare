/**
 * Priority Feed - Needs Your Attention
 * Shows actionable changes requiring attention
 */

'use client';

import { AlertCircle, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Minus } from 'lucide-react';
import Link from 'next/link';

export interface PriorityFeedItem {
  slug: string;
  termA: string;
  termB: string;
  changeType: 'gap_change' | 'leader_flip' | 'volatility_increase' | 'confidence_drop';
  changeSummary: string;
  severity: 'high' | 'medium' | 'low';
  lastChecked: Date;
}

interface PriorityFeedProps {
  items: PriorityFeedItem[];
}

export default function PriorityFeed({ items }: PriorityFeedProps) {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (items.length === 0) {
    return null;
  }

  const getSeverityBadge = (severity: string) => {
    const classes = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return classes[severity as keyof typeof classes] || classes.low;
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'leader_flip':
        return AlertCircle;
      case 'gap_change':
        return TrendingUp;
      case 'volatility_increase':
        return AlertTriangle;
      case 'confidence_drop':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-50/80 via-orange-50/80 to-amber-50/80 px-6 py-5 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Needs Your Attention</h2>
              <p className="text-sm text-slate-600">Actionable changes requiring review</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
            {items.length}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {items.map((item, idx) => {
            const ChangeIcon = getChangeIcon(item.changeType);
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ChangeIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <h3 className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                        {formatTerm(item.termA)} vs {formatTerm(item.termB)}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(item.severity)}`}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{item.changeSummary}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Link
                        href={`/compare/${item.slug}`}
                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        Open
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link
                        href={`/dashboard/comparisons?slug=${item.slug}`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-700"
                      >
                        Track
                      </Link>
                      <Link
                        href={`/dashboard/alerts?slug=${item.slug}`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-700"
                      >
                        Alert
                      </Link>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(item.lastChecked).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
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

