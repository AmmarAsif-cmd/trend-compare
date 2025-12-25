"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LimitStatus {
  remaining: number;
  limit: number;
  count: number;
  allowed: boolean;
}

export default function DailyLimitBanner() {
  const [limitStatus, setLimitStatus] = useState<LimitStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLimitStatus() {
      try {
        const response = await fetch("/api/user/daily-limit");
        if (response.ok) {
          const data = await response.json();
          setLimitStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch daily limit status:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLimitStatus();
  }, []);

  // Don't show if loading, dismissed, or unlimited (premium user)
  if (loading || dismissed || !limitStatus || limitStatus.remaining === Infinity) {
    return null;
  }

  const { remaining, limit, count } = limitStatus;

  // Don't show if they have plenty of comparisons left (more than 10)
  if (remaining > 10) {
    return null;
  }

  // Determine urgency level
  const getUrgencyConfig = () => {
    if (remaining === 0) {
      return {
        bg: "bg-gradient-to-r from-red-50 to-rose-50",
        border: "border-red-300",
        icon: "🚫",
        textColor: "text-red-900",
        subtextColor: "text-red-700",
        title: "Daily limit reached",
        message: `You've used all ${limit} comparisons for today. Come back tomorrow or upgrade to Premium for unlimited access.`,
        showUpgrade: true,
        urgency: "critical",
      };
    }

    if (remaining <= 2) {
      return {
        bg: "bg-gradient-to-r from-orange-50 to-amber-50",
        border: "border-orange-300",
        icon: "⚠️",
        textColor: "text-orange-900",
        subtextColor: "text-orange-700",
        title: `Only ${remaining} comparison${remaining === 1 ? "" : "s"} left today`,
        message: `You've used ${count}/${limit} comparisons. Upgrade to Premium for unlimited comparisons.`,
        showUpgrade: true,
        urgency: "high",
      };
    }

    if (remaining <= 5) {
      return {
        bg: "bg-gradient-to-r from-yellow-50 to-amber-50",
        border: "border-yellow-300",
        icon: "⏰",
        textColor: "text-yellow-900",
        subtextColor: "text-yellow-700",
        title: `${remaining} comparisons remaining`,
        message: `You've used ${count}/${limit} comparisons today. Your limit resets at midnight UTC.`,
        showUpgrade: true,
        urgency: "medium",
      };
    }

    // 6-10 remaining
    return {
      bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
      border: "border-blue-200",
      icon: "ℹ️",
      textColor: "text-blue-900",
      subtextColor: "text-blue-700",
      title: `${remaining} comparisons remaining today`,
      message: `You're on the free plan with ${limit} comparisons per day.`,
      showUpgrade: false,
      urgency: "low",
    };
  };

  const config = getUrgencyConfig();

  return (
    <div
      className={`${config.bg} border-2 ${config.border} rounded-xl p-4 sm:p-5 shadow-md mb-6 print:hidden animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className="text-2xl sm:text-3xl flex-shrink-0">
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm sm:text-base ${config.textColor} mb-1`}>
            {config.title}
          </h3>
          <p className={`text-xs sm:text-sm ${config.subtextColor} leading-relaxed mb-3`}>
            {config.message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {config.showUpgrade && (
              <Link
                href="/pricing"
                className={`inline-block px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg transition-all shadow-sm hover:shadow-md text-center ${
                  config.urgency === "critical"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                    : config.urgency === "high"
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                }`}
              >
                {config.urgency === "critical" ? "Upgrade Now" : "Upgrade to Premium"}
              </Link>
            )}

            {config.urgency !== "critical" && (
              <button
                onClick={() => setDismissed(true)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border-2 transition-colors ${
                  config.urgency === "high"
                    ? "border-orange-300 text-orange-700 hover:bg-orange-50"
                    : config.urgency === "medium"
                    ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    : "border-blue-300 text-blue-700 hover:bg-blue-50"
                }`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Close button for non-critical alerts */}
        {config.urgency !== "critical" && (
          <button
            onClick={() => setDismissed(true)}
            className={`flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Bar (for non-critical) */}
      {config.urgency !== "critical" && (
        <div className="mt-4 bg-white/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              config.urgency === "high"
                ? "bg-gradient-to-r from-orange-500 to-red-500"
                : config.urgency === "medium"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-blue-500 to-cyan-500"
            }`}
            style={{ width: `${(count / limit) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
