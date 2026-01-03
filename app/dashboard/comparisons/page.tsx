/**
 * My Comparisons Page
 * Shows all saved/tracked comparisons with full data
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getSavedComparisons } from '@/lib/saved-comparisons';
import { enrichSavedComparisons } from '@/lib/dashboard-helpers';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import TrackedComparisonsTable from '@/components/dashboard/TrackedComparisonsTable';
import SnapshotDebugBanner from '@/components/dashboard/SnapshotDebugBanner';
import Link from 'next/link';
import { Search, Bookmark } from 'lucide-react';

export default async function MyComparisonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; slug?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/comparisons');
  }

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // Fetch saved comparisons
  const savedResult = await getSavedComparisons(100, 0);
  const userId = (user as any).id;
  const enrichedSaved = await enrichSavedComparisons(savedResult.comparisons, userId);

  // Apply filters if specified
  let filteredComparisons = enrichedSaved;
  if (params?.filter === 'volatility') {
    // Filter by high volatility (from snapshot data)
    filteredComparisons = enrichedSaved.filter(c => {
      // This would need to check volatility from snapshot
      // For now, we'll show all and let the table show volatility indicators
      return true;
    });
  } else if (params?.filter === 'confidence') {
    // Filter by declining confidence
    filteredComparisons = enrichedSaved.filter(c => {
      // This would need to check confidence trend from snapshots
      // For now, we'll show all
      return true;
    });
  }

  // Filter by slug if specified
  if (params?.slug) {
    filteredComparisons = filteredComparisons.filter(c => c.slug === params.slug);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
              My Comparisons
            </h1>
            <p className="text-lg text-slate-600">
              Track and manage your saved comparisons
            </p>
          </div>

          {/* Filter Badge */}
          {params?.filter && (
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                Filter: {params.filter === 'volatility' ? 'High Volatility' : 'Confidence Drops'}
                <Link
                  href="/dashboard/comparisons"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  ×
                </Link>
              </span>
            </div>
          )}

          {/* Debug Banner (Dev Only) */}
          <SnapshotDebugBanner comparisons={filteredComparisons} />

          {/* Tracked Comparisons Table */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Tracked Comparisons</h2>
                </div>
                {filteredComparisons.length > 0 && (
                  <span className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
                    {filteredComparisons.length}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {filteredComparisons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-medium mb-2">
                    {params?.filter ? 'No comparisons match this filter' : 'No tracked comparisons yet'}
                  </p>
                  <p className="text-sm text-slate-600 mb-6">
                    {params?.filter 
                      ? 'Try removing the filter or save more comparisons'
                      : 'Save comparisons to track changes and get alerts'}
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    <Search className="w-4 h-4" />
                    Browse Comparisons
                  </Link>
                </div>
              ) : (
                <TrackedComparisonsTable comparisons={filteredComparisons} />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

