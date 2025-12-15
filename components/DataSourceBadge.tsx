"use client";

import React from 'react';

type DataSourceBadgeProps = {
  sources: string[];
};

const SOURCE_ICONS: Record<string, string> = {
  "Google Trends": "📈",
  "YouTube": "📺",
  "TMDB": "🎬",
  "Spotify": "🎵",
  "Steam": "🎮",
  "Best Buy": "🛒",
  "Mock Data": "🔧",
};

export default function DataSourceBadge({ sources }: DataSourceBadgeProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-all max-w-full">
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap flex-shrink-0">
        Data from:
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {sources.map((source, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 sm:px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors whitespace-nowrap"
            title={source}
          >
            <span className="flex-shrink-0">{SOURCE_ICONS[source] || "📊"}</span>
            <span className="hidden sm:inline">{source}</span>
            <span className="sm:hidden">{source.split(' ')[0]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
