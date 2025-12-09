// components/RedditBuzzSection.tsx
"use client";

import React from "react";
import { MessageSquare, TrendingUp, Users } from "lucide-react";
import type { SourceResult } from "@/lib/sources/types";

interface RedditBuzzSectionProps {
  termA: string;
  termB: string;
  dataA: SourceResult | null;
  dataB: SourceResult | null;
}

export default function RedditBuzzSection({
  termA,
  termB,
  dataA,
  dataB,
}: RedditBuzzSectionProps) {
  // Don't show if both failed
  if (
    (!dataA || dataA.status === "failed") &&
    (!dataB || dataB.status === "failed")
  ) {
    return null;
  }

  const getEngagementLevel = (confidence: number): string => {
    if (confidence >= 70) return "High";
    if (confidence >= 40) return "Medium";
    return "Low";
  };

  const getEngagementColor = (confidence: number): string => {
    if (confidence >= 70) return "text-green-600";
    if (confidence >= 40) return "text-yellow-600";
    return "text-slate-500";
  };

  const calculateAvgValue = (data: SourceResult): number => {
    if (!data.data || data.data.length === 0) return 0;
    const sum = data.data.reduce((acc, point) => acc + point.value, 0);
    return Math.round(sum / data.data.length);
  };

  return (
    <section className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl border-2 border-orange-200 p-6 sm:p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Reddit Community Buzz
          </h3>
          <p className="text-sm text-slate-600">
            Social engagement and discussion activity
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Term A */}
        <div className="bg-white/80 rounded-2xl border border-orange-200 p-6">
          <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {termA}
          </h4>

          {dataA && dataA.status !== "failed" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Engagement Level</span>
                <span
                  className={`font-bold text-lg ${getEngagementColor(
                    dataA.metadata.confidence
                  )}`}
                >
                  {getEngagementLevel(dataA.metadata.confidence)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Discussion Score</span>
                <span className="font-bold text-lg text-slate-900">
                  {calculateAvgValue(dataA)}/100
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
                  <p className="text-xs text-slate-500 italic">
                    {dataA.metadata.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">
                {dataA?.error || "No Reddit data available"}
              </p>
            </div>
          )}
        </div>

        {/* Term B */}
        <div className="bg-white/80 rounded-2xl border border-orange-200 p-6">
          <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            {termB}
          </h4>

          {dataB && dataB.status !== "failed" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Engagement Level</span>
                <span
                  className={`font-bold text-lg ${getEngagementColor(
                    dataB.metadata.confidence
                  )}`}
                >
                  {getEngagementLevel(dataB.metadata.confidence)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Discussion Score</span>
                <span className="font-bold text-lg text-slate-900">
                  {calculateAvgValue(dataB)}/100
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
                  <p className="text-xs text-slate-500 italic">
                    {dataB.metadata.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">
                {dataB?.error || "No Reddit data available"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-orange-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm text-slate-900 mb-1">
              What This Means
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              Reddit engagement reflects community discussions, posts, and
              comments. Higher scores indicate more active conversations and
              social buzz around the topic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
