"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, TrendingUp, Clock, Users } from "lucide-react";

interface TrendingItem {
  slug: string;
  title: string;
  count: number;
  tf?: string;
  geo?: string;
}

export default function LiveTrendingDashboard() {
  const [comparisonsToday, setComparisonsToday] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real trending data
  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/top-week", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items: TrendingItem[] = Array.isArray(data.items) ? data.items : [];

        // Take top 30 items
        setTrendingItems(items.slice(0, 30));

        // Calculate total comparisons from counts
        const totalComparisons = items.reduce((sum, item) => sum + (item.count || 0), 0);
        setComparisonsToday(totalComparisons);

        // Estimate active users (roughly 10-20% of total comparisons)
        const estimatedUsers = Math.floor(totalComparisons * 0.15);
        setActiveUsers(estimatedUsers);

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch trending data:", error);
        setLoading(false);
      }
    }

    fetchTrending();

    // Refresh every 5 minutes
    const interval = setInterval(fetchTrending, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl border-2 border-orange-200 p-6 sm:p-8 shadow-xl animate-pulse">
        <div className="h-32 bg-white/50 rounded-xl"></div>
      </div>
    );
  }

  if (!trendingItems.length) return null;

  return (
    <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl border-2 border-orange-200 p-6 sm:p-8 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Live Trending
            </h3>
            <p className="text-xs text-slate-600">Updated every 5 minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-slate-600 font-medium">This Week</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {comparisonsToday.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">comparisons</div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-slate-600 font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeUsers}
          </div>
          <div className="text-xs text-slate-500">users</div>
        </div>
      </div>

      {/* Trending List - Show top 5 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-600" />
          <h4 className="font-semibold text-slate-900">Most Compared Right Now</h4>
        </div>

        <div className="space-y-2">
          {trendingItems.slice(0, 5).map((item, idx) => (
            <Link
              key={item.slug}
              href={`/compare/${item.slug}`}
              className="block group"
            >
              <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                idx === 0
                  ? 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-orange-300'
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                      {item.title}
                    </div>
                    {idx === 0 && (
                      <span className="text-xs text-orange-600 font-semibold">
                        🔥 Hot now
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-green-600">{item.count} views</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Auto-update indicator */}
        <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Updates every 5 minutes</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-600">
          Join {activeUsers.toLocaleString()}+ users exploring trends
        </p>
      </div>
    </div>
  );
}
