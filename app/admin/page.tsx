"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ADMIN_ROUTES } from "@/lib/admin-config";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  FileText,
  Key,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

type Stats = {
  comparisons: { total: number; today: number };
  keywords: { total: number; approved: number; pending: number };
  blogPosts: { total: number; published: number; pending: number };
  users: {
    total: number;
    active: number;
    newToday: number;
    authentication: {
      google: number;
      email: number;
    };
  };
};

type Analytics = {
  users: {
    total: number;
    active: number;
    activePercentage: number;
    newToday: number;
    newLast7Days: number;
    newLast30Days: number;
    dailySignups: Array<{ date: string; count: number }>;
    authentication: {
      google: number;
      email: number;
    };
  };
  comparisons: {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
    topComparisons: Array<{
      slug: string;
      views: number;
      visits: number;
      category: string | null;
      lastVisited: Date | null;
    }>;
    categoryBreakdown: Array<{ category: string; count: number }>;
  };
  views: {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
    dailyViews: Array<{ date: string; count: number }>;
  };
  engagement: {
    usersWithSavedComparisons: number;
    usersWithTrendAlerts: number;
    totalSavedComparisons: number;
    totalTrendAlerts: number;
    engagementRate: number;
  };
  content: {
    blogPosts: {
      total: number;
      published: number;
      draft: number;
      totalViews: number;
    };
    keywords: {
      total: number;
      approved: number;
      pending: number;
    };
  };
  forecasts: {
    total: number;
    evaluated: number;
    recent: number;
    evaluationRate: number;
  };
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(ADMIN_ROUTES.api.checkAuth);
      const data = await res.json();

      if (!data.authenticated) {
        router.push(ADMIN_ROUTES.login);
        return;
      }

      await Promise.all([fetchStats(), fetchAnalytics()]);
    } catch (err) {
      console.error("Auth check failed:", err);
      setError("Failed to authenticate. Please try again.");
      setLoading(false);
      router.push(ADMIN_ROUTES.login);
    }
  };

  const fetchStats = async () => {
    try {
      setError(null);
      const [comparisonsRes, keywordsRes, blogRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats/comparisons"),
        fetch("/api/admin/keywords?limit=1"),
        fetch("/api/admin/blog/posts?limit=1"),
        fetch("/api/admin/stats/subscribers"),
      ]);

      // Check if any request failed
      if (!comparisonsRes.ok || !keywordsRes.ok || !blogRes.ok || !usersRes.ok) {
        throw new Error("One or more API requests failed");
      }

      const [comparisonsData, keywordsData, blogData, usersData] = await Promise.all([
        comparisonsRes.json(),
        keywordsRes.json(),
        blogRes.json(),
        usersRes.json(),
      ]);

      setStats({
        comparisons: comparisonsData.stats || { total: 0, today: 0 },
        keywords: keywordsData.stats || { total: 0, approved: 0, pending: 0 },
        blogPosts: blogData.stats || { total: 0, published: 0, pending: 0 },
        users: usersData.success && usersData.stats ? usersData.stats : {
          total: 0,
          active: 0,
          newToday: 0,
          authentication: { google: 0, email: 0 },
        },
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setError("Failed to load dashboard statistics. Please refresh the page.");
      setStats({
        comparisons: { total: 0, today: 0 },
        keywords: { total: 0, approved: 0, pending: 0 },
        blogPosts: { total: 0, published: 0, pending: 0 },
        users: {
          total: 0,
          active: 0,
          newToday: 0,
          authentication: { google: 0, email: 0 },
        },
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/stats/analytics");
      if (!res.ok) {
        throw new Error("Analytics API request failed");
      }
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error("Analytics API returned error:", data.error);
        setError("Failed to load analytics data. Some features may not be available.");
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError("Failed to load analytics data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchAnalytics()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;

    try {
      await fetch(ADMIN_ROUTES.api.logout, { method: "POST" });
      router.push(ADMIN_ROUTES.login);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header - with margin for mobile menu button */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 lg:ml-0 mt-14 lg:mt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome to TrendArc Admin</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => {
                    setError(null);
                    handleRefresh();
                  }}
                  className="text-red-700 hover:text-red-900 underline text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {stats?.users.total.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {stats?.users.active || 0} active
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* New Users Today */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">New Users Today</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.users.newToday || 0}
                  </p>
                  {analytics && analytics.users && (
                    <div className="flex items-center gap-1 mt-2">
                      {(analytics.users.newLast7Days || 0) > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs text-gray-500">
                        {analytics.users.newLast7Days || 0} this week
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Comparisons */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Comparisons</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats?.comparisons.total.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {analytics?.views.total.toLocaleString() || 0} total views
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Engagement Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics?.engagement?.engagementRate ? analytics.engagement.engagementRate.toFixed(1) : '0.0'}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {analytics?.engagement?.usersWithSavedComparisons || 0} engaged users
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts Section */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* User Growth Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  User Growth (Last 30 Days)
                </h3>
                <div className="h-64 flex items-end justify-between gap-1">
                  {analytics.users?.dailySignups?.map((day, idx) => {
                    const maxCount = Math.max(...(analytics.users.dailySignups || []).map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t transition-all hover:from-indigo-600 hover:to-indigo-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.date}: ${day.count} users`}
                        />
                        {idx % 5 === 0 && (
                          <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Total: {analytics.users?.newLast30Days || 0} new users
                  </span>
                  <span className="text-gray-600">
                    Active: {analytics.users?.active || 0} ({analytics.users?.activePercentage || 0}%)
                  </span>
                </div>
              </div>

              {/* Page Views Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Page Views (Last 30 Days)
                </h3>
                <div className="h-64 flex items-end justify-between gap-1">
                  {analytics.views?.dailyViews?.map((day, idx) => {
                    const maxCount = Math.max(...(analytics.views.dailyViews || []).map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.date}: ${day.count} views`}
                        />
                        {idx % 5 === 0 && (
                          <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Total: {(analytics.views?.total || 0).toLocaleString()} views
                  </span>
                  <span className="text-gray-600">
                    Last 7 days: {(analytics.views?.last7Days || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Content Stats */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Content
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Blog Posts</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats?.blogPosts.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Published</span>
                  <span className="text-sm font-semibold text-green-600">
                    {stats?.blogPosts.published || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Views</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {(analytics?.content?.blogPosts?.totalViews || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Keywords Stats */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                Keywords
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats?.keywords.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="text-sm font-semibold text-green-600">
                    {stats?.keywords.approved || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {stats?.keywords.pending || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Forecasts Stats */}
            {analytics && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Forecasts
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {analytics?.forecasts?.total || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Evaluated</span>
                    <span className="text-sm font-semibold text-green-600">
                      {analytics?.forecasts?.evaluated || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Evaluation Rate</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {analytics?.forecasts?.evaluationRate ? analytics.forecasts.evaluationRate.toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Comparisons & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Comparisons */}
            {analytics && analytics.comparisons?.topComparisons && analytics.comparisons.topComparisons.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Top Comparisons
                </h3>
                <div className="space-y-3">
                  {analytics.comparisons.topComparisons.slice(0, 5).map((comp, idx) => (
                    <Link
                      key={comp.slug}
                      href={`/compare/${comp.slug}`}
                      target="_blank"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-400 w-6">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                            {comp.slug.replace(/-vs-/g, ' vs ')}
                          </span>
                        </div>
                        {comp.category && (
                          <span className="text-xs text-gray-500 ml-8 capitalize">
                            {comp.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{comp.views.toLocaleString()} views</span>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href={ADMIN_ROUTES.users}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900 group-hover:text-indigo-600">
                    Manage Users
                  </span>
                </Link>
                <Link
                  href={ADMIN_ROUTES.keywords}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Key className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900 group-hover:text-purple-600">
                    Manage Keywords
                  </span>
                </Link>
                <Link
                  href={ADMIN_ROUTES.blog}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900 group-hover:text-blue-600">
                    Manage Blog
                  </span>
                </Link>
                <Link
                  href={ADMIN_ROUTES.system}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Activity className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900 group-hover:text-gray-600">
                    System Monitoring
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
