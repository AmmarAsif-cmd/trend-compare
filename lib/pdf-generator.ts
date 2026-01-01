/**
 * PDF Generation Utility for Comparison Reports
 * Professional, executive-ready PDF reports
 * Uses Puppeteer to generate professional PDF reports
 */

import puppeteer from 'puppeteer';
import { shouldShowForecast } from './forecast-guardrails';
import { filterValidEvidence } from './evidence-validation';
import { formatTermForPDF } from './term-formatter';
import { generateScoreChartImage, generateForecastChartImage } from './chart-image-generator';
import { 
  getOrGenerateChartImage, 
  createScoreChartCacheKey, 
  createForecastChartCacheKey,
  createPdfCacheKey,
  getCachedPdf,
  cachePdf,
} from './pdf-cache';
import type { SeriesPoint } from './trends';
import type { ComparisonCategory } from './category-resolver';

export type ComparisonPDFData = {
  termA: string;
  termB: string;
  slug: string;
  timeframe: string;
  geo: string;
  verdict: {
    winner: string;
    loser: string;
    winnerScore: number;
    loserScore: number;
    margin: number;
    confidence: number;
    headline: string;
    recommendation: string;
    category: string;
    sources: string[];
  };
  scores: {
    termA: {
      overall: number;
      breakdown: {
        searchInterest: number;
        socialBuzz: number;
        authority: number;
        momentum: number;
      };
    };
    termB: {
      overall: number;
      breakdown: {
        searchInterest: number;
        socialBuzz: number;
        authority: number;
        momentum: number;
      };
    };
  };
  aiInsights?: {
    category: string;
    whatDataTellsUs: string[];
    whyThisMatters: string;
    keyDifferences: string;
    volatilityAnalysis: string;
    peakExplanations?: {
      termA?: string;
      termB?: string;
    };
    practicalImplications?: Record<string, string>;
    prediction?: string;
  } | null;
  geographicData?: {
    countries: Array<{ name: string; termAValue: number; termBValue: number }>;
  };
  predictions?: {
    predictionsA?: {
      predictions: Array<{ date: string; value: number; confidence: number }>;
      trend: 'rising' | 'falling' | 'stable';
      confidence: number;
      forecastPeriod: number;
      methods: string[];
      explanation: string;
      metrics?: { dataQuality: number; volatility: number; trendStrength: number };
    } | null;
    predictionsB?: {
      predictions: Array<{ date: string; value: number; confidence: number }>;
      trend: 'rising' | 'falling' | 'stable';
      confidence: number;
      forecastPeriod: number;
      methods: string[];
      explanation: string;
      metrics?: { dataQuality: number; volatility: number; trendStrength: number };
    } | null;
    historicalDataPoints?: number;
  };
  generatedAt: string;
  reportUrl: string;
  // V2 additions
  metrics?: {
    gapChangePoints: number;
    confidenceChange: number;
    volatilityDelta: number;
    agreementIndex: number;
    volatility: number;
    stability: 'stable' | 'hype' | 'volatile';
    topDrivers: Array<{ name: string; impact: number }>;
    riskFlags: string[];
  };
  evidence?: Array<{
    source: string;
    termAValue: number;
    termBValue: number;
    direction: 'termA' | 'termB' | 'tie';
    magnitude: number;
    interpretation: string;
  }>;
  exportVersion?: string;
  modelVersion?: string;
  dataFreshness?: {
    lastUpdatedAt: string;
    source: string;
  };
  // Series data for chart generation
  series?: SeriesPoint[];
  category?: ComparisonCategory;
};

/**
 * Generate HTML content for PDF
 * Professional, executive-ready format
 */
function generatePDFHTML(
  data: ComparisonPDFData,
  scoreChartImageBase64?: string,
  forecastChartImageBase64?: string
): string {
  const termAFormatted = formatTermForPDF(data.termA);
  const termBFormatted = formatTermForPDF(data.termB);
  const date = new Date(data.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const winnerFormatted = formatTermForPDF(data.verdict.winner);
  const loserFormatted = formatTermForPDF(data.verdict.loser);

  // Filter evidence to only meaningful values
  const validEvidence = data.evidence ? filterValidEvidence(data.evidence) : [];

  // Check if forecast should be shown
  const forecastGuardrail = data.predictions && data.metrics ? shouldShowForecast({
    seriesLength: data.predictions.historicalDataPoints || 0,
    volatility: data.metrics.volatility,
    disagreementFlag: data.metrics.agreementIndex < 60,
    agreementIndex: data.metrics.agreementIndex,
  }) : { shouldShow: false, reason: 'No forecast data available' };

  // Get top 2 peak explanations (max 2) - rewrite to remove speculation
  const peakExplanations: Array<{ term: string; date: string; explanation: string }> = [];
  if (data.aiInsights?.peakExplanations) {
    // Extract dates and rewrite explanations to be evidence-based
    const rewritePeakExplanation = (text: string): string => {
      if (!text || text.trim().length === 0) {
        return 'A spike occurred during this period. This usually indicates a news or event-driven surge. TrendArc cannot confirm the exact cause without external event data.';
      }
      
      // Remove speculative language like "likely", "probably", "may have"
      let rewritten = text
        .replace(/\b(likely|probably|may have|might have|could have|possibly|perhaps|might|may|could)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // If we have no external evidence, say so clearly
      if (rewritten.length < 20 || rewritten.toLowerCase().includes('unknown') || rewritten.toLowerCase().includes('no data')) {
        return 'A spike occurred during this period. This usually indicates a news or event-driven surge. TrendArc cannot confirm the exact cause without external event data.';
      }
      
      // Make it evidence-based - start with factual statement
      if (!rewritten.toLowerCase().includes('spike') && !rewritten.toLowerCase().includes('surge') && !rewritten.toLowerCase().includes('occurred')) {
        rewritten = `A spike occurred during this period. ${rewritten}`;
      }
      
      return rewritten;
    };
    
    // Handle both old format (object with termA/termB) and new format (array)
    if (Array.isArray(data.aiInsights.peakExplanations)) {
      // New format: array of peak explanations
      for (const peak of data.aiInsights.peakExplanations.slice(0, 2)) {
        const term = peak.term === 'termA' ? termAFormatted : termBFormatted;
        const date = peak.peakDate ? new Date(peak.peakDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent period';
        peakExplanations.push({
          term,
          date,
          explanation: rewritePeakExplanation(peak.text || ''),
        });
      }
    } else {
      // Old format: object with termA and termB properties
      const oldFormat = data.aiInsights.peakExplanations as any;
      if (oldFormat.termA) {
        peakExplanations.push({ 
          term: termAFormatted, 
          date: 'Recent period',
          explanation: rewritePeakExplanation(oldFormat.termA)
        });
      }
      if (oldFormat.termB && peakExplanations.length < 2) {
        peakExplanations.push({ 
          term: termBFormatted, 
          date: 'Recent period',
          explanation: rewritePeakExplanation(oldFormat.termB)
        });
      }
    }
  }

  // Generate "What changed" bullets (max 3)
  const whatChanged: string[] = [];
  if (data.metrics) {
    if (Math.abs(data.metrics.gapChangePoints) > 0.1) {
      const direction = data.metrics.gapChangePoints > 0 ? 'widened' : 'narrowed';
      whatChanged.push(`Gap ${direction} by ${Math.abs(data.metrics.gapChangePoints).toFixed(1)} points`);
    }
    if (Math.abs(data.metrics.confidenceChange) > 0.1) {
      const direction = data.metrics.confidenceChange > 0 ? 'improved' : 'declined';
      whatChanged.push(`Confidence ${direction} by ${Math.abs(data.metrics.confidenceChange).toFixed(1)}%`);
    }
    if (Math.abs(data.metrics.volatilityDelta) > 0.1) {
      const direction = data.metrics.volatilityDelta > 0 ? 'increased' : 'reduced';
      whatChanged.push(`Volatility ${direction} by ${Math.abs(data.metrics.volatilityDelta).toFixed(1)}%`);
    }
  }
  const whatChangedBullets = whatChanged.slice(0, 3);

  // Generate "Why this matters" (2-3 sentences)
  const whyThisMatters = data.aiInsights?.whyThisMatters || 
    `This comparison reveals the relative market position between ${termAFormatted} and ${termBFormatted}. The ${data.metrics?.stability || 'current'} trend pattern suggests ${data.verdict.confidence >= 70 ? 'strong' : 'moderate'} confidence in the observed differences.`;

  // Generate practical use cases
  const useCases: string[] = [];
  if (data.verdict.category === 'technology' || data.verdict.category === 'products') {
    useCases.push('Product positioning and market strategy');
    useCases.push('Competitive analysis and benchmarking');
    useCases.push('Investment and resource allocation decisions');
  } else if (data.verdict.category === 'entertainment' || data.verdict.category === 'media') {
    useCases.push('Content strategy and audience targeting');
    useCases.push('Marketing campaign planning');
    useCases.push('Trend monitoring and opportunity identification');
  } else {
    useCases.push('Strategic decision-making');
    useCases.push('Market trend analysis');
    useCases.push('Competitive intelligence');
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${termAFormatted} vs ${termBFormatted} - Trend Comparison Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
      font-size: 13px;
    }
    
    .page {
      padding: 30mm 25mm;
      page-break-after: always;
      min-height: 297mm;
      position: relative;
    }
    
    .page-number {
      display: none; /* Replaced by page-footer */
    }
    
    /* Cover Page */
    .cover-page {
      min-height: 297mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40mm 35mm;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      position: relative;
    }
    
    .cover-logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #2563eb;
      margin-bottom: 20px;
    }
    
    .cover-title {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .cover-title h1 {
      font-size: 42px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 20px;
      letter-spacing: -1px;
      color: #1a1a1a;
    }
    
    .cover-subtitle {
      font-size: 18px;
      font-weight: 500;
      color: #4b5563;
      margin-bottom: 40px;
    }
    
    .cover-meta {
      font-size: 14px;
      color: #6b7280;
      line-height: 2;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    
    .cover-meta-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
    }
    
    .cover-meta-label {
      font-weight: 600;
      color: #374151;
    }
    
    /* Page Headers */
    .page-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    
    .page-header h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.3px;
      margin: 0;
    }
    
    /* Sections */
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    /* Executive Summary */
    .verdict-sentence {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.5;
      margin-bottom: 32px;
      padding: 24px;
      background: #ffffff;
      border: 2px solid #2563eb;
      border-radius: 8px;
      text-align: center;
    }
    
    .winner-card {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #2563eb;
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 32px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
    }
    
    .winner-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .winner-name {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .winner-margin {
      font-size: 16px;
      font-weight: 600;
      color: #2563eb;
    }
    
    .winner-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    
    .winner-stat {
      text-align: center;
    }
    
    .winner-stat-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .winner-stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .bullet-list {
      list-style: none;
      padding: 0;
    }
    
    .bullet-list li {
      padding: 8px 0;
      padding-left: 20px;
      position: relative;
      font-size: 13px;
      line-height: 1.6;
      color: #374151;
    }
    
    .bullet-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #2563eb;
      font-weight: bold;
    }
    
    .why-matters {
      background: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      margin-top: 20px;
      font-size: 13px;
      line-height: 1.7;
      color: #374151;
    }
    
    /* Trust & Method */
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .trust-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
    }
    
    .trust-card-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .trust-card-value {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .methodology {
      background: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.7;
      color: #4b5563;
      margin-top: 20px;
    }
    
    /* Evidence Table */
    .evidence-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    
    .evidence-table thead {
      background: #f8fafc;
    }
    
    .evidence-table th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .evidence-table td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
      color: #374151;
    }
    
    .evidence-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    /* Score Breakdown */
    .score-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    
    .score-table thead {
      background: #f8fafc;
    }
    
    .score-table th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .score-table td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
      color: #374151;
    }
    
    .score-table tbody tr.winner-row {
      background: #eff6ff;
    }
    
    .score-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    /* Chart Placeholder */
    .chart-placeholder {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 60px 20px;
      text-align: center;
      margin-top: 16px;
    }
    
    .chart-placeholder-text {
      color: #9ca3af;
      font-size: 13px;
    }
    
    .chart-caption {
      margin-top: 12px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }
    
    /* Forecast */
    .forecast-note {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 6px;
      padding: 16px;
      margin-top: 16px;
    }
    
    .forecast-note-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .forecast-note-text {
      font-size: 12px;
      color: #78350f;
      line-height: 1.6;
    }
    
    /* Geographic Table */
    .geo-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    
    .geo-table thead {
      background: #f8fafc;
    }
    
    .geo-table th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .geo-table td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
      color: #374151;
    }
    
    .geo-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .geo-summary {
      margin-top: 16px;
      font-size: 12px;
      line-height: 1.7;
      color: #4b5563;
    }
    
    /* Peak Explanations */
    .peak-item {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    
    .peak-item-title {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    
    .peak-item-text {
      font-size: 12px;
      line-height: 1.7;
      color: #374151;
    }
    
    /* Use Cases */
    .use-case-list {
      list-style: none;
      padding: 0;
    }
    
    .use-case-list li {
      padding: 10px 0;
      padding-left: 24px;
      position: relative;
      font-size: 13px;
      line-height: 1.6;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .use-case-list li:last-child {
      border-bottom: none;
    }
    
    .use-case-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #2563eb;
      font-weight: bold;
      font-size: 16px;
    }
    
    /* Appendix */
    .appendix-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    
    .appendix-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
    }
    
    .appendix-table td:first-child {
      font-weight: 600;
      color: #374151;
      width: 40%;
    }
    
    .appendix-table td:last-child {
      color: #6b7280;
    }
    
    .appendix-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .legal-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
    
    @media print {
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- PAGE 1: COVER -->
  <div class="cover-page">
    <div>
      <div class="cover-logo">TRENDARC</div>
    </div>
    <div class="cover-title">
      <h1>${termAFormatted}<br>vs<br>${termBFormatted}</h1>
      <div class="cover-subtitle">Trend Comparison Report</div>
    </div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Timeframe:</span>
        <span>${data.timeframe.toUpperCase()}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Region:</span>
        <span>${data.geo || 'Worldwide'}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Category:</span>
        <span>${data.verdict.category.charAt(0).toUpperCase() + data.verdict.category.slice(1)}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Generated:</span>
        <span>${date}</span>
      </div>
    </div>
  </div>

  <!-- PAGE 2: EXECUTIVE SUMMARY -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 2</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Executive Summary</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    <div class="verdict-sentence">
      ${data.verdict.headline || `${winnerFormatted} leads ${loserFormatted} with a ${data.verdict.margin.toFixed(1)}-point advantage and ${data.verdict.confidence}% confidence.`}
    </div>
    
    <div class="winner-card">
      <div class="winner-card-header">
        <div class="winner-name">${winnerFormatted}</div>
        <div class="winner-margin">+${data.verdict.margin.toFixed(1)} points</div>
      </div>
      <div class="winner-stats">
        <div class="winner-stat">
          <div class="winner-stat-label">Winner Score</div>
          <div class="winner-stat-value">${data.verdict.winnerScore.toFixed(1)}</div>
        </div>
        <div class="winner-stat">
          <div class="winner-stat-label">Margin</div>
          <div class="winner-stat-value">${data.verdict.margin.toFixed(1)}</div>
        </div>
        <div class="winner-stat">
          <div class="winner-stat-label">Confidence</div>
          <div class="winner-stat-value">${data.verdict.confidence}%</div>
        </div>
      </div>
      </div>
    </div>
    
    ${whatChangedBullets.length > 0 ? `
    <div class="section">
      <div class="section-title">What Changed Recently</div>
      <ul class="bullet-list">
        ${whatChangedBullets.map(bullet => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">Why This Matters</div>
      <div class="why-matters">
        ${whyThisMatters}
      </div>
    </div>
  </div>

  <!-- PAGE 3: TRUST & METHOD SNAPSHOT -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 3</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Trust & Method Snapshot</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    <div class="trust-grid">
      <div class="trust-card">
        <div class="trust-card-label">Confidence Score</div>
        <div class="trust-card-value">${data.verdict.confidence}%</div>
      </div>
      <div class="trust-card">
        <div class="trust-card-label">Source Agreement</div>
        <div class="trust-card-value">${data.metrics?.agreementIndex ? data.metrics.agreementIndex.toFixed(0) + '%' : 'N/A'}</div>
      </div>
      <div class="trust-card">
        <div class="trust-card-label">Data Freshness</div>
        <div class="trust-card-value" style="font-size: 14px;">${data.dataFreshness ? new Date(data.dataFreshness.lastUpdatedAt).toLocaleDateString() : new Date(data.generatedAt).toLocaleDateString()}</div>
      </div>
      <div class="trust-card">
        <div class="trust-card-label">Forecast Available</div>
        <div class="trust-card-value" style="font-size: 14px;">${forecastGuardrail.shouldShow ? 'Yes' : 'No'}</div>
      </div>
    </div>
    
    <div class="methodology">
      <strong>Scoring Methodology:</strong> TrendArc combines multiple data sources including search interest, social engagement, authority metrics, and momentum indicators. Each metric is normalized to a 0-100 scale and weighted by reliability. The final score represents a composite view of relative market position.
    </div>
  </div>

  <!-- PAGE 4: KEY EVIDENCE -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 4</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Key Evidence</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    ${validEvidence.length > 0 ? `
    <table class="evidence-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Leader</th>
          <th>Difference</th>
          <th>Interpretation</th>
        </tr>
      </thead>
      <tbody>
        ${validEvidence.map(ev => {
          const leader = ev.direction === 'termA' ? termAFormatted : ev.direction === 'termB' ? termBFormatted : 'Tie';
          return `
        <tr>
          <td><strong>${ev.source}</strong></td>
          <td>${leader}</td>
          <td>${ev.magnitude.toFixed(1)} points</td>
          <td>${ev.interpretation}</td>
        </tr>
        `;
        }).join('')}
      </tbody>
    </table>
    ${(() => {
      const neutralCount = [
        data.scores.termA.breakdown.socialBuzz,
        data.scores.termB.breakdown.socialBuzz,
        data.scores.termA.breakdown.authority,
        data.scores.termB.breakdown.authority,
      ].filter((score, idx) => {
        const isSocialBuzz = idx < 2;
        const termAVal = isSocialBuzz ? data.scores.termA.breakdown.socialBuzz : data.scores.termA.breakdown.authority;
        const termBVal = isSocialBuzz ? data.scores.termB.breakdown.socialBuzz : data.scores.termB.breakdown.authority;
        return Math.abs(termAVal - termBVal) < 0.5 && (termAVal < 10 || termBVal < 10);
      }).length;
      
      if (neutralCount > 0) {
        return `<p style="margin-top: 16px; font-size: 12px; color: #6b7280; font-style: italic;">Some sources show neutral signals in this period.</p>`;
      }
      return '';
    })()}
    ` : `
    <p style="color: #6b7280; font-size: 13px;">Limited evidence available for this comparison.</p>
    `}
  </div>

  <!-- PAGE 5: SCORE BREAKDOWN -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 5</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Score Breakdown</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    <table class="score-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>${termAFormatted}</th>
          <th>${termBFormatted}</th>
          <th>Difference</th>
        </tr>
      </thead>
      <tbody>
        <tr class="${data.verdict.winner === data.termA ? 'winner-row' : ''}">
          <td><strong>Overall Score</strong></td>
          <td><strong>${data.scores.termA.overall.toFixed(1)}</strong></td>
          <td>${data.scores.termB.overall.toFixed(1)}</td>
          <td><strong>${(data.scores.termA.overall - data.scores.termB.overall).toFixed(1)}</strong></td>
        </tr>
        <tr class="${data.verdict.winner === data.termA ? 'winner-row' : ''}">
          <td>Search Interest</td>
          <td>${data.scores.termA.breakdown.searchInterest.toFixed(1)}</td>
          <td>${data.scores.termB.breakdown.searchInterest.toFixed(1)}</td>
          <td>${(data.scores.termA.breakdown.searchInterest - data.scores.termB.breakdown.searchInterest).toFixed(1)}</td>
        </tr>
    ${(() => {
      const socialBuzzDiff = Math.abs(data.scores.termA.breakdown.socialBuzz - data.scores.termB.breakdown.socialBuzz);
      const socialBuzzNeutral = socialBuzzDiff < 0.5 && 
        (data.scores.termA.breakdown.socialBuzz < 10 || data.scores.termB.breakdown.socialBuzz < 10);
      
      if (socialBuzzNeutral) {
        return ''; // Skip neutral/low coverage rows
      }
      return `
    <tr class="${data.verdict.winner === data.termA ? 'winner-row' : ''}">
      <td>Social Buzz</td>
      <td>${data.scores.termA.breakdown.socialBuzz.toFixed(1)}</td>
      <td>${data.scores.termB.breakdown.socialBuzz.toFixed(1)}</td>
      <td>${(data.scores.termA.breakdown.socialBuzz - data.scores.termB.breakdown.socialBuzz).toFixed(1)}</td>
    </tr>`;
    })()}
    ${(() => {
      const authorityDiff = Math.abs(data.scores.termA.breakdown.authority - data.scores.termB.breakdown.authority);
      const authorityNeutral = authorityDiff < 0.5 && 
        (data.scores.termA.breakdown.authority < 10 || data.scores.termB.breakdown.authority < 10);
      
      if (authorityNeutral) {
        return ''; // Skip neutral/low coverage rows
      }
      return `
    <tr class="${data.verdict.winner === data.termA ? 'winner-row' : ''}">
      <td>Authority</td>
      <td>${data.scores.termA.breakdown.authority.toFixed(1)}</td>
      <td>${data.scores.termB.breakdown.authority.toFixed(1)}</td>
      <td>${(data.scores.termA.breakdown.authority - data.scores.termB.breakdown.authority).toFixed(1)}</td>
    </tr>`;
    })()}
        <tr class="${data.verdict.winner === data.termA ? 'winner-row' : ''}">
          <td>Momentum</td>
          <td>${data.scores.termA.breakdown.momentum.toFixed(1)}</td>
          <td>${data.scores.termB.breakdown.momentum.toFixed(1)}</td>
          <td>${(data.scores.termA.breakdown.momentum - data.scores.termB.breakdown.momentum).toFixed(1)}</td>
        </tr>
      </tbody>
    </table>
    ${(() => {
      const socialBuzzDiff = Math.abs(data.scores.termA.breakdown.socialBuzz - data.scores.termB.breakdown.socialBuzz);
      const socialBuzzNeutral = socialBuzzDiff < 0.5 && 
        (data.scores.termA.breakdown.socialBuzz < 10 || data.scores.termB.breakdown.socialBuzz < 10);
      const authorityDiff = Math.abs(data.scores.termA.breakdown.authority - data.scores.termB.breakdown.authority);
      const authorityNeutral = authorityDiff < 0.5 && 
        (data.scores.termA.breakdown.authority < 10 || data.scores.termB.breakdown.authority < 10);
      
      if (socialBuzzNeutral || authorityNeutral) {
        return `<p style="margin-top: 16px; font-size: 12px; color: #6b7280; font-style: italic;">Some sources show neutral signals in this period.</p>`;
      }
      return '';
    })()}
  </div>

  <!-- PAGE 6: TREND OVER TIME -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 6</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Trend Over Time</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    ${scoreChartImageBase64 ? `
    <div style="text-align: center; margin: 20px 0;">
      <img src="data:image/png;base64,${scoreChartImageBase64}" alt="Score Over Time Chart" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 6px;" />
    </div>
    <div class="chart-caption" style="margin-top: 12px; font-size: 12px; color: #6b7280; line-height: 1.6;">
      ${data.metrics?.stability === 'stable' 
        ? `The trend demonstrates stability with consistent patterns over the selected timeframe.` 
        : data.metrics?.stability === 'hype' 
        ? `The trend shows significant volatility, suggesting event-driven spikes.` 
        : `The trend shows moderate variation over time.`}
    </div>
    ` : `
    <div class="chart-placeholder">
      <div class="chart-placeholder-text">Chart generation unavailable</div>
    </div>
    `}
  </div>

  <!-- PAGE 7: FORECAST -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 7</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Forecast</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    ${forecastGuardrail.shouldShow && data.predictions && forecastChartImageBase64 ? `
    <div style="text-align: center; margin: 20px 0;">
      <img src="data:image/png;base64,${forecastChartImageBase64}" alt="Forecast Chart" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 6px;" />
    </div>
    <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #4b5563; line-height: 1.6;">
      <strong>Forecast Summary:</strong> Based on ${data.predictions.historicalDataPoints || 0} historical data points. ${data.predictions.predictionsA ? `${termAFormatted}: ${data.predictions.predictionsA.trend === 'rising' ? 'Rising' : data.predictions.predictionsA.trend === 'falling' ? 'Falling' : 'Stable'} trend (${data.predictions.predictionsA.confidence.toFixed(0)}% confidence). ` : ''}${data.predictions.predictionsB ? `${termBFormatted}: ${data.predictions.predictionsB.trend === 'rising' ? 'Rising' : data.predictions.predictionsB.trend === 'falling' ? 'Falling' : 'Stable'} trend (${data.predictions.predictionsB.confidence.toFixed(0)}% confidence). ` : ''}Forecasts are directional indicators, not exact volume predictions.
    </div>
    ` : `
    <div class="forecast-note" style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-top: 16px;">
      <div class="forecast-note-title" style="font-weight: 600; color: #374151; margin-bottom: 8px;">Forecast Not Shown</div>
      <div class="forecast-note-text" style="font-size: 12px; color: #6b7280; line-height: 1.6;">
        ${forecastGuardrail.reason || 'Forecasts are shown only when reliability is sufficient. High volatility or low source agreement reduces forecast reliability.'}
      </div>
    </div>
    `}
  </div>

  <!-- PAGE 8: GEOGRAPHIC INSIGHTS -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 8</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Geographic Insights</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    ${data.geographicData && data.geographicData.countries && data.geographicData.countries.length > 0 ? `
    <table class="geo-table">
      <thead>
        <tr>
          <th>Country</th>
          <th>${termAFormatted}</th>
          <th>${termBFormatted}</th>
          <th>Leader</th>
        </tr>
      </thead>
      <tbody>
        ${data.geographicData.countries.slice(0, 12).map(country => {
          const leader = country.termAValue >= country.termBValue ? termAFormatted : termBFormatted;
          return `
        <tr>
          <td><strong>${country.name}</strong></td>
          <td>${country.termAValue.toFixed(1)}</td>
          <td>${country.termBValue.toFixed(1)}</td>
          <td>${leader}</td>
        </tr>
        `;
        }).join('')}
      </tbody>
    </table>
    <div class="geo-summary">
      Regional data reflects relative interest from Google Trends. Higher values indicate stronger relative interest in that region. The top regions demonstrate clear preferences, while competitive regions show closer margins.
    </div>
    ` : `
    <p style="color: #6b7280; font-size: 13px;">Geographic data is unavailable for this comparison.</p>
    `}
  </div>

  <!-- PAGE 9: CONTEXT BEHIND MAJOR PEAKS -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 9</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Context Behind Major Peaks</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    ${peakExplanations.length > 0 ? peakExplanations.slice(0, 2).map(peak => `
    <div class="peak-item">
      <div class="peak-item-title">${peak.term} - ${peak.date}</div>
      <div class="peak-item-text">${peak.explanation}</div>
    </div>
    `).join('') : `
    <p style="color: #6b7280; font-size: 13px;">No significant peak events identified in this timeframe.</p>
    `}
  </div>

  <!-- PAGE 10: HOW TO USE THIS INSIGHT -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 10</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>How to Use This Insight</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    <ul class="use-case-list">
      ${useCases.map(useCase => `<li>${useCase}</li>`).join('')}
    </ul>
  </div>

  <!-- PAGE 11: APPENDIX -->
  <div class="page">
    <div class="page-footer">
      <span>TrendArc Report</span>
      <span>Page 11</span>
      <span>${date}</span>
    </div>
    <div class="page-header">
      <div class="page-header-left">
        <h2>Appendix</h2>
      </div>
      <div class="page-header-right">${data.slug}</div>
    </div>
    
    <table class="appendix-table">
      <tbody>
        <tr>
          <td>Sources</td>
          <td>${data.verdict.sources.join(', ')}</td>
        </tr>
        <tr>
          <td>Model Version</td>
          <td>${data.modelVersion || 'TrendArc v1.0'}</td>
        </tr>
        <tr>
          <td>Export Version</td>
          <td>${data.exportVersion || '2.0'}</td>
        </tr>
        <tr>
          <td>Computed At</td>
          <td>${new Date(data.generatedAt).toISOString()}</td>
        </tr>
        <tr>
          <td>Data Freshness</td>
          <td>${data.dataFreshness ? new Date(data.dataFreshness.lastUpdatedAt).toISOString() : new Date(data.generatedAt).toISOString()}</td>
        </tr>
        <tr>
          <td>Region</td>
          <td>${data.geo || 'Worldwide'}</td>
        </tr>
        <tr>
          <td>Timeframe</td>
          <td>${data.timeframe}</td>
        </tr>
        <tr>
          <td>Terms</td>
          <td>${data.termA} vs ${data.termB}</td>
        </tr>
        <tr>
          <td>Live Report</td>
          <td><a href="${data.reportUrl}" style="color: #2563eb; text-decoration: none;">${data.reportUrl}</a></td>
        </tr>
      </tbody>
    </table>
    
    <div class="legal-footer">
      <p>This report was generated on ${date}</p>
      <p>Report ID: ${data.slug}</p>
      <p style="margin-top: 16px;">© ${new Date().getFullYear()} TrendArc. All rights reserved.</p>
      <p style="margin-top: 8px;">This report is for informational purposes only. Data accuracy is not guaranteed.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate PDF from comparison data
 * Uses caching to avoid regenerating identical PDFs
 */
export async function generateComparisonPDF(data: ComparisonPDFData): Promise<Buffer> {
  // Check if PDF is already cached
  const pdfCacheKey = createPdfCacheKey(
    data.slug,
    data.timeframe,
    data.geo
  );
  
  const cachedPdf = await getCachedPdf(pdfCacheKey);
  if (cachedPdf) {
    console.log('[PDF Generator] Using cached PDF:', pdfCacheKey);
    return cachedPdf;
  }
  
  let browser;
  
  try {
    // Generate chart images if series data is available
    let scoreChartImageBase64: string | undefined;
    let forecastChartImageBase64: string | undefined;
    
    if (data.series && data.series.length > 0) {
      try {
        // Generate or get cached score chart image
        const chartCacheKey = createScoreChartCacheKey(
          data.slug,
          data.timeframe,
          data.geo
        );
        
        const scoreChartImage = await getOrGenerateChartImage(
          () => generateScoreChartImage(
            data.series!,
            data.termA,
            data.termB,
            data.category || 'general',
            { width: 800, height: 400, deviceScaleFactor: 2 }
          ),
          chartCacheKey
        );
        
        if (scoreChartImage) {
          scoreChartImageBase64 = scoreChartImage.toString('base64');
        }
      } catch (error) {
        console.warn('[PDF Generator] Error generating score chart image:', error);
      }
      
      // Generate forecast chart image if forecast should be shown
      const forecastGuardrail = data.predictions && data.metrics ? shouldShowForecast({
        seriesLength: data.predictions.historicalDataPoints || 0,
        volatility: data.metrics.volatility,
        disagreementFlag: data.metrics.agreementIndex < 60,
        agreementIndex: data.metrics.agreementIndex,
      }) : { shouldShow: false, reason: 'No forecast data available' };
      
      if (forecastGuardrail.shouldShow && data.predictions?.predictionsA) {
        try {
          // Generate or get cached forecast chart for termA
          const forecastCacheKey = createForecastChartCacheKey(
            data.slug,
            data.termA,
            data.timeframe,
            data.geo
          );
          
          const forecastPoints = data.predictions.predictionsA.predictions.map(p => ({
            date: p.date,
            value: p.value,
            lowerBound: p.value * 0.9,
            upperBound: p.value * 1.1,
          }));
          
          const forecastChartImage = await getOrGenerateChartImage(
            () => generateForecastChartImage(
              data.series!,
              forecastPoints,
              data.termA,
              { width: 800, height: 400, deviceScaleFactor: 2 }
            ),
            forecastCacheKey
          );
          
          if (forecastChartImage) {
            forecastChartImageBase64 = forecastChartImage.toString('base64');
          }
        } catch (error) {
          console.warn('[PDF Generator] Error generating forecast chart image:', error);
        }
      }
    }
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    // Generate HTML with embedded chart images
    const html = generatePDFHTML(data, scoreChartImageBase64, forecastChartImageBase64);
    
    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    const pdfBuffer = Buffer.from(pdf);
    
    // Cache the generated PDF
    await cachePdf(pdfCacheKey, pdfBuffer).catch(err => {
      console.warn('[PDF Generator] Failed to cache PDF:', err);
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
