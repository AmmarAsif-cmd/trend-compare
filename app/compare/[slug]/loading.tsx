import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading header */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-lg w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>

        {/* Main loading content */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Analyzing Trends...
            </h2>
            <p className="text-slate-600 text-center max-w-md">
              We're fetching search data, detecting patterns, and generating insights.
              This may take a few moments.
            </p>

            {/* Progress indicators */}
            <div className="mt-8 w-full max-w-md space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                <span className="text-slate-600">Fetching search trends data...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse delay-100"></div>
                <span className="text-slate-600">Analyzing patterns and spikes...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse delay-200"></div>
                <span className="text-slate-600">Detecting real-world events...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-pink-600 animate-pulse delay-300"></div>
                <span className="text-slate-600">Generating insights...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton placeholders for rest of content */}
        <div className="mt-8 space-y-6 animate-pulse">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="h-32 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="h-32 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
