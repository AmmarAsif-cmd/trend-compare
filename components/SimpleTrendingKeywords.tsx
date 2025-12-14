"use client";

import { useEffect, useState } from "react";
import { Flame, TrendingUp } from "lucide-react";

export default function SimpleTrendingKeywords() {
  const [keywords, setKeywords] = useState<Array<{ keyword: string; traffic: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrendingKeywords = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      // Force fresh fetch with cache-busting timestamp
      const res = await fetch(`/api/top-keywords?t=${Date.now()}`, { 
        cache: "no-store",
        next: { revalidate: 0 } // Always fetch fresh
      });
      if (res.ok) {
        const data = await res.json();
        if (data.keywords && Array.isArray(data.keywords)) {
          setKeywords(data.keywords.slice(0, 10));
          setLastUpdate(new Date().toLocaleTimeString());
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch trending keywords:", error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchTrendingKeywords();
    
    // Refresh every 5 minutes for real-time updates (was 15 minutes)
    const interval = setInterval(() => fetchTrendingKeywords(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl border-2 border-orange-200 p-6 sm:p-8 shadow-xl animate-pulse">
        <div className="h-48 bg-white/50 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl border-2 border-orange-200 p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
          <Flame className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${refreshing ? 'animate-spin' : 'animate-pulse'}`} />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2 truncate">
              🔥 Trending Right Now
            </h3>
            <button
              onClick={() => fetchTrendingKeywords(true)}
              disabled={refreshing}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 self-start sm:self-auto"
              title="Refresh now"
            >
              {refreshing ? (
                <>
                  <span className="animate-spin">🔄</span> <span className="hidden sm:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  🔄 <span className="hidden sm:inline">Refresh</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1 break-words">
            <span className="hidden sm:inline">🔴 Live from Google Trends • </span>Updated {lastUpdate || 'Just now'}<span className="hidden sm:inline"> • Auto-refreshes every 5 minutes</span>
            {refreshing && <span className="ml-2 text-orange-600 font-medium">🔄 Updating...</span>}
          </p>
        </div>
      </div>

      {keywords.length === 0 ? (
        <p className="text-center text-slate-600 py-8">
          No trending keywords available at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {keywords.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white/80 hover:bg-white border border-orange-200 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm sm:text-base break-words group-hover:text-orange-700 transition-colors">
                    {item.keyword}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 font-medium truncate">
                      {item.traffic}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          💡 These are real-time trending topics from Google. Not clickable - for inspiration only!
        </p>
      </div>
    </div>
  );
}
