/**
 * Validate and improve AI-generated peak explanations
 * Filters out vague explanations and suggests improvements
 */

export function validatePeakExplanation(explanation: string, peakValue: number): {
  isValid: boolean;
  isVague: boolean;
  improved?: string;
} {
  if (!explanation || explanation.trim().length === 0) {
    return { isValid: false, isVague: true };
  }

  const lowerExplanation = explanation.toLowerCase();

  // Check for vague phrases that indicate poor quality explanations
  const vaguePhrases = [
    'some event',
    'a related event',
    'some notable',
    'notable occurrence',
    'related occurrence',
    'some occurrence',
    'an event took place',
    'a [',
    'some [',
    'increased interest', // without explaining why
    'gained attention', // without explaining why
    'became popular', // without explaining why
  ];

  const isVague = vaguePhrases.some(phrase => lowerExplanation.includes(phrase));

  // Check if explanation is too short or lacks specifics
  const isTooShort = explanation.length < 50;
  const lacksSpecifics = !lowerExplanation.match(/\b(announced|launched|released|revealed|leaked|controversy|viral|update|news|article|report|study|event|premiere|debut)\b/i);

  // If vague or lacks specifics, mark as invalid
  if (isVague || (isTooShort && lacksSpecifics)) {
    // Try to improve it
    let improved = explanation;

    // If it mentions a category but not specific event, suggest improvement
    if (lowerExplanation.includes('related event') || lowerExplanation.includes('notable occurrence')) {
      improved = `The exact cause is unclear, but possible reasons include: a product announcement, news coverage, or a viral social media moment around this date. This was a ${peakValue < 20 ? 'minor' : peakValue < 40 ? 'moderate' : 'significant'} peak (${peakValue}/100).`;
    }

    return {
      isValid: false,
      isVague: true,
      improved,
    };
  }

  return { isValid: true, isVague: false };
}


