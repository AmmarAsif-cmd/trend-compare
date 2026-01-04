"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ChartData {
  series: Array<{
    date: string;
    [key: string]: string | number;
  }>;
  terms: string[];
  totalA: number;
  totalB: number;
  totalSearches: number;
}

interface DynamicHeroChartClientProps {
  comparison: { slug: string; termA: string; termB: string } | null;
}

export default function DynamicHeroChartClient({ comparison }: DynamicHeroChartClientProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Default fallback
  const defaultComparison = {
    slug: 'chatgpt-vs-gemini',
    termA: 'chatgpt',
    termB: 'gemini',
  };
  
  const activeComparison = comparison || defaultComparison;

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        // Fetch comparison data using the daily rotated comparison
        const res = await fetch(`/api/compare?a=${activeComparison.termA}&b=${activeComparison.termB}&tf=12m`);
        if (!res.ok) {
          console.warn("[DynamicHeroChart] API returned non-OK status:", res.status);
          throw new Error("Failed to fetch");
        }
        const result = await res.json();

        if (mounted && result.series) {
          const terms = Object.keys(result.series[0]).filter(k => k !== "date");
          const totalA = result.series.reduce((sum: number, point: any) => sum + (Number(point[terms[0]]) || 0), 0);
          const totalB = result.series.reduce((sum: number, point: any) => sum + (Number(point[terms[1]]) || 0), 0);

          setData({
            series: result.series,
            terms,
            totalA,
            totalB,
            totalSearches: totalA + totalB,
          });
        }
      } catch (err) {
        console.error("[DynamicHeroChart] Error fetching chart data:", err);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [activeComparison.termA, activeComparison.termB]);

  // Show static demo when loading or error
  if (loading || !data || error) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border-2 border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-bold">
              {activeComparison.termA.charAt(0).toUpperCase() + activeComparison.termA.slice(1)} vs {activeComparison.termB.charAt(0).toUpperCase() + activeComparison.termB.slice(1)}
            </h3>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              {loading ? "LOADING..." : "EXAMPLE"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-sm">Last 12 months</span>
            <Link
              href={`/compare/${activeComparison.slug}`}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              View full <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="h-64 sm:h-80 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl mb-8 flex items-center justify-center">
          {loading ? (
            <div className="animate-pulse text-slate-400">Loading chart...</div>
          ) : (
            <div className="text-center">
              <div className="text-slate-600 text-sm mb-2">📊 Interactive comparison available</div>
              <Link
                href={`/compare/${activeComparison.slug}`}
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Click to view detailed analysis
              </Link>
            </div>
          )}
        </div>

        {!loading && (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="text-xs text-blue-600 font-semibold mb-2">
                {activeComparison.termA.charAt(0).toUpperCase() + activeComparison.termA.slice(1)}
              </div>
              <div className="text-2xl font-bold text-blue-600">~50%</div>
              <div className="text-xs text-slate-600">Typical share</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="text-xs text-purple-600 font-semibold mb-2">
                {activeComparison.termB.charAt(0).toUpperCase() + activeComparison.termB.slice(1)}
              </div>
              <div className="text-2xl font-bold text-purple-600">~50%</div>
              <div className="text-xs text-slate-600">Typical share</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { series, terms, totalA, totalB, totalSearches } = data;
  const aShare = totalSearches > 0 ? (totalA / totalSearches) * 100 : 0;
  const bShare = totalSearches > 0 ? (totalB / totalSearches) * 100 : 0;

  // Calculate SVG path from actual data
  const maxValue = Math.max(...series.map(p => Math.max(Number(p[terms[0]]) || 0, Number(p[terms[1]]) || 0)));
  const points = series.length;
  const width = 1000;
  const height = 400;

  const createPath = (termKey: string) => {
    return series.map((point, i) => {
      const x = (i / (points - 1)) * width;
      const value = Number(point[termKey]) || 0;
      const y = height - (value / 100) * height;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(" ");
  };

  const pathA = createPath(terms[0]);
  const pathB = createPath(terms[1]);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border-2 border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-bold">{terms[0]} vs {terms[1]}</h3>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">LIVE DATA</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <span className="text-slate-500 font-medium">Last 12 months</span>
          <Link
            href={`/compare/${activeComparison.slug}`}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            View full <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="relative h-64 sm:h-72 lg:h-80 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl overflow-hidden mb-8">
        {/* Grid */}
        <div className="absolute inset-0">
          <div className="h-full flex flex-col justify-between py-4 sm:py-8 px-4 sm:px-12">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="w-full border-t border-slate-200" />
            ))}
          </div>
        </div>

        <svg
          className="absolute inset-0 w-full h-full p-4 sm:p-12"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
        >
          {/* Blue line (first term) */}
          <path
            d={pathA}
            stroke="#3B82F6"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
          <path
            d={`${pathA} L 1000 400 L 0 400 Z`}
            fill="url(#blueGradient)"
            opacity="0.1"
          />

          {/* Purple line (second term) */}
          <path
            d={pathB}
            stroke="#A855F7"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
          <path
            d={`${pathB} L 1000 400 L 0 400 Z`}
            fill="url(#purpleGradient)"
            opacity="0.1"
          />

          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Legend + stats */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full shadow-md" />
          <span className="text-base font-bold text-slate-800">{terms[0]}</span>
          <span className="text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-full font-semibold">
            {aShare > bShare ? `Leading +${Math.round(aShare - bShare)}%` : `${Math.round(aShare)}%`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-purple-500 rounded-full shadow-md" />
          <span className="text-base font-bold text-slate-800">{terms[1]}</span>
          <span className="text-xs text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full font-semibold">
            {bShare > aShare ? `Leading +${Math.round(bShare - aShare)}%` : `${Math.round(bShare)}%`}
          </span>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center">
          <div className="bg-blue-50 rounded-xl p-4 sm:p-5 border-2 border-blue-200">
            <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-2 uppercase tracking-wide">{terms[0]}</div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1">
              {Math.round(aShare)}%
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium">Search Interest</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 sm:p-5 border-2 border-purple-200">
            <div className="text-xs sm:text-sm text-purple-600 font-semibold mb-2 uppercase tracking-wide">{terms[1]}</div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-1">
              {Math.round(bShare)}%
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium">Search Interest</div>
          </div>
        </div>
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-4">
          Based on relative search interest over the last 12 months
        </p>
      </div>
    </div>
  );
}


