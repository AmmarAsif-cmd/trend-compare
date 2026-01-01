/**
 * Resume & History (Compact)
 * Last 5 viewed comparisons
 */

'use client';

import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HistoryItem {
  id: string;
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  viewedAt: Date;
}

interface ResumeHistoryProps {
  history: HistoryItem[];
}

export default function ResumeHistory({ history }: ResumeHistoryProps) {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-blue-50/80 px-6 py-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Resume Where You Left Off</h2>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-2">
          {history.map((item) => (
            <Link
              key={item.id}
              href={`/compare/${item.slug}${item.timeframe !== '12m' ? `?tf=${item.timeframe}` : ''}${item.geo ? `&geo=${item.geo}` : ''}`}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                  {formatTerm(item.termA)} vs {formatTerm(item.termB)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(item.viewedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

