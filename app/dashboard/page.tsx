/**
 * Dashboard Page
 * Professional, data-rich trend intelligence workspace
 * With left sidebar and multiple functional sections
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getSavedComparisons } from '@/lib/saved-comparisons';
import { getComparisonHistory } from '@/lib/comparison-history';
import {
  getActiveAlertsCount,
  getTriggeredAlertsCount,
  getRecentlyChangedCount,
  getHighVolatilityCount,
  getConfidenceDropsCount,
  getPriorityFeedItems,
  getCategoryInsights,
  getRecentExports,
  enrichSavedComparisons,
} from '@/lib/dashboard-helpers';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import TodayOverviewCards from '@/components/dashboard/TodayOverviewCards';
import PriorityFeed from '@/components/dashboard/PriorityFeed';
import TrackedComparisonsTable from '@/components/dashboard/TrackedComparisonsTable';
import ResumeHistory from '@/components/dashboard/ResumeHistory';
import InsightsSnapshot from '@/components/dashboard/InsightsSnapshot';
import ReportsExports from '@/components/dashboard/ReportsExports';
import { Bookmark } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const userId = (user as any).id;

  // Fetch all dashboard data in parallel
  const [
    savedResult,
    historyResult,
    activeAlertsCount,
    triggeredAlertsCount,
    recentlyChangedCount,
    highVolatilityCount,
    confidenceDropsCount,
    priorityFeedItems,
    categoryInsights,
    recentExports,
  ] = await Promise.all([
    getSavedComparisons(50, 0),
    getComparisonHistory(5, 0),
    getActiveAlertsCount(),
    getTriggeredAlertsCount(),
    getRecentlyChangedCount(),
    getHighVolatilityCount(),
    getConfidenceDropsCount(),
    getPriorityFeedItems(6),
    getCategoryInsights(),
    getRecentExports(5),
  ]);

  // Enrich saved comparisons with current data
  const enrichedSaved = await enrichSavedComparisons(savedResult.comparisons, userId);

  return (
    <div className="flex h-screen overflow-hidden" data-dashboard-layout>
      {/* Left Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-slate-600">
              Your trend intelligence workspace
            </p>
          </div>

          {/* Today's Overview - Signal-based Cards */}
          <div className="mb-8">
            <TodayOverviewCards
              trackedCount={savedResult.total}
              changedThisWeek={recentlyChangedCount}
              activeAlerts={activeAlertsCount}
              triggeredAlerts={triggeredAlertsCount}
              highVolatility={highVolatilityCount}
              confidenceDrops={confidenceDropsCount}
            />
          </div>

          {/* Priority Feed - Needs Your Attention */}
          {priorityFeedItems.length > 0 && (
            <div className="mb-8">
              <PriorityFeed items={priorityFeedItems} />
            </div>
          )}

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Primary Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tracked Comparisons */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 px-6 py-5 border-b border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Tracked Comparisons</h2>
                    </div>
                    {savedResult.total > 0 && (
                      <span className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
                        {savedResult.total}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <TrackedComparisonsTable comparisons={enrichedSaved} />
                </div>
              </section>
            </div>

            {/* Right Column - Secondary Content */}
            <div className="space-y-6">
              {/* Resume & History */}
              <ResumeHistory history={historyResult.history} />

              {/* Insights Snapshot */}
              {categoryInsights.length > 0 && (
                <InsightsSnapshot insights={categoryInsights} />
              )}

              {/* Reports & Exports */}
              {recentExports.length > 0 && (
                <ReportsExports exports={recentExports} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
