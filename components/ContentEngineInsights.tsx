/**
 * Content Engine Insights - User-Friendly Display
 * Shows search trend insights in clear, conversational language
 */

import type { GeneratedNarrative } from '@/lib/insights/narrative';
import DataSources from '@/components/DataSources';

type InsightsSectionProps = {
  narrative: GeneratedNarrative;
  terms: string[];
};

export default function ContentEngineInsights({
  narrative,
  terms,
}: InsightsSectionProps) {
  const prettyTerm = (t: string) => t.replace(/-/g, ' ');

  // Filter out technical sections and overview
  const userFriendlySections = narrative.sections.filter(
    section => section.type !== 'overview' && section.confidence > 50
  );

  // Simplify language in content
  const humanizeContent = (content: string): string => {
    return content
      .replace(/momentum/gi, 'growth rate')
      .replace(/volatility/gi, 'consistency')
      .replace(/R²/g, 'reliability')
      .replace(/correlation/gi, 'connection')
      .replace(/z-score/gi, 'unusualness')
      .replace(/\d+% confidence/gi, '') // Remove confidence percentages
      .replace(/\s+/g, ' ') // Clean up extra spaces
      .trim();
  };

  return (
    <div className="space-y-8">
      {/* Section 1: What the Data Tells Us - Main insights in simple language */}
      <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            What the Data Tells Us
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Here's what we found by analyzing search patterns and trends
          </p>
        </div>

        <div className="p-6 space-y-4">
          {narrative.keyTakeaways.slice(0, 4).map((takeaway, i) => {
            // Simplify the takeaway text
            const simplified = humanizeContent(takeaway)
              .replace(/is stable with 0% trend strength/gi, 'has steady search interest')
              .replace(/is trending \d+% stronger/gi, (match) => {
                const num = match.match(/\d+/)?.[0];
                return `is getting ${num}% more searches`;
              })
              .replace(/Largest spike: (\d+)% surge/gi, (match, num) => {
                return `Biggest jump: ${num}% increase in searches`;
              })
              .replace(/(\d+)% stability score/gi, (match, num) => {
                const score = parseInt(num);
                if (score > 75) return 'very consistent search volume';
                if (score > 50) return 'fairly consistent search volume';
                return 'search volume varies quite a bit';
              });

            return (
              <div key={i} className="flex gap-4 items-start group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  {i + 1}
                </div>
                <p className="text-slate-700 leading-relaxed pt-1">
                  {simplified}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Understanding the Trends - Detailed breakdown */}
      <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            Understanding the Trends
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            A closer look at how each term is performing over time
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {userFriendlySections.map((section, idx) => {
            // Skip if content is too technical
            if (section.content.includes('R²') || section.content.includes('std dev')) {
              return null;
            }

            const isComparison = section.type === 'comparison';
            const isTrend = section.type === 'trend';
            const isSeasonal = section.type === 'seasonal';
            const isEvents = section.type === 'events';

            // Determine icon and label based on type
            let icon = '📊';
            let label = 'Analysis';

            if (isComparison) {
              icon = '⚖️';
              label = 'Head-to-Head';
            } else if (isTrend) {
              icon = '📈';
              label = 'Trend Direction';
            } else if (isSeasonal) {
              icon = '📅';
              label = 'Patterns Over Time';
            } else if (isEvents) {
              icon = '⭐';
              label = 'Notable Moments';
            }

            // Clean up the title
            const cleanTitle = section.title
              .replace(/Trend Analysis:/gi, '')
              .replace(/Comparative Analysis/gi, 'Direct Comparison')
              .replace(/Notable Events & Spikes/gi, 'Standout Moments')
              .replace(/Seasonal Patterns/gi, 'Recurring Patterns')
              .trim();

            // Humanize the content
            const humanContent = humanizeContent(section.content)
              .replace(/shows \d+% stronger momentum/gi, 'is getting more searches')
              .replace(/stable with \d+% variation/gi, 'has fairly steady interest')
              .replace(/trending stronger/gi, 'getting more popular')
              .replace(/momentum advantage/gi, 'search growth lead');

            // Special handling for events section - parse out individual events
            if (isEvents && humanContent.includes('On ')) {
              const eventMatches = humanContent.match(/On [^.]+\./g) || [];
              const intro = humanContent.split('On ')[0];
              const outro = humanContent.split('.').slice(-1)[0];

              return (
                <div key={idx} className="p-6 bg-gradient-to-br from-amber-50/30 to-orange-50/20 border-t-2 border-amber-200/50">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {cleanTitle}
                        </h3>
                        <span className="text-xs font-medium text-amber-700 uppercase tracking-wide flex-shrink-0 bg-amber-100 px-2 py-1 rounded">
                          {label}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-3">{intro.trim()}</p>
                    </div>
                  </div>

                  <div className="space-y-2 ml-11">
                    {eventMatches.map((event, i) => {
                      // Extract date and description
                      const parts = event.match(/On ([^,]+), ([^-]+) - (.+)\./) ||
                                    event.match(/On ([^,]+), (.+)\./);
                      if (!parts) return null;

                      // Check if this is a REAL event (not generic calendar fallback)
                      // Real events include: Product Launch, Announcement, Conference, Verified, Documentary, Netflix, etc.
                      // NOT: "Christmas shopping", "New Year", "Black Friday" (unless it's about actual retail news)
                      const isGenericCalendarEvent =
                        event.includes('Christmas holiday shopping') ||
                        event.includes('New Year resolutions and shopping') ||
                        event.includes('Black Friday shopping event') ||
                        event.includes('Cyber Monday online shopping');

                      // Check for verified events OR events with specific context (from APIs or database)
                      const hasVerifiedMarkers =
                        event.includes('Verified by multiple sources') ||
                        event.includes('Product Launch') ||
                        event.includes('Announcement') ||
                        event.includes('Conference') ||
                        event.includes('Documentary') ||
                        event.includes('Album') ||
                        event.includes('Release') ||
                        event.includes('Event') ||
                        event.includes('Outage') ||
                        event.includes('Update') ||
                        event.includes('Launch') ||
                        event.includes('expansion') ||
                        event.includes('crackdown') ||
                        event.includes('shutdown') ||
                        event.includes('acquired') ||
                        event.includes('partnership');

                      const hasRealEvent = hasVerifiedMarkers && !isGenericCalendarEvent;

                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            hasRealEvent
                              ? 'bg-white border-emerald-200 shadow-sm'
                              : 'bg-white/50 border-slate-200'
                          }`}
                        >
                          <div className="flex gap-2 items-start">
                            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-2"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {event.replace(/^On /, '').replace(/\.$/, '')}
                              </p>
                              {hasRealEvent && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Real Event Identified
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>

                  {outro && (
                    <p className="text-xs text-slate-600 mt-3 ml-11 italic">
                      {outro.trim()}
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {cleanTitle}
                      </h3>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex-shrink-0">
                        {label}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {humanContent}
                    </p>
                  </div>
                </div>
              </div>
            );
          }).filter(Boolean)}
        </div>
      </section>

      {/* Optional: Why This Matters - Context for users */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
        <div className="flex gap-3 items-start">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">
              Why This Analysis Matters
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              These insights help you understand search behavior, spot trends early, and see how interest
              in different topics changes over time. Whether you're doing research, making business decisions,
              or just curious about what people are searching for, this data gives you the full picture.
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources - Use reusable component */}
      <DataSources />
    </div>
  );
}
