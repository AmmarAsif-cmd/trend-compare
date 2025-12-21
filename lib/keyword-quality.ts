/**
 * Keyword Quality Scoring System
 *
 * Analyzes keyword pairs for SEO quality, search potential, and spam detection.
 * Scores range from 0-100, with higher being better quality.
 */

import { validateTopic } from './validateTermsServer';

export type QualityScore = {
  overall: number;           // 0-100 overall quality score
  breakdown: {
    validity: number;        // 0-25: Are terms valid/safe?
    searchability: number;   // 0-25: Likely to be searched?
    competitiveness: number; // 0-25: Good competition level?
    clarity: number;         // 0-25: Clear and unambiguous?
  };
  issues: string[];          // List of quality issues
  recommendations: string[]; // Suggestions for improvement
  isApproved: boolean;       // Pass/fail based on threshold
};

// Minimum score to auto-approve (can be adjusted)
const APPROVAL_THRESHOLD = 60;

// Common patterns that indicate high search potential
const HIGH_VALUE_PATTERNS = [
  // Tech products
  /\b(iphone|android|ios|windows|mac|linux|chrome|firefox|safari)\b/i,
  // Popular brands
  /\b(apple|samsung|google|microsoft|amazon|netflix|spotify|tesla)\b/i,
  // Entertainment
  /\b(marvel|dc|star wars|harry potter|game of thrones|stranger things)\b/i,
  // Common comparisons
  /\b(vs|versus|compared|difference|better|best)\b/i,
  // Years (indicates current/recent)
  /\b(202[0-9]|2019|2018)\b/,
  // Version numbers (indicates specific products)
  /\b(pro|plus|max|ultra|premium|basic|standard)\b/i,
];

// Patterns that indicate low quality or spam
const LOW_QUALITY_PATTERNS = [
  /test|demo|sample|example|dummy|placeholder/i,
  /asdf|qwerty|zzz|xxx|aaa|bbb/i,
  /^\d+$/,  // Just numbers
  /^[a-z]$/i,  // Single letter
  /(.)\1{4,}/,  // Repeated characters (aaaa, 1111)
];

// Common words that make comparisons unclear
const VAGUE_WORDS = new Set([
  'thing', 'stuff', 'item', 'object', 'best', 'good', 'bad',
  'new', 'old', 'better', 'worse', 'one', 'two', 'first', 'second',
]);

/**
 * Calculate quality score for a keyword pair
 */
export function scoreKeywordPair(termA: string, termB: string): QualityScore {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const breakdown = {
    validity: 0,
    searchability: 0,
    competitiveness: 0,
    clarity: 0,
  };

  // Normalize terms
  const normalizedA = termA.trim();
  const normalizedB = termB.trim();

  // 1. VALIDITY SCORE (0-25 points)
  // Check if both terms pass validation
  const resultA = validateTopic(normalizedA);
  const resultB = validateTopic(normalizedB);
  const aValid = resultA.ok;
  const bValid = resultB.ok;

  if (!aValid) {
    issues.push(`Term A "${normalizedA}" failed validation: ${!resultA.ok ? resultA.reason : 'unknown'}`);
  }
  if (!bValid) {
    issues.push(`Term B "${normalizedB}" failed validation: ${!resultB.ok ? resultB.reason : 'unknown'}`);
  }

  if (aValid && bValid) {
    breakdown.validity = 25;
  } else if (aValid || bValid) {
    breakdown.validity = 10;
  } else {
    breakdown.validity = 0;
    recommendations.push('Use valid terms that pass security filters');
  }

  // Check for low quality patterns
  for (const pattern of LOW_QUALITY_PATTERNS) {
    if (pattern.test(normalizedA) || pattern.test(normalizedB)) {
      breakdown.validity = Math.max(0, breakdown.validity - 10);
      issues.push('Contains low-quality or test patterns');
      break;
    }
  }

  // 2. SEARCHABILITY SCORE (0-25 points)
  // Estimate if people will search for this comparison
  let searchability = 0;

  // Length check (2-30 chars is ideal)
  const avgLength = (normalizedA.length + normalizedB.length) / 2;
  if (avgLength >= 3 && avgLength <= 30) {
    searchability += 10;
  } else if (avgLength > 30) {
    issues.push('Terms are too long (reduces searchability)');
    recommendations.push('Use shorter, more concise terms');
  } else {
    issues.push('Terms are too short (may be too generic)');
  }

  // Check for high-value patterns
  const combinedText = `${normalizedA} ${normalizedB}`;
  let hasHighValuePattern = false;
  for (const pattern of HIGH_VALUE_PATTERNS) {
    if (pattern.test(combinedText)) {
      searchability += 5;
      hasHighValuePattern = true;
      break;
    }
  }

  // Word count (2-4 words per term is ideal)
  const aWords = normalizedA.split(/\s+/).length;
  const bWords = normalizedB.split(/\s+/).length;
  if (aWords >= 1 && aWords <= 4 && bWords >= 1 && bWords <= 4) {
    searchability += 5;
  } else {
    recommendations.push('Keep terms between 1-4 words for best results');
  }

  // Proper capitalization (indicates real names/brands)
  const hasCapitalization = /[A-Z]/.test(normalizedA) || /[A-Z]/.test(normalizedB);
  if (hasCapitalization) {
    searchability += 5;
  }

  breakdown.searchability = Math.min(25, searchability);

  if (breakdown.searchability < 15 && !hasHighValuePattern) {
    recommendations.push('Consider using more specific, branded, or popular terms');
  }

  // 3. COMPETITIVENESS SCORE (0-25 points)
  // Check if terms are comparable (similar type/category)
  let competitiveness = 15; // Start with baseline

  // Both terms should be different
  if (normalizedA.toLowerCase() === normalizedB.toLowerCase()) {
    issues.push('Terms are identical (not a comparison)');
    competitiveness = 0;
    breakdown.competitiveness = 0;
    recommendations.push('Use two different terms to compare');
  } else {
    // Check similarity in length (should be somewhat similar)
    const lengthRatio = Math.min(normalizedA.length, normalizedB.length) /
                        Math.max(normalizedA.length, normalizedB.length);
    if (lengthRatio > 0.5) {
      competitiveness += 5;
    }

    // Check if both have similar capitalization patterns
    const aHasCaps = /[A-Z]/.test(normalizedA);
    const bHasCaps = /[A-Z]/.test(normalizedB);
    if (aHasCaps === bHasCaps) {
      competitiveness += 5;
    }

    breakdown.competitiveness = Math.min(25, competitiveness);
  }

  // 4. CLARITY SCORE (0-25 points)
  // Check if terms are clear and unambiguous
  let clarity = 15; // Start with baseline

  // Check for vague words
  const aVague = normalizedA.toLowerCase().split(/\s+/).some(w => VAGUE_WORDS.has(w));
  const bVague = normalizedB.toLowerCase().split(/\s+/).some(w => VAGUE_WORDS.has(w));

  if (aVague || bVague) {
    clarity -= 5;
    issues.push('Contains vague or generic words');
    recommendations.push('Use specific names, brands, or products instead of generic terms');
  } else {
    clarity += 5;
  }

  // Check for numbers/versions (indicates specificity)
  const hasNumbers = /\d/.test(combinedText);
  if (hasNumbers) {
    clarity += 5;
  }

  breakdown.clarity = Math.min(25, clarity);

  // Calculate overall score
  const overall = breakdown.validity +
                  breakdown.searchability +
                  breakdown.competitiveness +
                  breakdown.clarity;

  // Determine approval status
  const isApproved = overall >= APPROVAL_THRESHOLD;

  // Add final recommendations based on overall score
  if (overall < 40) {
    recommendations.push('Overall quality is low - consider different keyword pairs');
  } else if (overall < 60) {
    recommendations.push('Quality is acceptable but could be improved');
  } else if (overall >= 80) {
    recommendations.push('Excellent quality - highly recommended!');
  }

  return {
    overall,
    breakdown,
    issues,
    recommendations,
    isApproved,
  };
}

/**
 * Batch score multiple keyword pairs
 */
export function scoreKeywordPairs(pairs: Array<[string, string]>): Map<string, QualityScore> {
  const results = new Map<string, QualityScore>();

  for (const [termA, termB] of pairs) {
    const key = `${termA}|||${termB}`;
    results.set(key, scoreKeywordPair(termA, termB));
  }

  return results;
}

/**
 * Get human-readable quality label
 */
export function getQualityLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Very Poor';
}

/**
 * Get color for quality score (for UI)
 */
export function getQualityColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 70) return 'lime';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}

/**
 * Suggest improvements for a keyword pair
 */
export function suggestImprovements(termA: string, termB: string): string[] {
  const score = scoreKeywordPair(termA, termB);
  const suggestions: string[] = [];

  // Specific suggestions based on issues
  if (score.breakdown.validity < 20) {
    suggestions.push('✏️ Remove special characters, URLs, or blocked words');
  }

  if (score.breakdown.searchability < 15) {
    suggestions.push('🔍 Use more popular or branded terms (e.g., "iPhone" instead of "phone")');
    suggestions.push('📊 Consider adding version numbers or years (e.g., "iPhone 15" vs "Samsung S24")');
  }

  if (score.breakdown.competitiveness < 15) {
    suggestions.push('⚖️ Ensure terms are in the same category (both tech, both music, etc.)');
    suggestions.push('📏 Use terms of similar specificity (both brands or both products)');
  }

  if (score.breakdown.clarity < 15) {
    suggestions.push('✨ Be more specific - avoid vague words like "best", "new", "thing"');
    suggestions.push('🎯 Use proper names, brands, or specific products');
  }

  return suggestions;
}

/**
 * Compare quality of existing comparison data
 */
export interface ComparisonQualityReport {
  totalComparisons: number;
  highQuality: number;      // >= 80
  goodQuality: number;       // 60-79
  lowQuality: number;        // < 60
  averageScore: number;
  topComparisons: Array<{ terms: [string, string]; score: number }>;
  bottomComparisons: Array<{ terms: [string, string]; score: number }>;
}

/**
 * Analyze quality distribution of keyword database
 */
export function analyzeKeywordDatabase(
  keywords: Record<string, Array<[string, string]>>
): Record<string, { averageScore: number; count: number; quality: string }> {
  const categoryStats: Record<string, { total: number; sum: number; count: number }> = {};

  for (const [category, pairs] of Object.entries(keywords)) {
    categoryStats[category] = { total: 0, sum: 0, count: 0 };

    for (const [termA, termB] of pairs) {
      const score = scoreKeywordPair(termA, termB);
      categoryStats[category].sum += score.overall;
      categoryStats[category].count++;
    }
  }

  const results: Record<string, { averageScore: number; count: number; quality: string }> = {};
  for (const [category, stats] of Object.entries(categoryStats)) {
    const averageScore = stats.count > 0 ? Math.round(stats.sum / stats.count) : 0;
    results[category] = {
      averageScore,
      count: stats.count,
      quality: getQualityLabel(averageScore),
    };
  }

  return results;
}
