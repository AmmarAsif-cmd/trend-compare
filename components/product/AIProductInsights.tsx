interface Props {
  insights: any;
  isLoading: boolean;
  error?: string | null;
}

export default function AIProductInsights({ insights, isLoading, error }: Props) {
  if (error) {
    return (
      <section className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900">AI Insights Unavailable</h2>
        </div>
        <p className="text-slate-700 mb-4">
          {error}
        </p>
        <p className="text-sm text-slate-600">
          You can still review the product data below. AI insights are optional and may be available after refreshing.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">🤖</div>
          <h2 className="text-2xl font-bold text-slate-900">AI Insights</h2>
        </div>
        <div className="flex items-center gap-3 text-purple-700">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="font-medium">Generating AI-powered insights...</span>
        </div>
      </section>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl">🤖</div>
        <h2 className="text-2xl font-bold text-slate-900">AI Insights</h2>
      </div>

      <div className="space-y-6">
        {/* Why This is Trending */}
        {insights.whyTrending && insights.whyTrending.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              📈 Why This is Trending
            </h3>
            <ul className="space-y-2">
              {insights.whyTrending.map((reason: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-slate-700">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              💡 Recommendations
            </h3>
            <ul className="space-y-2">
              {insights.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-slate-700">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {insights.risks && insights.risks.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              ⚠️ Risks to Consider
            </h3>
            <ul className="space-y-2">
              {insights.risks.map((risk: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-slate-700">
                  <span className="text-red-600 font-bold mt-1">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
