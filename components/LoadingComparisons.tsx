"use client";

import { useEffect, useState } from "react";
import { getRandomComparisons } from "@/lib/interestingComparisons";
import type { InterestingComparison } from "@/lib/interestingComparisons";

/**
 * Loading Comparisons Component
 * Shows random interesting comparisons while the page loads
 * Keeps users engaged and showcases platform variety
 */
export default function LoadingComparisons() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [comparisons, setComparisons] = useState<InterestingComparison[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Get 5 random comparisons to cycle through
    setComparisons(getRandomComparisons(5));
  }, []);

  useEffect(() => {
    if (comparisons.length === 0) return;

    // Rotate through comparisons every 2 seconds
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % comparisons.length);
        setIsVisible(true);
      }, 300); // Wait for fade out before changing
    }, 2000);

    return () => clearInterval(interval);
  }, [comparisons.length]);

  if (comparisons.length === 0) return null;

  const current = comparisons[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      {/* Main comparison display */}
      <div
        className={`transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="flex items-center gap-6">
          {/* Term A */}
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-3 animate-bounce">{current.emoji}</div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {current.termA}
            </div>
          </div>

          {/* VS */}
          <div className="relative">
            <div className="text-4xl font-black text-slate-300 animate-pulse">
              VS
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-xl"></div>
          </div>

          {/* Term B */}
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-3 animate-bounce" style={{ animationDelay: "0.1s" }}>
              {current.emoji}
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {current.termB}
            </div>
          </div>
        </div>

        {/* Category tag */}
        <div className="text-center mt-4">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full text-sm font-medium text-slate-600">
            {current.category}
          </span>
        </div>
      </div>

      {/* Loading spinner */}
      <div className="flex items-center gap-3 mt-8">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
        <span className="text-sm text-slate-500 font-medium">
          Loading amazing comparisons...
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        {comparisons.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-gradient-to-r from-blue-500 to-purple-500"
                : "w-1.5 bg-slate-300"
            }`}
          />
        ))}
      </div>

      {/* Fun fact or tip */}
      <div className="mt-6 text-center max-w-md">
        <p className="text-xs text-slate-400 italic">
          💡 Did you know? We analyze trends from Google, Spotify, TMDB, Steam, and more!
        </p>
      </div>
    </div>
  );
}
