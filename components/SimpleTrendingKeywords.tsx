"use client";

import { useEffect, useState } from "react";
import { Flame, TrendingUp } from "lucide-react";

export default function SimpleTrendingKeywords() {
  const [keywords, setKeywords] = useState<Array<{ keyword: string; traffic: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    async function fetchTrendingKeywords() {
      try {
        const res = await fetch("/api/top-keywords", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.keywords && Array.isArray(data.keywords)) {
            setKeywords(data.keywords.slice(0, 10));
          }
        }
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch trending keywords:", error);
        setLoading(false);
      }
    }

    fetchTrendingKeywords();
    // Refresh every 15 minutes
    const interval = setInterval(fetchTrendingKeywords, 15 * 60 * 1000);
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <Flame className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            🔥 Trending Right Now
          </h3>
          <p className="text-xs text-slate-600">
            Live from Google Trends • Updated {lastUpdate}
          </p>
        </div>
      </div>

      {keywords.length === 0 ? (
        <p className="text-center text-slate-600 py-8">
          No trending keywords available at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {keywords.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white/80 hover:bg-white border border-orange-200 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm sm:text-base truncate group-hover:text-orange-700 transition-colors">
                    {item.keyword}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs text-slate-600 font-medium">
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
