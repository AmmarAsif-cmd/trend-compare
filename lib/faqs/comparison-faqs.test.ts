/**
 * Unit tests for buildComparisonFaqs
 */

import { describe, it, expect } from 'vitest';
import { buildComparisonFaqs, type ComparisonFAQData } from './comparison-faqs';

describe('buildComparisonFaqs', () => {
  const baseData: ComparisonFAQData = {
    termA: 'react',
    termB: 'vue',
    winner: 'react',
    loser: 'vue',
    topDrivers: [
      { name: 'Search Interest', impact: 85 },
      { name: 'Social Buzz', impact: 70 },
    ],
    agreementIndex: 80,
    disagreementFlag: false,
    stability: 'stable',
    volatility: 15,
    gapChangePoints: -2.5,
    series: [
      { date: '2024-01-01', react: 80, vue: 60 },
      { date: '2024-01-02', react: 82, vue: 58 },
      { date: '2024-01-03', react: 85, vue: 55 },
    ],
    geoData: {
      termA_dominance: [
        { country: 'United States', termA_value: 90, termB_value: 50 },
        { country: 'Canada', termA_value: 85, termB_value: 55 },
      ],
      termB_dominance: [
        { country: 'Germany', termA_value: 40, termB_value: 80 },
      ],
    },
  };

  it('should return 3-6 FAQs when all data is available', () => {
    const faqs = buildComparisonFaqs(baseData);
    expect(faqs.length).toBeGreaterThanOrEqual(3);
    expect(faqs.length).toBeLessThanOrEqual(6);
  });

  it('should include "why winner leads" FAQ when topDrivers available', () => {
    const faqs = buildComparisonFaqs(baseData);
    const whyLeads = faqs.find(f => f.id === 'why-winner-leads');
    expect(whyLeads).toBeDefined();
    expect(whyLeads?.question).toContain('Why does React lead');
    expect(whyLeads?.answer).toContain('Search Interest');
  });

  it('should include "has loser overtaken" FAQ when series available', () => {
    const faqs = buildComparisonFaqs(baseData);
    const overtaken = faqs.find(f => f.id === 'has-loser-overtaken');
    expect(overtaken).toBeDefined();
    expect(overtaken?.question).toContain('Has Vue ever overtaken');
  });

  it('should include "stable or hype" FAQ when stability available', () => {
    const faqs = buildComparisonFaqs(baseData);
    const stable = faqs.find(f => f.id === 'stable-or-hype');
    expect(stable).toBeDefined();
    expect(stable?.answer).toContain('stable');
  });

  it('should include "regional preferences" FAQ when geoData available', () => {
    const faqs = buildComparisonFaqs(baseData);
    const regional = faqs.find(f => f.id === 'regional-preferences');
    expect(regional).toBeDefined();
    expect(regional?.answer).toContain('United States');
  });

  it('should include "gap change" FAQ when gapChangePoints significant', () => {
    const faqs = buildComparisonFaqs(baseData);
    const gapChange = faqs.find(f => f.id === 'gap-change');
    expect(gapChange).toBeDefined();
    expect(gapChange?.answer).toContain('narrowed');
  });

  it('should handle missing data gracefully', () => {
    const minimalData: ComparisonFAQData = {
      termA: 'react',
      termB: 'vue',
      winner: 'react',
      loser: 'vue',
      topDrivers: [],
      agreementIndex: 50,
      disagreementFlag: true,
      stability: 'volatile',
      volatility: 50,
      gapChangePoints: 0,
    };
    const faqs = buildComparisonFaqs(minimalData);
    expect(faqs.length).toBeGreaterThanOrEqual(0);
    expect(faqs.length).toBeLessThanOrEqual(6);
  });

  it('should detect historical flips correctly', () => {
    const flipData: ComparisonFAQData = {
      ...baseData,
      series: [
        { date: '2024-01-01', react: 60, vue: 80 }, // Vue leads
        { date: '2024-01-02', react: 80, vue: 60 }, // React leads (flip)
        { date: '2024-01-03', react: 85, vue: 55 },
      ],
    };
    const faqs = buildComparisonFaqs(flipData);
    const overtaken = faqs.find(f => f.id === 'has-loser-overtaken');
    expect(overtaken?.answer).toContain('Yes');
    expect(overtaken?.answer).toContain('overtaken');
  });
});

