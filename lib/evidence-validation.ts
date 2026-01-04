/**
 * Evidence Validation
 * Filters evidence cards to only show meaningful numeric data
 */

import type { EvidenceCard } from './prepare-evidence';

/**
 * Check if an evidence item has meaningful numeric values
 */
export function isValidEvidenceItem(item: EvidenceCard): boolean {
  // Check if termAValue and termBValue are valid numbers
  const hasValidTermA = typeof item.termAValue === 'number' && 
                        !isNaN(item.termAValue) && 
                        isFinite(item.termAValue) &&
                        item.termAValue > 0;
  
  const hasValidTermB = typeof item.termBValue === 'number' && 
                        !isNaN(item.termBValue) && 
                        isFinite(item.termBValue) &&
                        item.termBValue > 0;

  // At least one term must have a valid value
  if (!hasValidTermA && !hasValidTermB) {
    return false;
  }

  // Check magnitude is meaningful (not zero or NaN)
  const hasValidMagnitude = typeof item.magnitude === 'number' &&
                            !isNaN(item.magnitude) &&
                            isFinite(item.magnitude) &&
                            item.magnitude >= 0;

  if (!hasValidMagnitude) {
    return false;
  }

  // Check interpretation doesn't contain placeholder text
  const interpretation = item.interpretation || '';
  const hasPlaceholderText = 
    interpretation.includes('N/A') ||
    interpretation.includes('—') ||
    interpretation.includes('No data') ||
    interpretation.includes('unavailable') ||
    interpretation.includes('not available') ||
    interpretation.trim() === '';

  if (hasPlaceholderText) {
    return false;
  }

  // Check if interpretation contains at least one number
  const hasNumberInText = /\d+/.test(interpretation);
  if (!hasNumberInText && item.magnitude === 0) {
    return false;
  }

  return true;
}

/**
 * Filter evidence cards to only include valid items
 */
export function filterValidEvidence(evidence: EvidenceCard[]): EvidenceCard[] {
  return evidence.filter(isValidEvidenceItem);
}

