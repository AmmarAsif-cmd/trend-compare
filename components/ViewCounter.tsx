"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

type ViewCounterProps = {
  slug: string;
  initialCount?: number;
};

/**
 * View Counter Component
 * 
 * Displays view count for a comparison
 * Tracks views client-side and updates server
 * 
 * Mobile-friendly design
 */
export default function ViewCounter({ slug, initialCount = 0 }: ViewCounterProps) {
  const [viewCount, setViewCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Track view on mount
    const trackView = async () => {
      try {
        const response = await fetch(`/api/compare/${slug}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setViewCount(data.viewCount || initialCount);
        }
      } catch (error) {
        console.warn("Failed to track view:", error);
        // Keep initial count on error
        setViewCount(initialCount);
      } finally {
        setIsLoading(false);
      }
    };

    // Only track once per session
    const hasTracked = sessionStorage.getItem(`viewed_${slug}`);
    if (!hasTracked) {
      trackView();
      sessionStorage.setItem(`viewed_${slug}`, "true");
    } else {
      // Still show the count even if we've already tracked
      setViewCount(initialCount);
      setIsLoading(false);
    }
  }, [slug, initialCount]);

  // Format number with K/M suffixes
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 rounded-lg text-xs sm:text-sm text-slate-600">
        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
        <span className="font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-lg text-xs sm:text-sm text-slate-700 hover:from-blue-100 hover:to-purple-100 transition-all duration-200">
      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
      <span className="font-semibold text-slate-900">{formatCount(viewCount)}</span>
      <span className="text-slate-500 hidden sm:inline">views</span>
    </div>
  );
}

