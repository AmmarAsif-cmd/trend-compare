/**
 * AI Practical Implications Component
 * Shows actionable insights for different audiences
 * Designed as a full-width section
 */

import { Users, ArrowRight } from "lucide-react";

type AIPracticalImplicationsProps = {
  practicalImplications: {
    [key: string]: string;
  };
};

export default function AIPracticalImplications({
  practicalImplications,
}: AIPracticalImplicationsProps) {
  if (!practicalImplications || Object.keys(practicalImplications).length === 0) {
    return null;
  }

  // Format audience key to human-readable
  const formatAudience = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const implications = Object.entries(practicalImplications);

  return (
    <section className="bg-white rounded-xl sm:rounded-2xl border-2 border-indigo-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 sm:px-5 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              💡 What This Means For You
            </h3>
            <p className="text-white/90 text-xs sm:text-sm mt-0.5">
              Actionable insights for different audiences
            </p>
          </div>
        </div>
      </div>

      {/* Implications Grid */}
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {implications.map(([audience, implication], idx) => (
            <div
              key={audience}
              className="group bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-indigo-700 mb-2">
                    {formatAudience(audience)}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {implication}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
