import LoadingComparisons from "@/components/LoadingComparisons";

/**
 * Root loading state for homepage
 * Shows interesting comparisons while the page loads
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero skeleton */}
        <div className="text-center mb-16 animate-pulse">
          <div className="h-12 bg-slate-200 rounded-lg w-3/4 mx-auto mb-6"></div>
          <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-14 bg-slate-200 rounded-xl w-full max-w-2xl mx-auto"></div>
        </div>

        {/* Interesting comparisons while loading */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-12 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-3">
              Loading TrendArc
            </h2>
            <p className="text-slate-600">
              While you wait, check out these interesting comparisons!
            </p>
          </div>

          <LoadingComparisons />
        </div>

        {/* Category tabs skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-lg w-64 mx-auto mb-6"></div>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded-xl w-32"></div>
            ))}
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="h-24 bg-slate-200 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Trending keywords skeleton */}
        <div className="mt-12 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-lg w-48 mx-auto mb-6"></div>
          <div className="flex flex-wrap justify-center gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 rounded-full w-24"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
