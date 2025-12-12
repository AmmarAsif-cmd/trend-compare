import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Skeleton */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge skeleton */}
            <div className="inline-block mb-6 sm:mb-8">
              <div className="h-10 w-64 bg-slate-200 rounded-full animate-pulse"></div>
            </div>

            {/* Headline skeleton */}
            <div className="space-y-4 mb-10">
              <div className="h-12 sm:h-16 bg-slate-200 rounded-lg w-3/4 mx-auto animate-pulse"></div>
              <div className="h-12 sm:h-16 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-lg w-2/3 mx-auto animate-pulse"></div>
            </div>

            {/* Subhead skeleton */}
            <div className="max-w-2xl mx-auto mb-12 space-y-2">
              <div className="h-6 bg-slate-200 rounded w-full animate-pulse"></div>
              <div className="h-6 bg-slate-200 rounded w-5/6 mx-auto animate-pulse"></div>
            </div>

            {/* Search form skeleton */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-slate-200">
                <div className="h-14 bg-slate-200 rounded-xl animate-pulse mb-4"></div>
                <div className="h-12 bg-blue-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading indicator */}
      <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-2xl border-2 border-blue-200 p-6 z-50">
        <div className="flex items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <div className="font-bold text-slate-900 mb-1">Loading TrendArc</div>
            <div className="text-sm text-slate-600">Preparing trending data...</div>
          </div>
        </div>
      </div>

      {/* Category section skeleton */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-10 bg-slate-200 rounded w-64 mx-auto mb-3 animate-pulse"></div>
            <div className="h-6 bg-slate-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Category tabs skeleton */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>

          {/* Category cards skeleton */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-slate-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-100 rounded-xl border-2 border-slate-200 p-5 h-32 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
