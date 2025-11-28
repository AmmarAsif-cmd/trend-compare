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

        {/* Wikipedia Current Events */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg border border-slate-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-300 shadow-sm">
            <span className="text-lg">📰</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">Wikipedia Events</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Daily curated events and news from Wikipedia's Current Events portal
            </p>
          </div>
        </div>

        {/* GDELT Project */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-purple-300 shadow-sm">
            <span className="text-lg">🌍</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">GDELT Project</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Global news database monitoring broadcasts, print, and web in 100+ languages
            </p>
          </div>
        </div>

        {/* NewsAPI */}
        <div className="flex gap-3 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-emerald-300 shadow-sm">
            <span className="text-lg">📡</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900">NewsAPI</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Live headlines from 80,000+ news sources and blogs worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Combined Analysis Note */}
      <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
        <div className="flex gap-2 items-start">
          <span className="text-sm flex-shrink-0">⚡</span>
          <p className="text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold">Smart Multi-Source Analysis:</span> We cross-verify data from all sources to identify the most reliable insights. Events confirmed by multiple sources are marked as "Verified" for your confidence.
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
