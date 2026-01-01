/**
 * Unit tests for evidence validation
 */

import { describe, it, expect } from 'vitest';
import { isValidEvidenceItem, filterValidEvidence } from './evidence-validation';
import type { EvidenceCard } from './prepare-evidence';

describe('isValidEvidenceItem', () => {
  it('should accept evidence with valid numeric values', () => {
    const item: EvidenceCard = {
      source: 'Search Interest',
      termAValue: 75.5,
      termBValue: 50.2,
      direction: 'termA',
      magnitude: 25.3,
      interpretation: 'Term A leads by 25.3 points',
    };
    expect(isValidEvidenceItem(item)).toBe(true);
  });

  it('should reject evidence with zero values', () => {
    const item: EvidenceCard = {
      source: 'Social Buzz',
      termAValue: 0,
      termBValue: 0,
      direction: 'tie',
      magnitude: 0,
      interpretation: 'No data available',
    };
    expect(isValidEvidenceItem(item)).toBe(false);
  });

  it('should reject evidence with NaN values', () => {
    const item: EvidenceCard = {
      source: 'Authority',
      termAValue: NaN,
      termBValue: 50,
      direction: 'termB',
      magnitude: 50,
      interpretation: 'Term B leads by 50 points',
    };
    expect(isValidEvidenceItem(item)).toBe(false);
  });

  it('should reject evidence with placeholder text', () => {
    const item: EvidenceCard = {
      source: 'Momentum',
      termAValue: 50,
      termBValue: 50,
      direction: 'tie',
      magnitude: 0,
      interpretation: 'N/A',
    };
    expect(isValidEvidenceItem(item)).toBe(false);
  });

  it('should reject evidence with "No data" text', () => {
    const item: EvidenceCard = {
      source: 'Social Buzz',
      termAValue: 0,
      termBValue: 0,
      direction: 'tie',
      magnitude: 0,
      interpretation: 'No data available for this source',
    };
    expect(isValidEvidenceItem(item)).toBe(false);
  });

  it('should accept evidence with at least one valid value', () => {
    const item: EvidenceCard = {
      source: 'Search Interest',
      termAValue: 75,
      termBValue: 0,
      direction: 'termA',
      magnitude: 75,
      interpretation: 'Term A leads by 75 points',
    };
    expect(isValidEvidenceItem(item)).toBe(true);
  });

  it('should reject evidence with empty interpretation', () => {
    const item: EvidenceCard = {
      source: 'Authority',
      termAValue: 50,
      termBValue: 50,
      direction: 'tie',
      magnitude: 0,
      interpretation: '',
    };
    expect(isValidEvidenceItem(item)).toBe(false);
  });
});

describe('filterValidEvidence', () => {
  it('should filter out invalid evidence items', () => {
    const evidence: EvidenceCard[] = [
      {
        source: 'Search Interest',
        termAValue: 75,
        termBValue: 50,
        direction: 'termA',
        magnitude: 25,
        interpretation: 'Term A leads by 25 points',
      },
      {
        source: 'Social Buzz',
        termAValue: 0,
        termBValue: 0,
        direction: 'tie',
        magnitude: 0,
        interpretation: 'N/A',
      },
      {
        source: 'Authority',
        termAValue: 60,
        termBValue: 40,
        direction: 'termA',
        magnitude: 20,
        interpretation: 'Term A leads by 20 points',
      },
    ];

    const filtered = filterValidEvidence(evidence);
    expect(filtered.length).toBe(2);
    expect(filtered[0].source).toBe('Search Interest');
    expect(filtered[1].source).toBe('Authority');
  });

  it('should return empty array if all evidence is invalid', () => {
    const evidence: EvidenceCard[] = [
      {
        source: 'Social Buzz',
        termAValue: 0,
        termBValue: 0,
        direction: 'tie',
        magnitude: 0,
        interpretation: 'No data',
      },
    ];
    expect(filterValidEvidence(evidence)).toEqual([]);
  });
});

