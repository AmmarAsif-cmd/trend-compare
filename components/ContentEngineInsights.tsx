/**
 * Content Engine Insights Display Component
 * Shows pattern detection results in a beautiful UI
 */

import type { GeneratedNarrative } from '@/lib/insights/narrative';

type InsightsSectionProps = {
  narrative: GeneratedNarrative;
  terms: string[];
};

export default function ContentEngineInsights({
  narrative,
  terms,
}: InsightsSectionProps) {
  const prettyTerm = (t: string) => t.replace(/-/g, ' ');

  return (
    <div className="space-y-6">
      {/* Key Takeaways */}
      <section className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Key Insights at a Glance
          </h2>
          <ul className="space-y-2.5">
            {narrative.keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {takeaway}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Narrative Sections */}
      {narrative.sections.map((section, idx) => {
        // Skip overview section if it exists (we show headline/subtitle already)
        if (section.type === 'overview') return null;

        const colors = {
          trend: { border: 'border-blue-200', bg: 'from-blue-50/70 via-white to-blue-50/40', accent: 'from-blue-400/5', icon: '📊' },
          comparison: { border: 'border-purple-200', bg: 'from-purple-50/70 via-white to-purple-50/40', accent: 'from-purple-400/5', icon: '⚖️' },
          seasonal: { border: 'border-amber-200', bg: 'from-amber-50/70 via-white to-amber-50/40', accent: 'from-amber-400/5', icon: '📅' },
          events: { border: 'border-rose-200', bg: 'from-rose-50/70 via-white to-rose-50/40', accent: 'from-rose-400/5', icon: '⚡' },
          forecast: { border: 'border-indigo-200', bg: 'from-indigo-50/70 via-white to-indigo-50/40', accent: 'from-indigo-400/5', icon: '🔮' },
        };

        const color = colors[section.type as keyof typeof colors] || colors.trend;

        return (
          <section
            key={idx}
            className={`rounded-xl sm:rounded-2xl border ${color.border} bg-gradient-to-br ${color.bg} shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 relative overflow-hidden group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${color.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-xl">{color.icon}</span>
                  {section.title}
                </h3>
                <span className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold bg-white/80 backdrop-blur-sm text-slate-600 rounded-full border border-slate-200">
                  {section.confidence}% confidence
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          </section>
        );
      })}

      {/* Uniqueness Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 text-sm text-slate-600">
          <span className="font-semibold">Content Uniqueness:</span>
          <span className="font-bold text-slate-900">{narrative.uniquenessScore.toFixed(0)}/100</span>
          <span className="text-xs text-slate-500">(SEO-optimized)</span>
        </div>
      </div>
    </div>
  );
}
