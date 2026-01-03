/**
 * Comparison-Specific FAQs
 * Dynamic FAQs generated from comparison data
 * All answers are deterministic and derived from real metrics
 */

export interface ComparisonFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ComparisonFAQData {
  termA: string;
  termB: string;
  winner: string;
  loser: string;
  topDrivers: Array<{ name: string; impact: number }>;
  agreementIndex: number;
  disagreementFlag: boolean;
  stability: 'stable' | 'hype' | 'volatile';
  volatility: number;
  gapChangePoints: number;
  series?: Array<{ date: string; [key: string]: string | number }>;
  geoData?: {
    termA_dominance: Array<{ country: string; termA_value: number; termB_value: number }>;
    termB_dominance: Array<{ country: string; termA_value: number; termB_value: number }>;
  };
}

function prettyTerm(t: string): string {
  return t.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Build comparison-specific FAQs from available data
 * Returns 3-6 FAQs based on available metrics
 */
export function buildComparisonFaqs(data: ComparisonFAQData): ComparisonFAQ[] {
  const faqs: ComparisonFAQ[] = [];
  const winnerPretty = prettyTerm(data.winner);
  const loserPretty = prettyTerm(data.loser);
  const termAPretty = prettyTerm(data.termA);
  const termBPretty = prettyTerm(data.termB);

  // FAQ 1: Why does winner lead loser?
  if (data.topDrivers && data.topDrivers.length > 0) {
    const topDriver = data.topDrivers[0];
    const secondDriver = data.topDrivers[1];
    let answer = `${winnerPretty} leads primarily due to ${topDriver.name.toLowerCase()}.`;
    if (secondDriver) {
      answer += ` ${secondDriver.name} also contributes significantly.`;
    }
    if (data.disagreementFlag) {
      answer += ' Note: Some sources disagree, indicating nuanced trends across platforms.';
    } else if (data.agreementIndex >= 80) {
      answer += ' Multiple sources agree on this trend, indicating strong consensus.';
    }
    faqs.push({
      id: 'why-winner-leads',
      question: `Why does ${winnerPretty} lead ${loserPretty} in this period?`,
      answer,
    });
  }

  // FAQ 2: Has loser ever overtaken winner?
  if (data.series && data.series.length > 0) {
    let hasFlipped = false;
    let flipCount = 0;
    for (let i = 1; i < data.series.length; i++) {
      const prevA = Number(data.series[i - 1][data.termA] || 0);
      const prevB = Number(data.series[i - 1][data.termB] || 0);
      const currA = Number(data.series[i][data.termA] || 0);
      const currB = Number(data.series[i][data.termB] || 0);
      
      const prevLeader = prevA > prevB ? data.termA : data.termB;
      const currLeader = currA > currB ? data.termA : data.termB;
      
      if (prevLeader !== currLeader && prevLeader === data.loser) {
        hasFlipped = true;
        flipCount++;
      }
    }

    if (hasFlipped) {
      faqs.push({
        id: 'has-loser-overtaken',
        question: `Has ${loserPretty} ever overtaken ${winnerPretty}?`,
        answer: `Yes. Historical data shows ${loserPretty} has led ${winnerPretty} at least ${flipCount} time${flipCount > 1 ? 's' : ''} in the past. The current trend favors ${winnerPretty}, but past flips suggest this could change.`,
      });
    } else {
      faqs.push({
        id: 'has-loser-overtaken',
        question: `Has ${loserPretty} ever overtaken ${winnerPretty}?`,
        answer: `No. Throughout the available time period, ${winnerPretty} has consistently maintained the lead. This suggests a stable trend with ${loserPretty} consistently trailing.`,
      });
    }
  }

  // FAQ 3: Is this trend stable or hype?
  if (data.stability && data.volatility !== undefined) {
    let answer = '';
    if (data.stability === 'stable') {
      answer = `This trend is classified as stable. ${winnerPretty} shows consistent popularity with low volatility (${data.volatility.toFixed(1)}%). This suggests a sustainable trend rather than a temporary spike.`;
    } else if (data.stability === 'hype') {
      answer = `This trend shows signs of hype. High volatility (${data.volatility.toFixed(1)}%) and potential spikes suggest this may be a temporary surge rather than a long-term trend. Monitor closely for changes.`;
    } else {
      answer = `This trend is volatile. Fluctuations (${data.volatility.toFixed(1)}% volatility) indicate uncertainty. The lead could shift, so regular monitoring is recommended.`;
    }
    faqs.push({
      id: 'stable-or-hype',
      question: 'Is this trend stable or hype?',
      answer,
    });
  }

  // FAQ 4: Which regions prefer termA vs termB?
  if (data.geoData && (data.geoData.termA_dominance.length > 0 || data.geoData.termB_dominance.length > 0)) {
    const topA = data.geoData.termA_dominance.slice(0, 3).map(r => r.country);
    const topB = data.geoData.termB_dominance.slice(0, 3).map(r => r.country);
    
    let answer = '';
    if (topA.length > 0) {
      answer += `${termAPretty} leads in ${topA.join(', ')}`;
      if (topB.length > 0) {
        answer += `. ${termBPretty} leads in ${topB.join(', ')}.`;
      } else {
        answer += '.';
      }
    } else if (topB.length > 0) {
      answer += `${termBPretty} leads in ${topB.join(', ')}.`;
    }
    
    if (answer) {
      answer += ' Regional preferences reflect relative search interest from Google Trends.';
      faqs.push({
        id: 'regional-preferences',
        question: `Which regions prefer ${termAPretty} vs ${termBPretty}?`,
        answer,
      });
    }
  }

  // FAQ 5: Did the gap widen or narrow recently?
  if (data.gapChangePoints !== undefined && Math.abs(data.gapChangePoints) > 0.5) {
    const change = Math.abs(data.gapChangePoints);
    if (data.gapChangePoints > 0) {
      faqs.push({
        id: 'gap-change',
        question: 'Did the gap widen or narrow recently?',
        answer: `The gap widened by ${change.toFixed(1)} points. ${winnerPretty} extended its lead over ${loserPretty}, suggesting strengthening momentum.`,
      });
    } else {
      faqs.push({
        id: 'gap-change',
        question: 'Did the gap widen or narrow recently?',
        answer: `The gap narrowed by ${change.toFixed(1)} points. ${loserPretty} is closing in on ${winnerPretty}, indicating a potential shift in the trend.`,
      });
    }
  }

  // FAQ 6: Source agreement
  if (data.agreementIndex !== undefined) {
    if (data.disagreementFlag) {
      faqs.push({
        id: 'source-agreement',
        question: 'Do all sources agree on this comparison?',
        answer: `Sources show some disagreement (${data.agreementIndex.toFixed(0)}% agreement). This suggests different platforms measure different aspects of popularity. Consider the breakdown by source to understand the nuances.`,
      });
    } else if (data.agreementIndex >= 80) {
      faqs.push({
        id: 'source-agreement',
        question: 'Do all sources agree on this comparison?',
        answer: `Yes, sources show strong agreement (${data.agreementIndex.toFixed(0)}% agreement). Multiple data sources align, indicating a consistent trend across platforms.`,
      });
    }
  }

  // Return max 4 FAQs (prioritize the most relevant)
  return faqs.slice(0, 4);
}

