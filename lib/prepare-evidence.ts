/**
 * Prepare evidence cards from comparison data
 * Memoized to avoid recomputation
 */

import type { SeriesPoint } from './trends';
import { memoize, stableHash } from '@/lib/utils/memoize';

export interface EvidenceCard {
  source: string;
  termAValue: number;
  termBValue: number;
  direction: 'termA' | 'termB' | 'tie';
  magnitude: number;
  interpretation: string;
}

/**
 * Prepare evidence cards (internal, not memoized)
 */
function prepareEvidenceCardsInternal(
  breakdownA: { [key: string]: number },
  breakdownB: { [key: string]: number },
  termA: string,
  termB: string
): EvidenceCard[] {
  const sourceNames: { [key: string]: string } = {
    searchInterest: 'Search Interest (Google Trends)',
    socialBuzz: 'Social Buzz',
    authority: 'Authority',
    momentum: 'Momentum',
  };

  const cards: EvidenceCard[] = [];

  for (const [key, valueA] of Object.entries(breakdownA)) {
    if (key === 'overall') continue;
    
    const valueB = breakdownB[key] || 0;
    const magnitude = Math.abs(valueA - valueB);
    const direction = valueA > valueB ? 'termA' : valueA < valueB ? 'termB' : 'tie';
    
    const sourceName = sourceNames[key] || key;
    const winnerName = direction === 'termA' ? termA.replace(/-/g, ' ') : direction === 'termB' ? termB.replace(/-/g, ' ') : 'Both';
    
    let interpretation = '';
    if (direction === 'tie') {
      interpretation = `${sourceName} shows similar levels for both terms.`;
    } else {
      interpretation = `${winnerName} leads in ${sourceName.toLowerCase()} by ${magnitude.toFixed(1)} points.`;
    }
    
    cards.push({
      source: sourceName,
      termAValue: valueA,
      termBValue: valueB,
      direction,
      magnitude,
      interpretation,
    });
  }

  // Sort by magnitude (strongest first)
  return cards.sort((a, b) => b.magnitude - a.magnitude);
}

/**
 * Prepare evidence cards (memoized)
 * Memoized with 5-minute TTL
 */
export const prepareEvidenceCards = memoize(
  prepareEvidenceCardsInternal,
  5 * 60 * 1000, // 5 minutes TTL
  (breakdownA, breakdownB, termA, termB) => {
    return stableHash({ breakdownA, breakdownB, termA, termB });
  }
);

