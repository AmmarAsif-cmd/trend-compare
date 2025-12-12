/**
 * Data Sources Component
 * Shows trusted data sources to build user trust
 * Reusable on homepage and compare page
 */

export default function DataSources() {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl flex-shrink-0">🔍</span>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-2">
            Trusted Data Sources
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Our analysis combines data from multiple verified sources to give you the most accurate picture. All sources are publicly available and trusted by millions.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Google Trends */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-blue-300 shadow-sm">
            <span className="text-lg">📊</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">Google Trends</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Real-time search interest data from billions of Google searches worldwide
            </p>
          </div>
        </div>

        {/* YouTube */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-red-300 shadow-sm">
            <span className="text-lg">📺</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">YouTube</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Video engagement and view data for comprehensive social buzz metrics
            </p>
          </div>
        </div>

        {/* TMDB */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-purple-300 shadow-sm">
            <span className="text-lg">🎬</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">TMDB</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Movie and TV ratings from The Movie Database, trusted by millions
            </p>
          </div>
        </div>

        {/* Spotify */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-green-300 shadow-sm">
            <span className="text-lg">🎵</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">Spotify</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Music artist popularity and listener data from the world's largest streaming platform
            </p>
          </div>
        </div>

        {/* Steam */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg border border-slate-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-300 shadow-sm">
            <span className="text-lg">🎮</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">Steam</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Gaming data including player counts and review scores from Steam's massive community
            </p>
          </div>
        </div>

        {/* Best Buy */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-yellow-300 shadow-sm">
            <span className="text-lg">🛒</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">Best Buy</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Product ratings and reviews for electronics and consumer tech comparisons
            </p>
          </div>
        </div>
      </div>

      {/* Combined Analysis Note */}
      <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
        <div className="flex gap-2 items-start">
          <span className="text-sm flex-shrink-0">⚡</span>
          <p className="text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold">Smart Category Detection:</span> Our system automatically detects what you're comparing (movies, music, games, products) and fetches the most relevant data sources. Each comparison combines multiple signals into a unified TrendArc Score.
          </p>
        </div>
      </div>

      {/* SEO Trust Signals */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-3 items-center justify-center text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Real-time data
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Verified sources
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Cross-checked accuracy
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Updated automatically
        </span>
      </div>
    </div>
  );
}
