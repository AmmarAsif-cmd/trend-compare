/**
 * Key Takeaways
 * Semantic H2 + bullet points derived from metrics
 * Appears below Verdict card, above "Why you can trust this result"
 */

function prettyTerm(t: string): string {
  return t.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

interface KeyTakeawaysProps {
  winner: string;
  loser: string;
  margin: number;
  confidence: number;
  volatility: number;
  stability: 'stable' | 'hype' | 'volatile';
  agreementIndex: number;
}

export default function KeyTakeaways({
  winner,
  loser,
  margin,
  confidence,
  volatility,
  stability,
  agreementIndex,
}: KeyTakeawaysProps) {
  const winnerPretty = prettyTerm(winner);
  const loserPretty = prettyTerm(loser);
  
  // Calculate leader change risk from volatility and margin
  // Higher volatility + lower margin = higher risk
  const leaderChangeRisk = Math.min(100, volatility * 0.7 + (margin < 5 ? 50 : margin < 15 ? 30 : 0));
  
  const takeaways: string[] = [];

  // Takeaway 1: Winner and margin
  if (margin >= 10) {
    takeaways.push(`${winnerPretty} leads ${loserPretty} by a significant margin of ${Math.round(margin)} percentage points.`);
  } else if (margin >= 5) {
    takeaways.push(`${winnerPretty} leads ${loserPretty} by ${Math.round(margin)} percentage points.`);
  } else {
    takeaways.push(`${winnerPretty} has a narrow lead over ${loserPretty} with ${Math.round(margin)} percentage points, indicating a close competition.`);
  }

  // Takeaway 2: Volatility
  if (volatility < 20) {
    takeaways.push('Search interest is relatively stable with low volatility, suggesting consistent patterns.');
  } else if (volatility < 40) {
    takeaways.push('Search interest shows moderate volatility, indicating some fluctuation in attention levels.');
  } else {
    takeaways.push('Search interest is highly volatile, suggesting significant fluctuations driven by events or trends.');
  }

  // Takeaway 3: Leader change risk
  if (leaderChangeRisk < 30) {
    takeaways.push('The current leader is unlikely to change soon, indicating a stable trend pattern.');
  } else if (leaderChangeRisk < 60) {
    takeaways.push('There is a moderate risk of leadership change, suggesting the trend could shift.');
  } else {
    takeaways.push('There is a high risk of leadership change, indicating the comparison is highly dynamic.');
  }

  // Takeaway 4: Confidence
  if (confidence >= 80) {
    takeaways.push(`High confidence score (${Math.round(confidence)}%) indicates reliable and consistent data across sources.`);
  } else if (confidence >= 60) {
    takeaways.push(`Moderate confidence score (${Math.round(confidence)}%) suggests generally reliable data with some variation.`);
  } else {
    takeaways.push(`Lower confidence score (${Math.round(confidence)}%) indicates more variability in the data, requiring cautious interpretation.`);
  }

  // Takeaway 5: Agreement index or stability
  if (agreementIndex >= 80) {
    takeaways.push('Multiple data sources show strong agreement, reinforcing the reliability of these findings.');
  } else if (agreementIndex < 60) {
    takeaways.push('Data sources show some disagreement, indicating nuanced trends that vary across platforms.');
  } else if (stability === 'hype') {
    takeaways.push('The trend pattern shows hype-driven spikes rather than sustained organic growth.');
  }

  // Limit to 4-5 takeaways
  const finalTakeaways = takeaways.slice(0, 5);

  return (
    <section className="bg-slate-50 rounded-xl border border-slate-200 p-5 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">Key Takeaways</h2>
      <ul className="space-y-3 list-none pl-0">
        {finalTakeaways.map((takeaway, idx) => (
          <li key={idx} className="flex items-start gap-3 text-base sm:text-lg text-slate-700 leading-relaxed">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2.5" aria-hidden="true" />
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

