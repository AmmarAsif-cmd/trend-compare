/**
 * Data Sources Component
 * Shows trusted data sources with recognizable brand colors/logos
 * Builds user trust with familiar brands
 */

export default function DataSources() {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Powered by Trusted Data Sources
        </h3>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
          We combine data from industry-leading platforms to give you the most accurate and comprehensive trend analysis
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Google Trends */}
        <div className="group flex flex-col items-center text-center p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg">
          <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-blue-300 shadow-md group-hover:scale-110 transition-transform">
            {/* Google multi-color icon */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v5c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" fill="#4285F4"/>
              <path d="M12 2L4 6v5c0 5.5 3.8 10.7 8 12V2z" fill="#EA4335" opacity="0.7"/>
              <circle cx="12" cy="12" r="4" fill="#FBBC04"/>
            </svg>
          </div>
          <h4 className="font-bold text-base text-slate-900 mb-2">Google Trends</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Real-time search interest from billions of Google searches worldwide
          </p>
        </div>

        {/* YouTube */}
        <div className="group flex flex-col items-center text-center p-5 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-lg">
          <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-red-300 shadow-md group-hover:scale-110 transition-transform">
            {/* YouTube play button */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="3" fill="#FF0000"/>
              <path d="M10 8.5L16 12l-6 3.5V8.5z" fill="white"/>
            </svg>
          </div>
          <h4 className="font-bold text-base text-slate-900 mb-2">YouTube</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Video engagement metrics and social buzz from the world's largest video platform
          </p>
        </div>

        {/* Spotify */}
        <div className="group flex flex-col items-center text-center p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg">
          <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-green-300 shadow-md group-hover:scale-110 transition-transform">
            {/* Spotify icon */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#1DB954"/>
              <path d="M7 10c2-1 5-1 7 0M7 13c2-1 5-1 7 0M8 16c1.5-0.5 3.5-0.5 5 0" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h4 className="font-bold text-base text-slate-900 mb-2">Spotify</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Artist popularity and music streaming data from 500M+ active users
          </p>
        </div>

        {/* TMDB */}
        <div className="group flex flex-col items-center text-center p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 hover:border-cyan-400 transition-all hover:shadow-lg">
          <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-cyan-300 shadow-md group-hover:scale-110 transition-transform">
            {/* TMDB film icon */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="5" width="16" height="14" rx="2" fill="url(#tmdbGradient)"/>
              <path d="M8 5v14M12 5v14M16 5v14" stroke="white" strokeWidth="1.5"/>
              <defs>
                <linearGradient id="tmdbGradient" x1="4" y1="5" x2="20" y2="19">
                  <stop offset="0%" stopColor="#01D277"/>
                  <stop offset="100%" stopColor="#0D9DBD"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h4 className="font-bold text-base text-slate-900 mb-2">TMDB</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Movie and TV ratings from The Movie Database, trusted by millions
          </p>
        </div>

        {/* Steam */}
        <div className="group flex flex-col items-center text-center p-5 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border-2 border-slate-300 hover:border-slate-400 transition-all hover:shadow-lg">
          <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-400 shadow-md group-hover:scale-110 transition-transform">
            {/* Steam icon */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#1B2838"/>
              <circle cx="15" cy="9" r="3.5" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="9" cy="15" r="2.5" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M12 12L9 15" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <h4 className="font-bold text-base text-slate-900 mb-2">Steam</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gaming data with player counts and reviews from PC gaming's largest platform
          </p>
        </div>

        {/* Best Buy */}
        <div className="group flex flex-col items-center text-center p-5 bg-gradient-to-br from-blue-50 to-yellow-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg">
          <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-blue-300 shadow-md group-hover:scale-110 transition-transform">
            {/* Best Buy tag icon */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="7" width="14" height="10" rx="2" fill="#0046BE"/>
              <circle cx="17" cy="9" r="1.5" fill="#FFF200"/>
              <path d="M9 11h6M9 14h4" stroke="#FFF200" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h4 className="font-bold text-base text-slate-900 mb-2">Best Buy</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Product ratings and availability data for electronics and consumer tech
          </p>
        </div>

        {/* Wikipedia */}
        <div className="group flex flex-col items-center text-center p-5 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-slate-300 hover:border-slate-400 transition-all hover:shadow-lg">
          <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-400 shadow-md group-hover:scale-110 transition-transform">
            {/* Wikipedia globe icon */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="1.5" fill="none"/>
              <path d="M8 12c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5M8 12c0 2 1.5 3.5 4 3.5s4-1.5 4-3.5" stroke="#000" strokeWidth="1.5" fill="none"/>
              <path d="M12 8v8M8 12h8" stroke="#000" strokeWidth="1.5"/>
            </svg>
          </div>
          <h4 className="font-bold text-base text-slate-900 mb-2">Wikipedia</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Historical events and context from the world's largest encyclopedia
          </p>
        </div>
      </div>

      {/* Smart Analysis Note */}
      <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border-2 border-blue-200">
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border-2 border-purple-300 shadow-sm">
            <span className="text-xl">⚡</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-slate-900 mb-1.5">AI-Powered Smart Analysis</h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              Our system uses <span className="font-semibold">Claude AI</span> to automatically detect what you're comparing (movies, music, games, products) and intelligently fetches data from the most relevant sources. All metrics are combined into a unified <span className="font-semibold">TrendArc Score</span> for easy comparison.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="mt-6 pt-6 border-t-2 border-slate-200 flex flex-wrap gap-4 items-center justify-center text-xs sm:text-sm font-medium text-slate-600">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Real-time data
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Verified sources
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Cross-checked accuracy
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Updated regularly
        </span>
      </div>
    </div>
  );
}