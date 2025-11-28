"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, TrendingUp, Clock, Users } from "lucide-react";

interface TrendingItem {
  keyword: string;
  trend: string;
  isNew?: boolean;
  comparisonSlug?: string;
}

export default function LiveTrendingDashboard() {
  const [comparisonsToday, setComparisonsToday] = useState(1247);
  const [activeUsers, setActiveUsers] = useState(342);
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([
    { keyword: "iPhone vs Android", trend: "+15%", isNew: true, comparisonSlug: "iphone-vs-android" },
    { keyword: "Netflix vs Disney+", trend: "+12%", comparisonSlug: "netflix-vs-disney-plus" },
    { keyword: "Bitcoin vs Ethereum", trend: "+8%", comparisonSlug: "bitcoin-vs-ethereum" },
    { keyword: "React vs Vue", trend: "+6%", comparisonSlug: "react-vs-vue" },
    { keyword: "Tesla vs Toyota", trend: "+5%", comparisonSlug: "tesla-vs-toyota" },
  ]);

  useEffect(() => {
    // Simulate live updates (every 10 seconds)
    const interval = setInterval(() => {
      setComparisonsToday(prev => prev + Math.floor(Math.random() * 5));
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
        return Math.max(100, prev + change);
      });

      // Occasionally add a "new" item
      if (Math.random() > 0.7) {
        setTrendingItems(prev => {
          const updated = prev.map(item => ({ ...item, isNew: false }));
          // Random shuffle
          const randomIndex = Math.floor(Math.random() * updated.length);
          updated[randomIndex] = { ...updated[randomIndex], isNew: true };
          return updated;
        });
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

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
            <p className="text-xs text-slate-600">Updated in real-time</p>
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
            <span className="text-xs text-slate-600 font-medium">Today</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {comparisonsToday.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">comparisons</div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-slate-600 font-medium">Active Now</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeUsers}
          </div>
          <div className="text-xs text-slate-500">users online</div>
        </div>
      </div>

      {/* Trending List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-600" />
          <h4 className="font-semibold text-slate-900">Most Compared Right Now</h4>
        </div>

        <div className="space-y-2">
          {trendingItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.comparisonSlug ? `/compare/${item.comparisonSlug}` : '#'}
              className="block group"
            >
              <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                item.isNew
                  ? 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300 animate-pulse'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-orange-300'
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                      {item.keyword}
                    </div>
                    {item.isNew && (
                      <span className="text-xs text-orange-600 font-semibold">
                        🔥 Hot now
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-green-600">{item.trend}</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Auto-update indicator */}
        <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Updates every 10 seconds</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-600">
          Join the conversation and see what's trending
        </p>
      </div>
    </div>
  );
}
