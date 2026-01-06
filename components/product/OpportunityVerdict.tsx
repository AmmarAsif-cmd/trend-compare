import type { ParsedKeepaData } from "@/lib/services/keepa/types";

interface Props {
  productName: string;
  keepaData: ParsedKeepaData | null;
  aiInsights: any;
  isLoadingAI: boolean;
}

type VerdictType = "good" | "medium" | "avoid" | "unknown";

function calculateVerdict(keepaData: ParsedKeepaData | null, aiInsights: any): {
  verdict: VerdictType;
  headline: string;
  recommendation: string;
} {
  // If we have AI insights, use those
  if (aiInsights?.verdict) {
    return {
      verdict: aiInsights.verdict.toLowerCase() as VerdictType,
      headline: aiInsights.headline || "",
      recommendation: aiInsights.recommendation || "",
    };
  }

  // Fallback logic based on Keepa data
  if (!keepaData) {
    return {
      verdict: "unknown",
      headline: "Insufficient Data",
      recommendation: "Not enough data to make a recommendation",
    };
  }

  // Simple heuristic:
  // - Good if: High rating (>4.0), decent reviews (>100), low out-of-stock
  // - Avoid if: Low rating (<3.5), high out-of-stock (>30%), very volatile price
  const rating = keepaData.rating || 0;
  const reviewCount = keepaData.reviewCount || 0;
  const outOfStock30 = keepaData.outOfStockPercentage30Days;

  if (rating >= 4.0 && reviewCount >= 100 && outOfStock30 < 10) {
    return {
      verdict: "good",
      headline: "Good Opportunity",
      recommendation: "This product shows strong potential with good ratings and availability.",
    };
  } else if (rating < 3.5 || outOfStock30 > 30) {
    return {
      verdict: "avoid",
      headline: "High Risk",
      recommendation: "Consider alternative products with better ratings or availability.",
    };
  } else {
    return {
      verdict: "medium",
      headline: "Moderate Opportunity",
      recommendation: "This product has potential but requires careful consideration.",
    };
  }
}

export default function OpportunityVerdict({ productName, keepaData, aiInsights, isLoadingAI }: Props) {
  const { verdict, headline, recommendation } = calculateVerdict(keepaData, aiInsights);

  const verdictConfig = {
    good: {
      bg: "bg-green-100",
      border: "border-green-300",
      text: "text-green-800",
      icon: "✅",
      label: "GOOD OPPORTUNITY",
    },
    medium: {
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      text: "text-yellow-800",
      icon: "⚠️",
      label: "MEDIUM OPPORTUNITY",
    },
    avoid: {
      bg: "bg-red-100",
      border: "border-red-300",
      text: "text-red-800",
      icon: "❌",
      label: "AVOID",
    },
    unknown: {
      bg: "bg-slate-100",
      border: "border-slate-300",
      text: "text-slate-800",
      icon: "❓",
      label: "ANALYZING...",
    },
  };

  const config = verdictConfig[isLoadingAI ? "unknown" : verdict];

  return (
    <section
      className={`${config.bg} ${config.border} border-2 rounded-2xl p-8 shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div className="text-5xl">{config.icon}</div>
        <div className="flex-1">
          <div className={`text-sm font-bold ${config.text} mb-2`}>
            {config.label}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            {isLoadingAI ? "Analyzing product..." : headline}
          </h2>
          <p className="text-lg text-slate-700 leading-relaxed">
            {isLoadingAI ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                AI is analyzing market data...
              </span>
            ) : (
              recommendation
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
