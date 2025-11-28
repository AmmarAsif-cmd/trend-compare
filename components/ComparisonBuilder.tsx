"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface ComparisonBuilderProps {
  suggestions?: string[];
}

export default function ComparisonBuilder({ suggestions = [] }: ComparisonBuilderProps) {
  const router = useRouter();
  const [term1, setTerm1] = useState("");
  const [term2, setTerm2] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const defaultSuggestions = [
    "iPhone", "Android", "Netflix", "Disney+", "Bitcoin", "Ethereum",
    "Tesla", "Toyota", "Instagram", "TikTok", "React", "Vue"
  ];

  const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  const handleCompare = () => {
    if (!term1.trim() || !term2.trim()) return;

    setIsAnimating(true);

    setTimeout(() => {
      const slug = `${term1.trim().toLowerCase().replace(/\s+/g, '-')}-vs-${term2.trim().toLowerCase().replace(/\s+/g, '-')}`;
      router.push(`/compare/${slug}`);
    }, 600);
  };

  const handleQuickSelect = (term: string, position: 1 | 2) => {
    if (position === 1) {
      setTerm1(term);
    } else {
      setTerm2(term);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCompare();
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-3xl border-2 border-purple-200 p-8 shadow-xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-700">Comparison Builder</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Compare Anything
        </h3>
        <p className="text-slate-600">
          Enter two terms to see how they compare in search trends
        </p>
      </div>

      {/* Input Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        {/* Term 1 */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            First term
          </label>
          <input
            type="text"
            value={term1}
            onChange={(e) => setTerm1(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., iPhone"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg"
          />
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {allSuggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleQuickSelect(suggestion, 1)}
                className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* VS Indicator */}
        <div className={`flex-shrink-0 ${isAnimating ? 'animate-spin' : ''}`}>
          <div className="w-16 h-16 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">VS</span>
          </div>
        </div>

        {/* Term 2 */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Second term
          </label>
          <input
            type="text"
            value={term2}
            onChange={(e) => setTerm2(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Android"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all text-lg"
          />
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {allSuggestions.slice(3, 6).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleQuickSelect(suggestion, 2)}
                className="text-xs px-2 py-1 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={!term1.trim() || !term2.trim() || isAnimating}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
          term1.trim() && term2.trim() && !isAnimating
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isAnimating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Analyzing...
          </span>
        ) : (
          'Compare Now →'
        )}
      </button>

      {/* Preview Indicators (mock data for visual appeal) */}
      {term1.trim() && term2.trim() && !isAnimating && (
        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Trending</span>
            </div>
            <span className="text-sm text-slate-600">{term1}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Stable</span>
            </div>
            <span className="text-sm text-slate-600">{term2}</span>
          </div>
        </div>
      )}
    </div>
  );
}
