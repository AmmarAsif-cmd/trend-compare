"use client";

import React from 'react';

type DataSourceBadgeProps = {
  sources: string[];
};

const SOURCE_ICONS: Record<string, string> = {
  "Google Trends": "📈",
  "Reddit": "🔴",
  "Wikipedia": "📚",
  "Mock Data": "🔧",
};

export default function DataSourceBadge({ sources }: DataSourceBadgeProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all">
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        Data from:
      </span>
      <div className="flex items-center gap-1.5">
        {sources.map((source, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            title={source}
          >
            <span>{SOURCE_ICONS[source] || "📊"}</span>
            <span>{source}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
