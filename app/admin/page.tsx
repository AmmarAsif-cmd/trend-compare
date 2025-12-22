"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ADMIN_ROUTES } from "@/lib/admin-config";

type Stats = {
  comparisons: { total: number; today: number };
  keywords: { total: number; approved: number; pending: number };
  blogPosts: { total: number; published: number; pending: number };
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

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

      // Fetch dashboard stats
      await fetchStats();
    } catch (err) {
      console.error("Auth check failed:", err);
      router.push(ADMIN_ROUTES.login);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch comparisons count
      const comparisonsRes = await fetch("/api/admin/stats/comparisons");
      const comparisonsData = await comparisonsRes.json();

      // Fetch keywords count
      const keywordsRes = await fetch("/api/admin/keywords?limit=1");
      const keywordsData = await keywordsRes.json();

      // Fetch blog posts count
      const blogRes = await fetch("/api/admin/blog/posts?limit=1");
      const blogData = await blogRes.json();

      setStats({
        comparisons: comparisonsData.stats || { total: 0, today: 0 },
        keywords: keywordsData.stats || { total: 0, approved: 0, pending: 0 },
        blogPosts: blogData.stats || { total: 0, published: 0, pending: 0 },
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // Set default stats
      setStats({
        comparisons: { total: 0, today: 0 },
        keywords: { total: 0, approved: 0, pending: 0 },
        blogPosts: { total: 0, published: 0, pending: 0 },
      });
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to TrendArc Control Center</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Comparisons Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Comparisons</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats?.comparisons.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +{stats?.comparisons.today || 0} today
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          {/* Keywords Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Keywords</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats?.keywords.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.keywords.approved || 0} approved, {stats?.keywords.pending || 0} pending
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔑</span>
              </div>
            </div>
          </div>

          {/* Blog Posts Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blog Posts</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats?.blogPosts.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.blogPosts.published || 0} published, {stats?.blogPosts.pending || 0} pending
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={ADMIN_ROUTES.keywords}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <span className="text-2xl">🔑</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Keywords</h3>
                  <p className="text-sm text-gray-600">Manage & seed keywords</p>
                </div>
              </div>
            </Link>

            <Link
              href={ADMIN_ROUTES.blog}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Blog</h3>
                  <p className="text-sm text-gray-600">Manage blog posts</p>
                </div>
              </div>
            </Link>

            <Link
              href={ADMIN_ROUTES.system}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <span className="text-2xl">🔧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">System</h3>
                  <p className="text-sm text-gray-600">System monitoring</p>
                </div>
              </div>
            </Link>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <span className="text-2xl">🌐</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Site</h3>
                  <p className="text-sm text-gray-600">Open in new tab</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Management Modules</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📊</span> Comparisons
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• View all trend comparisons</li>
                <li>• Monitor popular pages</li>
                <li>• Track search performance</li>
              </ul>
              <Link
                href={ADMIN_ROUTES.system}
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Open System Dashboard →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔑</span> Keywords
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Import 340+ curated keywords</li>
                <li>• Seed comparisons automatically</li>
                <li>• Quality scoring & approval</li>
              </ul>
              <Link
                href={ADMIN_ROUTES.keywords}
                className="mt-4 inline-block text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Manage Keywords →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> Content
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• AI-generated blog posts</li>
                <li>• Review & publish workflow</li>
                <li>• SEO optimization tools</li>
              </ul>
              <Link
                href={ADMIN_ROUTES.blog}
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Manage Blog →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
