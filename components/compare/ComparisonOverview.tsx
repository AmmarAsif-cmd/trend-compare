/**
 * Comparison Overview
 * Server-rendered narrative content for SEO
 * Appears immediately after H1, before "What Changed" section
 */

import Link from 'next/link';
import { getRelatedComparisons } from '@/lib/relatedComparisons';

function prettyTerm(t: string): string {
  return t.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatTimeframe(tf: string): string {
  const map: Record<string, string> = {
    '7d': 'the past 7 days',
    '30d': 'the past 30 days',
    '12m': 'the past 12 months',
    '5y': 'the past 5 years',
    'all': 'since 2004',
  };
  return map[tf] || `the selected period`;
}

interface ComparisonOverviewProps {
  termA: string;
  termB: string;
  winner: string;
  loser: string;
  margin: number;
  confidence: number;
  timeframe: string;
  stability: 'stable' | 'hype' | 'volatile';
  category?: string | null;
  currentSlug: string;
}

export default async function ComparisonOverview({
  termA,
  termB,
  winner,
  loser,
  margin,
  confidence,
  timeframe,
  stability,
  category,
  currentSlug,
}: ComparisonOverviewProps) {
  const termAPretty = prettyTerm(termA);
  const termBPretty = prettyTerm(termB);
  const winnerPretty = prettyTerm(winner);
  const loserPretty = prettyTerm(loser);
  const timeframeLabel = formatTimeframe(timeframe);

  // Get one related comparison for inline link
  let relatedComparison: { slug: string; terms: string[] } | null = null;
  try {
    const related = await getRelatedComparisons({
      slug: currentSlug,
      terms: [termA, termB],
      limit: 1,
      category,
    });
    if (related.length > 0) {
      relatedComparison = related[0];
    }
  } catch (error) {
    // Silently fail - related comparison is optional
  }

  // Paragraph 1: What is being compared and why
  const categoryContext = category && category !== 'general' 
    ? ` in the ${category} category`
    : '';
  const paragraph1 = `This comparison analyzes search interest trends between ${termAPretty} and ${termBPretty}${categoryContext}. Users typically compare these two to understand which is gaining more attention, whether for purchasing decisions, research purposes, or tracking market trends.`;

  // Paragraph 2: Who leads based on current data
  const marginText = margin >= 10 
    ? `with a ${Math.round(margin)} percentage point advantage`
    : margin >= 5
    ? `with a ${Math.round(margin)} percentage point lead`
    : `by a narrow ${Math.round(margin)} percentage point margin`;
  
  const confidenceText = confidence >= 80
    ? `high confidence (${Math.round(confidence)}%)`
    : confidence >= 60
    ? `moderate confidence (${Math.round(confidence)}%)`
    : `lower confidence (${Math.round(confidence)}%)`;

  const paragraph2 = `Based on recent search interest data${timeframe !== '12m' ? ` for ${timeframeLabel}` : ''}, ${winnerPretty} currently shows stronger momentum than ${loserPretty}, ${marginText} and a ${confidenceText} score. This comparison reflects how consumer attention has shifted over ${timeframeLabel} rather than sales figures or product quality assessments.`;

  // Paragraph 3: What the trend pattern suggests
  const stabilityText = stability === 'stable'
    ? 'relatively stable pattern'
    : stability === 'hype'
    ? 'notable spikes and hype-driven interest'
    : 'highly volatile pattern with frequent fluctuations';
  
  const paragraph3 = `The trend data shows a ${stabilityText} over ${timeframeLabel}. ${stability === 'stable' ? 'This suggests consistent interest levels with minimal dramatic shifts.' : stability === 'hype' ? 'This indicates interest driven by events, launches, or media coverage rather than sustained organic growth.' : 'This suggests the comparison is sensitive to external factors and may change direction quickly.'}`;

  return (
    <div className="prose prose-slate max-w-none text-slate-700 space-y-4 mb-6 sm:mb-8">
      <p className="text-base sm:text-lg leading-relaxed">
        {paragraph1}
        {relatedComparison && (
          <> For similar insights, see our comparison of{' '}
            <Link 
              href={`/compare/${relatedComparison.slug}`}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              {prettyTerm(relatedComparison.terms[0])} vs {prettyTerm(relatedComparison.terms[1])}
            </Link>.
          </>
        )}
      </p>
      <p className="text-base sm:text-lg leading-relaxed">
        {paragraph2}
      </p>
      <p className="text-base sm:text-lg leading-relaxed">
        {paragraph3}
      </p>
    </div>
  );
}

