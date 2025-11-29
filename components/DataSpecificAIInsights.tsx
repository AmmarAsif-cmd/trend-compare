/**
 * Data-Specific AI Insights Component
 * Shows Claude Haiku-generated insights based on actual comparison data
 * Cost: ~$0.0014 per insight (stays under $10/month with budget controls)
 */

import { Sparkles, TrendingUp, Target, Lightbulb, BarChart3, Users } from "lucide-react";

type AIInsightResult = {
  whatDataTellsUs: string[];
  whyThisMatters: string;
  keyDifferences: string;
  volatilityAnalysis: string;
  practicalImplications: {
    forInvestors?: string;
    forContentCreators?: string;
    forSEOExperts?: string;
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
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            AI-Powered Data Analysis
          </h3>
        </div>
        <p className="text-slate-600 text-sm">
          Claude AI analyzed the specific data patterns for {prettyTerm(termA)} vs{" "}
          {prettyTerm(termB)}
        </p>
      </div>

      {/* What Data Tells Us */}
      <div className="bg-white rounded-xl p-5 mb-4 border border-purple-100">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-lg">What the Data Tells Us</h4>
        </div>
        <ul className="space-y-2">
          {insights.whatDataTellsUs.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-slate-700">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Grid Layout for Other Insights */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Why This Matters */}
        <div className="bg-white rounded-xl p-5 border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-slate-900">Why This Matters</h4>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            {insights.whyThisMatters}
          </p>
        </div>

        {/* Key Differences */}
        <div className="bg-white rounded-xl p-5 border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-slate-900">Key Differences</h4>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            {insights.keyDifferences}
          </p>
        </div>
      </div>

      {/* Volatility Analysis */}
      <div className="bg-white rounded-xl p-5 mb-4 border border-purple-100">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-amber-600" />
          <h4 className="font-bold text-slate-900">Volatility Analysis</h4>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed">
          {insights.volatilityAnalysis}
        </p>
      </div>

      {/* Practical Implications */}
      {Object.keys(insights.practicalImplications).length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-green-600" />
            <h4 className="font-bold text-slate-900">Practical Implications</h4>
          </div>
          <div className="space-y-3">
            {insights.practicalImplications.forContentCreators && (
              <div>
                <p className="font-semibold text-sm text-slate-900 mb-1">
                  For Content Creators:
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {insights.practicalImplications.forContentCreators}
                </p>
              </div>
            )}
            {insights.practicalImplications.forSEOExperts && (
              <div>
                <p className="font-semibold text-sm text-slate-900 mb-1">
                  For SEO Experts:
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {insights.practicalImplications.forSEOExperts}
                </p>
              </div>
            )}
            {insights.practicalImplications.forInvestors && (
              <div>
                <p className="font-semibold text-sm text-slate-900 mb-1">
                  For Investors:
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {insights.practicalImplications.forInvestors}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prediction */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5" />
          <h4 className="font-bold text-lg">Data-Driven Prediction</h4>
        </div>
        <p className="leading-relaxed">{insights.prediction}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-xs text-slate-500 italic flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Generated by Claude AI analyzing {prettyTerm(termA)} vs {prettyTerm(termB)}{" "}
          trend patterns. Budget-optimized to stay under $10/month.
        </p>
      </div>
    </div>
  );
}
