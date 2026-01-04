/**
 * Tracked Comparisons Table
 * Upgraded table with actions and enriched data
 */

'use client';

import { useState } from 'react';
import { ArrowRight, ChevronUp, ChevronDown, Minus, Download, Trash2, Bell, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EnrichedSavedComparison } from '@/lib/dashboard-helpers';

interface TrackedComparisonsTableProps {
  comparisons: EnrichedSavedComparison[];
}

export default function TrackedComparisonsTable({ comparisons }: TrackedComparisonsTableProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleUnsave = async (slug: string) => {
    if (removing) return;
    setRemoving(slug);
    try {
      const response = await fetch(`/api/comparisons/save?slug=${slug}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to unsave comparison:', error);
    } finally {
      setRemoving(null);
    }
  };

  const handleRefresh = async (slug: string) => {
    if (refreshing) return;
    setRefreshing(slug);
    try {
      const response = await fetch(`/api/snapshots/generate?slug=${encodeURIComponent(slug)}`, {
        method: 'POST',
      });
      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to generate snapshot' }));
        console.error('Failed to generate snapshot:', error);
        alert(error.error || 'Failed to generate snapshot. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate snapshot:', error);
      alert('Failed to generate snapshot. Please try again.');
    } finally {
      setRefreshing(null);
    }
  };

  const hasSnapshot = (comp: EnrichedSavedComparison) => {
    return comp.currentLeader !== undefined && 
           comp.margin !== undefined && 
           comp.confidence !== undefined;
  };

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">No tracked comparisons yet</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Start Tracking
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Comparison</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Winner</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Margin</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Trend</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Confidence</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Last Updated</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((comp) => {
            const TrendIcon = comp.changeIndicator === 'up' ? ChevronUp :
                             comp.changeIndicator === 'down' ? ChevronDown : Minus;
            const trendColor = comp.changeIndicator === 'up' ? 'text-emerald-600' :
                              comp.changeIndicator === 'down' ? 'text-red-600' : 'text-slate-400';

            return (
              <tr key={comp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <Link
                    href={`/compare/${comp.slug}`}
                    className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    {formatTerm(comp.termA)} vs {formatTerm(comp.termB)}
                  </Link>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      slug: {comp.slug}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {comp.currentLeader ? (
                    <span className="text-sm text-slate-700">{formatTerm(comp.currentLeader)}</span>
                  ) : (
                    <span className="text-sm text-slate-500">Not generated</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {comp.margin !== undefined ? (
                    <span className="text-sm font-medium text-slate-700">{comp.margin.toFixed(1)} pts</span>
                  ) : (
                    <span className="text-sm text-slate-500">Not generated</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {hasSnapshot(comp) ? (
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-300" />
                  )}
                </td>
                <td className="py-3 px-4">
                  {comp.confidence !== undefined ? (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      comp.confidence >= 70 ? 'bg-emerald-50 text-emerald-700' :
                      comp.confidence >= 50 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {comp.confidence.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">Not generated</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {comp.lastUpdated ? (
                    <span className="text-xs text-slate-500">
                      {new Date(comp.lastUpdated).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Never</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {!hasSnapshot(comp) && (
                      <button
                        onClick={() => handleRefresh(comp.slug)}
                        disabled={refreshing === comp.slug}
                        className="p-1.5 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                        title="Refresh Snapshot"
                      >
                        <RefreshCw className={`w-4 h-4 text-indigo-600 ${refreshing === comp.slug ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <Link
                      href={`/compare/${comp.slug}`}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                      title="Open"
                    >
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    </Link>
                    <Link
                      href={`/dashboard/alerts?slug=${comp.slug}`}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                      title="Manage Alert"
                    >
                      <Bell className="w-4 h-4 text-slate-600" />
                    </Link>
                    <a
                      href={`/api/comparisons/export?format=pdf&slug=${comp.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                      title="Export PDF"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                    </a>
                    <button
                      onClick={() => handleUnsave(comp.slug)}
                      disabled={removing === comp.slug}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Untrack"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

