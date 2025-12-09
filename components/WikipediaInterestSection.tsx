// components/WikipediaInterestSection.tsx
"use client";

import React from "react";
import { BookOpen, Eye, TrendingUp } from "lucide-react";
import type { SourceResult } from "@/lib/sources/types";

interface WikipediaInterestSectionProps {
  termA: string;
  termB: string;
  dataA: SourceResult | null;
  dataB: SourceResult | null;
}

export default function WikipediaInterestSection({
  termA,
  termB,
  dataA,
  dataB,
}: WikipediaInterestSectionProps) {
  // Don't show if both failed
  if (
    (!dataA || dataA.status === "failed") &&
    (!dataB || dataB.status === "failed")
  ) {
    return null;
  }

  const getInterestLevel = (confidence: number): string => {
    if (confidence >= 70) return "Very High";
    if (confidence >= 50) return "High";
    if (confidence >= 30) return "Moderate";
    return "Low";
  };

  const getInterestColor = (confidence: number): string => {
    if (confidence >= 70) return "text-blue-600";
    if (confidence >= 50) return "text-indigo-600";
    if (confidence >= 30) return "text-purple-600";
    return "text-slate-500";
  };

  const calculateAvgPageviews = (data: SourceResult): string => {
    if (!data.data || data.data.length === 0) return "N/A";
    const sum = data.data.reduce((acc, point) => acc + (point.rawValue || 0), 0);
    const avg = Math.round(sum / data.data.length);

    // Format with K/M suffix
    if (avg >= 1000000) return `${(avg / 1000000).toFixed(1)}M`;
    if (avg >= 1000) return `${(avg / 1000).toFixed(1)}K`;
    return avg.toString();
  };

  const extractArticleTitle = (notes?: string): string | null => {
    if (!notes) return null;
    const match = notes.match(/Based on Wikipedia article: "(.+)"/);
    return match ? match[1] : null;
  };

  const getArticleUrl = (articleTitle: string): string => {
    return `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle.replace(/ /g, "_"))}`;
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200 p-6 sm:p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Wikipedia Knowledge Interest
          </h3>
          <p className="text-sm text-slate-600">
            Information-seeking behavior and article views
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Term A */}
        <div className="bg-white/80 rounded-2xl border border-blue-200 p-6">
          <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            {termA}
          </h4>

          {dataA && dataA.status !== "failed" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Interest Level</span>
                <span
                  className={`font-bold text-lg ${getInterestColor(
                    dataA.metadata.confidence
                  )}`}
                >
                  {getInterestLevel(dataA.metadata.confidence)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Avg Daily Views</span>
                <span className="font-bold text-lg text-slate-900">
                  {calculateAvgPageviews(dataA)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Data Points</span>
                <span className="font-semibold text-slate-700">
                  {dataA.metadata.dataPoints}
                </span>
              </div>

              {dataA.metadata.notes && (
                <div className="pt-3 border-t border-slate-200">
                  {(() => {
                    const articleTitle = extractArticleTitle(dataA.metadata.notes);
                    return articleTitle ? (
                      <a
                        href={getArticleUrl(articleTitle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        View article: {articleTitle}
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        {dataA.metadata.notes}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">
                {dataA?.error || "No Wikipedia article found"}
              </p>
            </div>
          )}
        </div>

        {/* Term B */}
        <div className="bg-white/80 rounded-2xl border border-blue-200 p-6">
          <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            {termB}
          </h4>

          {dataB && dataB.status !== "failed" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Interest Level</span>
                <span
                  className={`font-bold text-lg ${getInterestColor(
                    dataB.metadata.confidence
                  )}`}
                >
                  {getInterestLevel(dataB.metadata.confidence)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Avg Daily Views</span>
                <span className="font-bold text-lg text-slate-900">
                  {calculateAvgPageviews(dataB)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Data Points</span>
                <span className="font-semibold text-slate-700">
                  {dataB.metadata.dataPoints}
                </span>
              </div>

              {dataB.metadata.notes && (
                <div className="pt-3 border-t border-slate-200">
                  {(() => {
                    const articleTitle = extractArticleTitle(dataB.metadata.notes);
                    return articleTitle ? (
                      <a
                        href={getArticleUrl(articleTitle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        View article: {articleTitle}
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        {dataB.metadata.notes}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">
                {dataB?.error || "No Wikipedia article found"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-blue-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm text-slate-900 mb-1">
              What This Means
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              Wikipedia pageviews indicate people seeking factual information
              and learning about a topic. Higher views suggest strong
              educational or research interest.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
