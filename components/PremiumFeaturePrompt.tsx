import Link from "next/link";
import { Crown, Sparkles, TrendingUp, FileText, Download, Mail } from "lucide-react";

type FeatureType = "ai-insights" | "predictions" | "pdf-export" | "csv-export" | "email-alerts" | "unlimited" | "general";

interface PremiumFeaturePromptProps {
  feature: FeatureType;
  title?: string;
  description?: string;
  className?: string;
}

const featureConfig: Record<FeatureType, {
  icon: React.ReactNode;
  defaultTitle: string;
  defaultDescription: string;
  gradient: string;
}> = {
  "ai-insights": {
    icon: <Sparkles className="w-6 h-6" />,
    defaultTitle: "AI-Powered Insights",
    defaultDescription: "Get deep AI analysis of trends, peak explanations with dates, and actionable recommendations from our advanced language models.",
    gradient: "from-purple-600 to-pink-600",
  },
  "predictions": {
    icon: <TrendingUp className="w-6 h-6" />,
    defaultTitle: "30-Day Trend Predictions",
    defaultDescription: "See where trends are heading with ML-powered forecasts using 5 ensemble methods. Track prediction accuracy over time.",
    gradient: "from-blue-600 to-indigo-600",
  },
  "pdf-export": {
    icon: <FileText className="w-6 h-6" />,
    defaultTitle: "PDF Report Downloads",
    defaultDescription: "Export professional PDF reports with all charts, insights, and predictions for presentations and analysis.",
    gradient: "from-emerald-600 to-teal-600",
  },
  "csv-export": {
    icon: <Download className="w-6 h-6" />,
    defaultTitle: "Data Export (CSV/JSON)",
    defaultDescription: "Download raw comparison data in CSV or JSON format for further analysis in your tools of choice.",
    gradient: "from-orange-600 to-amber-600",
  },
  "email-alerts": {
    icon: <Mail className="w-6 h-6" />,
    defaultTitle: "Email Alerts",
    defaultDescription: "Get notified when trends change significantly. Stay on top of important shifts in search interest.",
    gradient: "from-red-600 to-rose-600",
  },
  "unlimited": {
    icon: <Crown className="w-6 h-6" />,
    defaultTitle: "Unlimited Comparisons",
    defaultDescription: "Create unlimited trend comparisons without daily limits. Perfect for researchers and power users.",
    gradient: "from-indigo-600 to-purple-600",
  },
  "general": {
    icon: <Crown className="w-6 h-6" />,
    defaultTitle: "Premium Feature",
    defaultDescription: "This feature is available exclusively to Premium subscribers. Upgrade to unlock all advanced features.",
    gradient: "from-purple-600 to-pink-600",
  },
};

export default function PremiumFeaturePrompt({
  feature,
  title,
  description,
  className = ""
}: PremiumFeaturePromptProps) {
  const config = featureConfig[feature];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  return (
    <section className={`bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-xl border-2 border-purple-300 shadow-lg p-6 sm:p-8 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${config.gradient} rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0`}>
          {config.icon}
        </div>

        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2 flex-wrap">
            {displayTitle}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-full">
              <Crown className="w-3 h-3" />
              PREMIUM
            </span>
          </h3>
          <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
            {displayDescription}
          </p>
        </div>
      </div>

      {/* Premium Benefits */}
      <div className="mb-6 p-4 bg-white/60 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-slate-900 mb-3 text-sm">Premium includes:</h4>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            Unlimited comparisons
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            AI-powered insights
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            30-day predictions
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            PDF/CSV exports
          </li>
        </ul>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/pricing"
          className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${config.gradient} text-white font-semibold rounded-lg hover:shadow-xl transition-all shadow-md text-center`}
        >
          <Crown className="w-5 h-5" />
          Upgrade to Premium
        </Link>
        <Link
          href="/pricing#features"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-300 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition-colors text-center"
        >
          See All Features
        </Link>
      </div>

      {/* Pricing hint */}
      <p className="mt-4 text-center text-sm text-slate-600">
        <span className="font-semibold text-slate-900">Just $4.99/month</span> • Cancel anytime
      </p>
    </section>
  );
}
