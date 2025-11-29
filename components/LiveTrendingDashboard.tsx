"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, TrendingUp, Clock, Sparkles } from "lucide-react";

interface GoogleTrendingItem {
  title: string;
  formattedTraffic: string;
  relatedQueries?: string[];
  news?: { title: string; source: string }[];
}

export default function LiveTrendingDashboard() {
  const [trending, setTrending] = useState<GoogleTrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    async function fetchGoogleTrends() {
      try {
        const res = await fetch("/api/google-trending", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.trending && Array.isArray(data.trending)) {
            setTrending(data.trending.slice(0, 5));
          }
        }
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch Google trends:", error);
        // Fallback to mock data
        setTrending([
          { title: "Breaking news today", formattedTraffic: "500K+" },
          { title: "Trending topic now", formattedTraffic: "200K+" },
          { title: "Popular search", formattedTraffic: "150K+" },
          { title: "Viral topic", formattedTraffic: "100K+" },
          { title: "Hot topic today", formattedTraffic: "75K+" },
        ]);
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
      }
    }

    fetchGoogleTrends();
    // Refresh every 10 minutes
    const interval = setInterval(fetchGoogleTrends, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl border-2 border-orange-200 p-6 sm:p-8 shadow-xl animate-pulse">
        <div className="h-32 bg-white/50 rounded-xl"></div>
      </div>
    );
  }

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
              🌎 Google Trending Now
            </h3>
            <p className="text-xs text-slate-600">Updated {lastUpdate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">LIVE</span>
        </div>
      </div>

      {/* Trending List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <h4 className="font-semibold text-slate-900">Top Google Searches Right Now</h4>
        </div>

        <div className="space-y-2">
          {trending.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                idx === 0
                  ? 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 transition-colors truncate">
                    {item.title}
                  </div>
                  {idx === 0 && (
                    <span className="text-xs text-orange-600 font-semibold">
                      🔥 Trending globally
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">{item.formattedTraffic}</span>
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Auto-update indicator */}
        <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Live from Google Trends • Updates every 10 min</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-600">
          Compare any of these trends to discover insights
        </p>
      </div>
    </div>
  );
}
