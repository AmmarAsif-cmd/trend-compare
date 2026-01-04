/**
 * History Page
 * Shows comparison viewing history
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getComparisonHistory } from '@/lib/comparison-history';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import ResumeHistory from '@/components/dashboard/ResumeHistory';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/history');
  }

  const historyResult = await getComparisonHistory(50, 0);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="flex h-screen overflow-hidden" data-dashboard-layout>
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
              History
            </h1>
            <p className="text-lg text-slate-600">
              Your comparison viewing history
            </p>
          </div>

          {/* History List */}
          {historyResult.history.length > 0 ? (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-blue-50/80 px-6 py-5 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Recent Views</h2>
                  </div>
                  <span className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
                    {historyResult.total}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {historyResult.history.map((item) => (
                    <Link
                      key={item.id}
                      href={`/compare/${item.slug}${item.timeframe !== '12m' ? `?tf=${item.timeframe}` : ''}${item.geo ? `&geo=${item.geo}` : ''}`}
                      className="block p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors mb-2">
                            {formatTerm(item.termA)} vs {formatTerm(item.termB)}
                          </h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                              {item.timeframe}
                            </span>
                            {item.geo && (
                              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                                {item.geo}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(item.viewedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No history yet</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Comparisons you view will appear here
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Browse Comparisons
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

