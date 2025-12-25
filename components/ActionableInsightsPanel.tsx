'use client';

import { Lightbulb, Target, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

type Props = {
  winner: string;
  loser: string;
  winnerScore: number;
  loserScore: number;
  margin: number;
  category?: string;
  termA: string;
  termB: string;
  growthRateA?: number;
  growthRateB?: number;
};

export default function ActionableInsightsPanel({
  winner,
  loser,
  winnerScore,
  loserScore,
  margin,
  category = 'general',
  termA,
  termB,
  growthRateA,
  growthRateB,
}: Props) {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const isTermAWinner = winner.toLowerCase() === termA.toLowerCase();
  const winnerName = isTermAWinner ? formatTerm(termA) : formatTerm(termB);
  const loserName = isTermAWinner ? formatTerm(termB) : formatTerm(termA);

  // Generate recommendations based on category and data
  const getRecommendations = () => {
    const recommendations: Array<{ icon: React.ReactNode; title: string; description: string; color: string }> = [];

    // For Marketers
    if (category === 'products' || category === 'tech' || category === 'brands') {
      recommendations.push({
        icon: <Target className="w-5 h-5" />,
        title: 'For Marketers',
        description: margin > 15 
          ? `Focus marketing efforts on ${winnerName} - it's clearly winning in search interest. Consider increasing ad spend and content creation for this term.`
          : `Both ${formatTerm(termA)} and ${formatTerm(termB)} are competitive. A/B test campaigns for both to maximize reach.`,
        color: 'from-blue-500 to-cyan-500',
      });
    }

    // For Product Managers
    if (category === 'tech' || category === 'products') {
      const isRising = (growthRateA && growthRateA > 5) || (growthRateB && growthRateB > 5);
      recommendations.push({
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'For Product Managers',
        description: isRising
          ? `Monitor ${winnerName} closely - it's showing strong growth. Consider prioritizing features or products related to this trend.`
          : `Both terms show stable interest. Focus on differentiation and unique value propositions to stand out.`,
        color: 'from-purple-500 to-pink-500',
      });
    }

    // For Investors
    if (category === 'tech' || category === 'products' || category === 'brands') {
      recommendations.push({
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'For Investors',
        description: margin > 20
          ? `${winnerName} shows dominant market interest. This could indicate strong consumer demand and market positioning.`
          : `Market is competitive with ${winnerName} slightly ahead. Monitor trends closely for investment decisions.`,
        color: 'from-emerald-500 to-teal-500',
      });
    }

    // General recommendations
    recommendations.push({
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: 'Key Takeaway',
      description: margin > 15
        ? `${winnerName} is significantly more popular (${margin.toFixed(0)}% margin). This is a clear market leader.`
        : margin > 5
        ? `${winnerName} has a slight edge (${margin.toFixed(0)}% margin). The market is competitive.`
        : `Very close competition (${margin.toFixed(0)}% margin). Both ${formatTerm(termA)} and ${formatTerm(termB)} are neck-and-neck.`,
      color: 'from-amber-500 to-orange-500',
    });

    return recommendations;
  };

  const recommendations = getRecommendations();

  // Risk/Opportunity indicators
  const getRiskOpportunity = () => {
    const indicators: Array<{ label: string; type: 'opportunity' | 'risk' | 'stable'; color: string }> = [];

    if (margin > 20) {
      indicators.push({
        label: `${winnerName} is Dominant`,
        type: 'opportunity',
        color: 'bg-green-100 text-green-800 border-green-300',
      });
    } else if (margin < 5) {
      indicators.push({
        label: 'Highly Competitive Market',
        type: 'stable',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
      });
    }

    if (growthRateA && growthRateA > 10) {
      indicators.push({
        label: `${formatTerm(termA)} is Rising`,
        type: 'opportunity',
        color: 'bg-green-100 text-green-800 border-green-300',
      });
    } else if (growthRateB && growthRateB > 10) {
      indicators.push({
        label: `${formatTerm(termB)} is Rising`,
        type: 'opportunity',
        color: 'bg-green-100 text-green-800 border-green-300',
      });
    }

    if (growthRateA && growthRateA < -10) {
      indicators.push({
        label: `${formatTerm(termA)} is Declining`,
        type: 'risk',
        color: 'bg-red-100 text-red-800 border-red-300',
      });
    } else if (growthRateB && growthRateB < -10) {
      indicators.push({
        label: `${formatTerm(termB)} is Declining`,
        type: 'risk',
        color: 'bg-red-100 text-red-800 border-red-300',
      });
    }

    return indicators;
  };

  const indicators = getRiskOpportunity();

  return (
    <div className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20 rounded-xl sm:rounded-2xl border-2 border-amber-200 shadow-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
          Actionable Insights
        </h2>
      </div>

      {/* Risk/Opportunity Indicators */}
      {indicators.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {indicators.map((indicator, idx) => (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold ${indicator.color}`}
            >
              {indicator.type === 'opportunity' && '📈 '}
              {indicator.type === 'risk' && '⚠️ '}
              {indicator.type === 'stable' && '📊 '}
              {indicator.label}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3 sm:space-y-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`p-2 sm:p-2.5 bg-gradient-to-br ${rec.color} rounded-lg flex-shrink-0 text-white shadow-sm`}>
                {rec.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 sm:mb-2 flex items-center gap-2">
                  {rec.title}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          <span>What to Do Next</span>
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
            <span className="text-emerald-600 font-bold mt-0.5">1.</span>
            <span>Monitor trends weekly to track changes in popularity</span>
          </li>
          <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
            <span className="text-emerald-600 font-bold mt-0.5">2.</span>
            <span>Set up alerts for significant changes in search interest</span>
          </li>
          <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
            <span className="text-emerald-600 font-bold mt-0.5">3.</span>
            <span>Compare with related terms to get a complete market picture</span>
          </li>
        </ul>
      </div>
    </div>
  );
}


