/**
 * Data-Specific AI Insights Component
 * Shows Claude AI-generated insights based on actual comparison data
 */

import { Sparkles, TrendingUp, Target, Lightbulb, BarChart3, Users, Brain } from "lucide-react";

type AIInsightResult = {
  whatDataTellsUs: string[];
  whyThisMatters: string;
  keyDifferences: string;
  volatilityAnalysis: string;
  practicalImplications: {
    [key: string]: string; // Dynamic audience keys
  };
  prediction: string;
};

type DataSpecificAIInsightsProps = {
  insights: AIInsightResult;
  termA: string;
  termB: string;
};

function prettyTerm(t: string): string {
  return t
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DataSpecificAIInsights({
  insights,
  termA,
  termB,
}: DataSpecificAIInsightsProps) {
  if (!insights) return null;

  return (
    <section className="bg-white rounded-xl sm:rounded-2xl border-2 border-indigo-200 shadow-xl overflow-hidden">
      {/* Header with AI Badge */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 sm:px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              AI-Powered Analysis
              <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">Claude 3.5 Haiku</span>
            </h3>
            <p className="text-white/90 text-sm">
              Deep analysis of {prettyTerm(termA)} vs {prettyTerm(termB)} trends
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Key Insights - Featured */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-lg">Key Data Insights</h4>
          </div>
          <ul className="space-y-3">
            {insights.whatDataTellsUs.map((insight, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-800">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Two Column Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Why This Matters */}
          <div className="border-2 border-purple-100 rounded-lg p-5 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-slate-900">Why This Matters</h4>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">
              {insights.whyThisMatters}
            </p>
          </div>

          {/* Key Differences */}
          <div className="border-2 border-indigo-100 rounded-lg p-5 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="font-bold text-slate-900">Key Differences</h4>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">
              {insights.keyDifferences}
            </p>
          </div>
        </div>

        {/* Volatility Analysis */}
        <div className="border-2 border-amber-100 rounded-lg p-5 hover:border-amber-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <h4 className="font-bold text-slate-900">Volatility & Stability</h4>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            {insights.volatilityAnalysis}
          </p>
        </div>

        {/* Practical Implications - Dynamic Audiences */}
        {Object.keys(insights.practicalImplications).length > 0 && (
          <div className="border-2 border-green-100 rounded-lg p-5 hover:border-green-300 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-bold text-slate-900">Who Should Care & Why</h4>
            </div>
            <div className="space-y-4">
              {Object.entries(insights.practicalImplications).map(([audience, implication]) => (
                <div key={audience} className="pl-4 border-l-2 border-green-300">
                  <p className="font-semibold text-sm text-green-700 mb-1 capitalize">
                    {audience.replace(/([A-Z])/g, ' $1').trim()}:
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {implication}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prediction - Highlighted */}
        <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
            </div>
            <h4 className="font-bold text-lg text-white">Forecast & Prediction</h4>
          </div>
          <p className="text-slate-100 leading-relaxed text-base">{insights.prediction}</p>
        </div>

        {/* AI Attribution */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500">
          <Sparkles className="w-3 h-3" />
          <span>Analysis powered by Claude 3.5 Haiku AI</span>
        </div>
      </div>
    </section>
  );
}
