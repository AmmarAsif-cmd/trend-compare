/**
 * Insight Evolution View
 * Shows timeline of snapshot points for a single tracked item
 */

'use client';

import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SnapshotPoint {
  date: Date;
  winner: string;
  margin: number;
  confidence: number;
  agreementIndex: number;
}

interface InsightEvolutionProps {
  slug: string;
  termA: string;
  termB: string;
  snapshots: SnapshotPoint[];
}

export default function InsightEvolution({
  slug,
  termA,
  termB,
  snapshots,
}: InsightEvolutionProps) {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (snapshots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-900 font-medium mb-2">No evolution data yet</p>
          <p className="text-sm text-slate-600">
            View this comparison multiple times to see how it evolves
          </p>
        </div>
      </div>
    );
  }

  // Sort by date (newest first)
  const sortedSnapshots = [...snapshots].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {formatTerm(termA)} vs {formatTerm(termB)}
        </h3>
        <p className="text-sm text-slate-600">Evolution over time</p>
      </div>

      <div className="space-y-4">
        {sortedSnapshots.map((snapshot, idx) => {
          const prevSnapshot = idx < sortedSnapshots.length - 1 ? sortedSnapshots[idx + 1] : null;
          const marginChange = prevSnapshot ? snapshot.margin - prevSnapshot.margin : 0;
          const confidenceChange = prevSnapshot ? snapshot.confidence - prevSnapshot.confidence : 0;

          return (
            <div
              key={idx}
              className="relative pl-8 pb-4 border-l-2 border-slate-200 last:border-l-0 last:pb-0"
            >
              <div className="absolute -left-2 top-0 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white"></div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(snapshot.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  
                  {prevSnapshot && (
                    <div className="flex items-center gap-2">
                      {Math.abs(marginChange) > 0.1 && (
                        <div className="flex items-center gap-1 text-xs">
                          {marginChange > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span className={marginChange > 0 ? 'text-green-700' : 'text-red-700'}>
                            {marginChange > 0 ? '+' : ''}{marginChange.toFixed(1)} pts
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Winner</p>
                    <p className="font-semibold text-slate-900">
                      {formatTerm(snapshot.winner)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Margin</p>
                    <p className="font-semibold text-slate-900">
                      {snapshot.margin.toFixed(1)} points
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Confidence</p>
                    <p className="font-semibold text-slate-900">
                      {snapshot.confidence.toFixed(0)}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Agreement</p>
                    <p className="font-semibold text-slate-900">
                      {snapshot.agreementIndex.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

