/**
 * Personal Dashboard Page
 * Shows user's saved comparisons, history, and statistics
 */

import { redirect } from 'next/navigation';
import { getCurrentUser, getUserWithSubscription, canAccessPremium } from '@/lib/user-auth-helpers';
import { getSavedComparisons } from '@/lib/saved-comparisons';
import { getComparisonHistory, getMostViewedComparisons } from '@/lib/comparison-history';
import { getTodayComparisonCount } from '@/lib/daily-limit';
import { getUserStatistics, getUserAchievements } from '@/lib/user-statistics';
import { UserStatisticsPanel } from '@/components/UserStatistics';
import Link from 'next/link';
import { Bookmark, Clock, TrendingUp, BarChart3, ArrowRight, Search, Plus, Bell, Calendar } from 'lucide-react';

const FREE_USER_DAILY_LIMIT = 20;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const userId = (user as any).id;
  const isPremium = await canAccessPremium();
  const fullUser = await getUserWithSubscription(userId);

  // Get today's comparison count for free users
  let todayCount = 0;
  if (!isPremium) {
    todayCount = await getTodayComparisonCount(userId);
  }

  // Fetch user data
  const [savedResult, historyResult, mostViewed, userStats, userAchievements] = await Promise.all([
    getSavedComparisons(50, 0),
    getComparisonHistory(20, 0),
    getMostViewedComparisons(10),
    getUserStatistics(userId),
    getUserAchievements(userId),
  ]);

  // Debug logging
  console.log('[Dashboard] History result:', {
    total: historyResult.total,
    count: historyResult.history.length,
    history: historyResult.history.map(h => ({ slug: h.slug, viewedAt: h.viewedAt })),
  });

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
            Welcome back, {fullUser?.name || 'there'}! 👋
          </h1>
          <p className="text-lg text-slate-600">
            Here's your TrendArc overview and achievements
          </p>
        </div>

        {/* Statistics and Achievements Panel */}
        <div className="mb-8">
          <UserStatisticsPanel stats={userStats} achievements={userAchievements} />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Saved Comparisons</p>
                <p className="text-3xl font-bold text-slate-900">{savedResult.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Recent Views</p>
                <p className="text-3xl font-bold text-slate-900">{historyResult.total}</p>
              </div>
            </div>
          </div>

          {!isPremium ? (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Today's Usage</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {todayCount}
                    <span className="text-lg text-blue-700">/{FREE_USER_DAILY_LIMIT}</span>
                  </p>
                </div>
              </div>
              <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    todayCount >= FREE_USER_DAILY_LIMIT
                      ? "bg-red-500"
                      : todayCount >= FREE_USER_DAILY_LIMIT - 5
                      ? "bg-orange-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min((todayCount / FREE_USER_DAILY_LIMIT) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {FREE_USER_DAILY_LIMIT - todayCount > 0
                  ? `${FREE_USER_DAILY_LIMIT - todayCount} comparison${FREE_USER_DAILY_LIMIT - todayCount === 1 ? "" : "s"} remaining`
                  : "Daily limit reached"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Most Viewed</p>
                  <p className="text-3xl font-bold text-slate-900">{mostViewed.length}</p>
                </div>
              </div>
            </div>
          )}

          {isPremium ? (
            <Link
              href="/account"
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-purple-400 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900 mb-1">Premium Status</p>
                  <p className="text-lg font-bold text-purple-900">Active</p>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-purple-400 group"
            >
              <div className="flex flex-col">
                <p className="text-sm font-medium text-purple-900 mb-2">Upgrade to Premium</p>
                <p className="text-xs text-purple-700 mb-3">Unlimited comparisons + AI insights</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-900">$4.99/mo</span>
                  <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Saved Comparisons */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Saved Comparisons</h2>
                </div>
                {savedResult.total > 0 && (
                  <span className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
                    {savedResult.total}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {savedResult.comparisons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-medium mb-2">No saved comparisons yet</p>
                  <p className="text-sm text-slate-600 mb-6">
                    Save comparisons to quickly access them later
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
                <div className="space-y-3">
                  {savedResult.comparisons.map((comparison) => (
                    <Link
                      key={comparison.id}
                      href={`/compare/${comparison.slug}`}
                      className="block p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-white transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                            {formatTerm(comparison.termA)} vs {formatTerm(comparison.termB)}
                          </h3>
                          {comparison.category && (
                            <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-2">
                              {comparison.category}
                            </span>
                          )}
                          {comparison.notes && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {comparison.notes}
                            </p>
                          )}
                          {comparison.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {comparison.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-3">
                            Saved {new Date(comparison.savedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent History */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Recent Views</h2>
                </div>
                {historyResult.total > 0 && (
                  <span className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
                    {historyResult.total}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {historyResult.history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-medium mb-2">No recent views</p>
                  <p className="text-sm text-slate-600 mb-6">
                    Comparisons you view will appear here
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Start Comparing
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyResult.history.map((item) => (
                    <Link
                      key={item.id}
                      href={`/compare/${item.slug}${item.timeframe !== '12m' ? `?tf=${item.timeframe}` : ''}${item.geo ? `&geo=${item.geo}` : ''}`}
                      className="block p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-white transition-all group"
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
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Most Viewed (if any) */}
        {mostViewed.length > 0 && (
          <section className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Most Viewed Comparisons</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {mostViewed.map((item) => (
                  <Link
                    key={item.id}
                    href={`/compare/${item.slug}`}
                    className="block p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-gradient-to-br hover:from-emerald-50/50 hover:to-white transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors mb-1">
                          {formatTerm(item.termA)} vs {formatTerm(item.termB)}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Last viewed {new Date(item.viewedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
    </main>
  );
}
