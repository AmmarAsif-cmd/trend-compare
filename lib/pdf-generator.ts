/**
 * PDF Generation Utility for Comparison Reports
 * Professional, executive-ready PDF reports
 * Rebuilt for clean, premium output
 */

// Use puppeteer-core for serverless, puppeteer for local dev
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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
    peakExplanations?: Array<{ term: string; peakDate: string; text: string }> | { termA?: string; termB?: string };
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
  series?: SeriesPoint[];
  category?: ComparisonCategory;
};

/**
 * Format category name for display
 */
function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Format timeframe for display
 */
function formatTimeframe(timeframe: string): string {
  const map: Record<string, string> = {
    '7d': '7 Days',
    '30d': '30 Days',
    '12m': '12 Months',
    '5y': '5 Years',
  };
  return map[timeframe] || timeframe.toUpperCase();
}

/**
 * Format region for display
 */
function formatRegion(geo: string): string {
  if (!geo || geo.trim() === '') return 'Worldwide';
  return geo;
}

/**
 * Check if a metric is meaningful (not neutral)
 */
function isMeaningfulMetric(valueA: number, valueB: number, threshold: number = 0.5): boolean {
  return Math.abs(valueA - valueB) >= threshold && (valueA >= 10 || valueB >= 10);
}

/**
 * Generate safe peak explanation (no speculation)
 */
function generateSafePeakExplanation(peakDate?: string): string {
  if (peakDate) {
    const date = new Date(peakDate);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `A spike occurred on ${formattedDate}. TrendArc cannot confirm the exact cause without verified external event data.`;
  }
  return 'A spike occurred during this period. TrendArc cannot confirm the exact cause without verified external event data.';
}

/**
 * Format confidence with context and explanation
 */
function formatConfidence(confidence: number, agreementIndex?: number, volatility?: number): { label: string; explanation: string } {
  let level: string;
  if (confidence >= 75) {
    level = 'High';
  } else if (confidence >= 60) {
    level = 'Moderate';
  } else {
    level = 'Low';
  }
  
  const explanationParts: string[] = [];
  if (agreementIndex !== undefined && agreementIndex < 60) {
    explanationParts.push('mixed signals across sources');
  }
  if (volatility !== undefined && volatility > 0.3) {
    explanationParts.push('moderate volatility');
  }
  if (explanationParts.length === 0) {
    explanationParts.push('data quality considerations');
  }
  
  return {
    label: `${level} (${confidence}%)`,
    explanation: `This confidence reflects ${explanationParts.join(' and ')}.`,
  };
}

/**
 * Rewrite evidence interpretation to be more analytical and less robotic
 */
function rewriteEvidenceInterpretation(
  source: string,
  leader: string,
  magnitude: number,
  termA: string,
  termB: string,
  original: string
): string {
  // If original is already good, use it
  if (original && !original.toLowerCase().includes('leads by') && !original.toLowerCase().includes('points')) {
    return original;
  }
  
  // Rewrite based on source and magnitude
  const isStrong = magnitude >= 20;
  const isModerate = magnitude >= 10;
  
  if (source.toLowerCase().includes('google trends') || source.toLowerCase().includes('search')) {
    if (isStrong) {
      return `Search interest strongly favors ${leader}, indicating significantly higher global attention during the selected period.`;
    } else if (isModerate) {
      return `Search interest favors ${leader}, showing higher relative attention in search queries.`;
    } else {
      return `Search interest shows a slight preference for ${leader}.`;
    }
  } else if (source.toLowerCase().includes('youtube') || source.toLowerCase().includes('social')) {
    if (isStrong) {
      return `Social engagement significantly favors ${leader}, reflecting stronger audience interest and interaction.`;
    } else if (isModerate) {
      return `Social engagement favors ${leader}, indicating higher audience engagement levels.`;
    } else {
      return `Social engagement shows a slight preference for ${leader}.`;
    }
  } else if (source.toLowerCase().includes('authority') || source.toLowerCase().includes('wikipedia')) {
    if (isStrong) {
      return `Authority metrics strongly favor ${leader}, suggesting greater established presence and recognition.`;
    } else if (isModerate) {
      return `Authority metrics favor ${leader}, indicating stronger established presence.`;
    } else {
      return `Authority metrics show a slight preference for ${leader}.`;
    }
  }
  
  // Fallback to a generic but analytical interpretation
  if (isStrong) {
    return `This metric strongly favors ${leader}, indicating a significant difference in market position.`;
  } else if (isModerate) {
    return `This metric favors ${leader}, showing a meaningful difference.`;
  } else {
    return `This metric shows a slight preference for ${leader}.`;
  }
}

/**
 * Generate geographic insight paragraph
 */
function generateGeographicInsight(
  countries: Array<{ name: string; termAValue: number; termBValue: number }>,
  termA: string,
  termB: string
): string {
  if (!countries || countries.length === 0) {
    return '';
  }
  
  const termAStrong = countries.filter(c => c.termAValue > c.termBValue && c.termAValue >= 50).length;
  const termBStrong = countries.filter(c => c.termBValue > c.termAValue && c.termBValue >= 50).length;
  
  if (termAStrong > termBStrong && termAStrong >= 3) {
    return `${termA} shows stronger relative interest in several key markets, while ${termB} maintains broader global presence.`;
  } else if (termBStrong > termAStrong && termBStrong >= 3) {
    return `${termB} shows stronger relative interest in several key markets, while ${termA} maintains broader global presence.`;
  } else {
    return `Regional interest patterns vary significantly, with both terms showing strength in different geographic markets.`;
  }
}

/**
 * Format geographic value (handle zeros)
 */
function formatGeographicValue(value: number): string {
  if (value < 5) {
    return '<5';
  }
  return value.toFixed(1);
}

/**
 * Generate HTML content for PDF
 * Clean, professional, executive-ready format
 */
function generatePDFHTML(
  data: ComparisonPDFData,
  scoreChartImageBase64?: string,
  forecastChartImageBase64?: string
): string {
  // Format all terms properly - NEVER use slugs
  const termAFormatted = formatTermForPDF(data.termA);
  const termBFormatted = formatTermForPDF(data.termB);
  const winnerFormatted = formatTermForPDF(data.verdict.winner);
  const loserFormatted = formatTermForPDF(data.verdict.loser);
  
  const date = new Date(data.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Filter evidence to only meaningful values
  const validEvidence = data.evidence ? filterValidEvidence(data.evidence) : [];
  const topEvidence = validEvidence.slice(0, 5);

  // Check if forecast should be shown
  const forecastGuardrail = data.predictions && data.metrics ? shouldShowForecast({
    seriesLength: data.predictions.historicalDataPoints || 0,
    volatility: data.metrics.volatility,
    disagreementFlag: data.metrics.agreementIndex < 60,
    agreementIndex: data.metrics.agreementIndex,
  }) : { shouldShow: false, reason: 'No forecast data available' };

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

  // Generate "Why this matters" (safe, non-speculative, analytical)
  const whyThisMatters = data.aiInsights?.whyThisMatters || 
    `This comparison reveals the relative market position between ${termAFormatted} and ${termBFormatted}. The ${data.metrics?.stability || 'current'} trend pattern indicates ${data.verdict.confidence >= 70 ? 'strong' : data.verdict.confidence >= 60 ? 'moderate' : 'variable'} confidence in the observed differences, reflecting the consistency of signals across multiple data sources.`;

  // Build score breakdown rows (exclude neutral metrics)
  const scoreRows: string[] = [];
  scoreRows.push(`
    <tr class="winner-row">
      <td><strong>Overall Score</strong></td>
      <td><strong>${data.scores.termA.overall.toFixed(1)}</strong></td>
      <td>${data.scores.termB.overall.toFixed(1)}</td>
      <td><strong>${(data.scores.termA.overall - data.scores.termB.overall).toFixed(1)}</strong></td>
    </tr>
    <tr>
      <td>Search Interest</td>
      <td>${data.scores.termA.breakdown.searchInterest.toFixed(1)}</td>
      <td>${data.scores.termB.breakdown.searchInterest.toFixed(1)}</td>
      <td>${(data.scores.termA.breakdown.searchInterest - data.scores.termB.breakdown.searchInterest).toFixed(1)}</td>
    </tr>
  `);

  // Only add social buzz if meaningful
  if (isMeaningfulMetric(data.scores.termA.breakdown.socialBuzz, data.scores.termB.breakdown.socialBuzz)) {
    scoreRows.push(`
    <tr>
      <td>Social Buzz</td>
      <td>${data.scores.termA.breakdown.socialBuzz.toFixed(1)}</td>
      <td>${data.scores.termB.breakdown.socialBuzz.toFixed(1)}</td>
      <td>${(data.scores.termA.breakdown.socialBuzz - data.scores.termB.breakdown.socialBuzz).toFixed(1)}</td>
    </tr>
    `);
  }

  // Only add authority if meaningful
  if (isMeaningfulMetric(data.scores.termA.breakdown.authority, data.scores.termB.breakdown.authority)) {
    scoreRows.push(`
    <tr>
      <td>Authority</td>
      <td>${data.scores.termA.breakdown.authority.toFixed(1)}</td>
      <td>${data.scores.termB.breakdown.authority.toFixed(1)}</td>
      <td>${(data.scores.termA.breakdown.authority - data.scores.termB.breakdown.authority).toFixed(1)}</td>
    </tr>
    `);
  }

  scoreRows.push(`
    <tr>
      <td>Momentum</td>
      <td>${data.scores.termA.breakdown.momentum.toFixed(1)}</td>
      <td>${data.scores.termB.breakdown.momentum.toFixed(1)}</td>
      <td>${(data.scores.termA.breakdown.momentum - data.scores.termB.breakdown.momentum).toFixed(1)}</td>
    </tr>
  `);

  const hasExcludedMetrics = !isMeaningfulMetric(data.scores.termA.breakdown.socialBuzz, data.scores.termB.breakdown.socialBuzz) ||
    !isMeaningfulMetric(data.scores.termA.breakdown.authority, data.scores.termB.breakdown.authority);

  // Geographic data (top 8-10, formatted)
  const topGeographicCountries = data.geographicData?.countries?.slice(0, 10) || [];
  const geographicRows = topGeographicCountries.map(country => {
    const leader = country.termAValue >= country.termBValue ? termAFormatted : termBFormatted;
    return `
      <tr>
        <td><strong>${country.name}</strong></td>
        <td>${formatGeographicValue(country.termAValue)}</td>
        <td>${formatGeographicValue(country.termBValue)}</td>
        <td>${leader}</td>
      </tr>
    `;
  }).join('') || '';
  
  const geographicInsight = generateGeographicInsight(topGeographicCountries, termAFormatted, termBFormatted);
  
  // Format confidence with context
  const confidenceInfo = formatConfidence(
    data.verdict.confidence,
    data.metrics?.agreementIndex,
    data.metrics?.volatility
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${termAFormatted} vs ${termBFormatted} - Trend Comparison Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .page {
      padding: 20mm 25mm;
      page-break-after: auto;
      position: relative;
      background: #ffffff;
      min-height: 297mm;
    }
    
    .page:not(:last-child) {
      page-break-after: always;
    }
    
    /* Cover Page */
    .cover-page {
      height: 297mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30mm 25mm;
      background: #ffffff;
      border-bottom: 4px solid #2563eb;
      page-break-after: always;
    }
    
    .cover-logo {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #2563eb;
      margin-bottom: 40px;
    }
    
    .cover-title {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .cover-title h1 {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 16px;
      color: #1a1a1a;
    }
    
    .cover-subtitle {
      font-size: 20px;
      font-weight: 400;
      color: #6b7280;
      margin-bottom: 40px;
    }
    
    .cover-meta {
      font-size: 13px;
      color: #4b5563;
      line-height: 2;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    
    .cover-meta-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    
    .cover-meta-label {
      font-weight: 600;
      color: #374151;
    }
    
    /* Page Headers */
    .page-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .page-header h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }
    
    .page-header-right {
      font-size: 11px;
      color: #9ca3af;
      font-weight: 400;
    }
    
    /* Executive Summary */
    .verdict-sentence {
      font-size: 17px;
      font-weight: 500;
      line-height: 1.7;
      margin-bottom: 28px;
      padding: 24px;
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      color: #1a1a1a;
      border-radius: 6px;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .kpi-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .kpi-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .kpi-value-small {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .bullet-list {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }
    
    .bullet-list li {
      padding: 6px 0;
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
      font-size: 16px;
    }
    
    .why-matters {
      background: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      margin-top: 16px;
      font-size: 13px;
      line-height: 1.6;
      color: #374151;
      border-left: 3px solid #2563eb;
    }
    
    /* Trust Snapshot */
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .trust-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    
    .trust-card-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .trust-card-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .trust-card-value-small {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .methodology {
      background: #fef3c7;
      padding: 16px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.6;
      color: #78350f;
      margin-top: 20px;
      border-left: 3px solid #f59e0b;
    }
    
    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    
    .data-table thead {
      background: #f8fafc;
    }
    
    .data-table th {
      padding: 14px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .data-table td {
      padding: 14px 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
      color: #374151;
      line-height: 1.5;
    }
    
    .data-table tbody tr:nth-child(even) {
      background: #fafbfc;
    }
    
    .data-table tbody tr.winner-row {
      background: #eff6ff;
      font-weight: 600;
    }
    
    .data-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    /* Charts */
    .chart-container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .chart-container img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    .chart-caption {
      margin-top: 12px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .chart-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      margin: 20px 0;
    }
    
    .chart-error-text {
      color: #991b1b;
      font-size: 13px;
      font-weight: 500;
    }
    
    /* Forecast */
    .forecast-note {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      margin-top: 16px;
    }
    
    .forecast-note-title {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .forecast-note-text {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }
    
    /* Page Footer */
    .page-footer {
      position: absolute;
      bottom: 20mm;
      left: 25mm;
      right: 25mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }
    
    .page-footer-left {
      font-weight: 500;
      color: #6b7280;
    }
    
    .page-footer-right {
      color: #9ca3af;
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
        <span>${formatTimeframe(data.timeframe)}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Region:</span>
        <span>${formatRegion(data.geo)}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Category:</span>
        <span>${formatCategory(data.verdict.category)}</span>
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
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 2 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Executive Summary</h2>
    </div>
    
    <div class="verdict-sentence">
      ${data.verdict.headline || `${winnerFormatted} demonstrates a ${data.verdict.margin.toFixed(1)}-point advantage over ${loserFormatted}, with ${confidenceInfo.label.toLowerCase()} overall confidence.`}
    </div>
    
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Winner</div>
        <div class="kpi-value-small">${winnerFormatted}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Margin</div>
        <div class="kpi-value">${data.verdict.margin.toFixed(1)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Overall Confidence</div>
        <div class="kpi-value-small" style="font-size: 18px;">${confidenceInfo.label}</div>
      </div>
    </div>
    
    <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #4b5563; line-height: 1.6; border-left: 3px solid #2563eb;">
      ${confidenceInfo.explanation}
    </div>
    
    ${whatChangedBullets.length > 0 ? `
    <div class="section">
      <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px;">What Changed Recently</div>
      <ul class="bullet-list">
        ${whatChangedBullets.map(bullet => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div style="margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb;">
      <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px;">Why This Matters</div>
      <div style="font-size: 13px; line-height: 1.7; color: #374151;">${whyThisMatters}</div>
    </div>
  </div>

  <!-- PAGE 3: TRUST SNAPSHOT -->
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 3 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Trust Snapshot</h2>
    </div>
    
    <div class="trust-grid">
      <div class="trust-card">
        <div class="trust-card-label">Overall Confidence</div>
        <div class="trust-card-value-small" style="font-size: 24px;">${confidenceInfo.label}</div>
      </div>
      <div class="trust-card">
        <div class="trust-card-label">Source Agreement</div>
        <div class="trust-card-value">${data.metrics?.agreementIndex ? data.metrics.agreementIndex.toFixed(0) + '%' : 'N/A'}</div>
      </div>
      <div class="trust-card">
        <div class="trust-card-label">Data Freshness</div>
        <div class="trust-card-value-small">${data.dataFreshness ? new Date(data.dataFreshness.lastUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <div class="trust-card">
        <div class="trust-card-label">Forecast Available</div>
        <div class="trust-card-value-small">${forecastGuardrail.shouldShow ? 'Yes' : 'No'}</div>
      </div>
    </div>
    
    <div class="methodology">
      <strong>Scoring Methodology:</strong> TrendArc combines multiple data sources including search interest, social engagement, authority metrics, and momentum indicators. Each metric is normalized to a 0-100 scale and weighted by reliability. The final score represents a composite view of relative market position.
    </div>
  </div>

  <!-- PAGE 4: KEY EVIDENCE -->
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 4 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Key Evidence</h2>
    </div>
    
    ${topEvidence.length > 0 ? `
    <table class="data-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Leader</th>
          <th>Difference</th>
          <th>Interpretation</th>
        </tr>
      </thead>
      <tbody>
        ${topEvidence.map(ev => {
          const leader = ev.direction === 'termA' ? termAFormatted : ev.direction === 'termB' ? termBFormatted : 'Tie';
          const rewrittenInterpretation = rewriteEvidenceInterpretation(
            ev.source,
            leader,
            ev.magnitude,
            termAFormatted,
            termBFormatted,
            ev.interpretation
          );
          return `
        <tr>
          <td><strong>${ev.source}</strong></td>
          <td>${leader}</td>
          <td>${ev.magnitude.toFixed(1)} points</td>
          <td>${rewrittenInterpretation}</td>
        </tr>
        `;
        }).join('')}
      </tbody>
    </table>
    ` : `
    <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">Limited evidence available for this comparison.</p>
    `}
  </div>

  <!-- PAGE 5: SCORE BREAKDOWN -->
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 5 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Score Breakdown</h2>
    </div>
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>${termAFormatted}</th>
          <th>${termBFormatted}</th>
          <th>Difference</th>
        </tr>
      </thead>
      <tbody>
        ${scoreRows.join('')}
      </tbody>
    </table>
    ${hasExcludedMetrics ? `
    <p style="margin-top: 16px; font-size: 12px; color: #6b7280; font-style: italic;">Some metrics were excluded due to neutral signals or insufficient data during this period.</p>
    ` : ''}
  </div>

  <!-- PAGE 6: TREND OVER TIME -->
  ${scoreChartImageBase64 && scoreChartImageBase64.length > 100 ? `
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 6 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Trend Over Time</h2>
    </div>
    
    <div class="chart-container">
      <img src="data:image/png;base64,${scoreChartImageBase64}" alt="Trend Over Time Chart" style="max-width: 100%; height: auto; display: block; border: 1px solid #e5e7eb;" />
    </div>
    <div class="chart-caption">
      ${data.metrics?.stability === 'stable' 
        ? `The trend demonstrates stability with consistent patterns over the selected timeframe.` 
        : data.metrics?.stability === 'hype' 
        ? `The trend shows significant volatility, suggesting event-driven spikes.` 
        : `The trend shows moderate variation over time.`}
    </div>
  </div>
  ` : data.series && data.series.length > 0 ? `
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 6 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Trend Over Time</h2>
    </div>
    <div style="padding: 40px; text-align: center; color: #6b7280;">
      <p>Chart generation is temporarily unavailable. Please try again later.</p>
    </div>
    <div class="chart-caption">
      ${data.metrics?.stability === 'stable' 
        ? `The trend demonstrates stability with consistent patterns over the selected timeframe.` 
        : data.metrics?.stability === 'hype' 
        ? `The trend shows significant volatility, suggesting event-driven spikes.` 
        : `The trend shows moderate variation over time.`}
    </div>
  </div>
  ` : data.series && data.series.length > 0 ? `
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 6 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Trend Over Time</h2>
    </div>
    <div style="padding: 40px; text-align: center; color: #6b7280;">
      <p>Chart generation is temporarily unavailable. Please try again later.</p>
    </div>
    <div class="chart-caption">
      ${data.metrics?.stability === 'stable' 
        ? `The trend demonstrates stability with consistent patterns over the selected timeframe.` 
        : data.metrics?.stability === 'hype' 
        ? `The trend shows significant volatility, suggesting event-driven spikes.` 
        : `The trend shows moderate variation over time.`}
    </div>
  </div>
  ` : ''}
  
  ${data.predictions && data.metrics && shouldShowForecast({
    seriesLength: data.predictions.historicalDataPoints || 0,
    volatility: data.metrics.volatility,
    disagreementFlag: data.metrics.agreementIndex < 60,
    agreementIndex: data.metrics.agreementIndex,
  }).shouldShow && forecastChartImageBase64 && forecastChartImageBase64.length > 100 ? `
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 7 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Forecast</h2>
    </div>
    <div class="chart-container">
      <img src="data:image/png;base64,${forecastChartImageBase64}" alt="Forecast Chart" style="max-width: 100%; height: auto; display: block; border: 1px solid #e5e7eb;" />
    </div>
    <div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-radius: 6px; font-size: 12px; color: #166534; line-height: 1.6; border-left: 3px solid #22c55e;">
      <strong>Forecast Summary:</strong> Based on ${data.predictions.historicalDataPoints || 0} historical data points. ${data.predictions.predictionsA ? `${termAFormatted}: ${data.predictions.predictionsA.trend === 'rising' ? 'Rising' : data.predictions.predictionsA.trend === 'falling' ? 'Falling' : 'Stable'} trend (${data.predictions.predictionsA.confidence.toFixed(0)}% confidence). ` : ''}${data.predictions.predictionsB ? `${termBFormatted}: ${data.predictions.predictionsB.trend === 'rising' ? 'Rising' : data.predictions.predictionsB.trend === 'falling' ? 'Falling' : 'Stable'} trend (${data.predictions.predictionsB.confidence.toFixed(0)}% confidence). ` : ''}Forecasts are directional indicators, not exact volume predictions.
    </div>
  </div>
  ` : data.predictions && data.metrics && shouldShowForecast({
    seriesLength: data.predictions.historicalDataPoints || 0,
    volatility: data.metrics.volatility,
    disagreementFlag: data.metrics.agreementIndex < 60,
    agreementIndex: data.metrics.agreementIndex,
  }).shouldShow && !forecastChartImageBase64 ? `
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 7 • ${date}</div>
    </div>
    <div class="forecast-note">
      <div class="forecast-note-title">Forecast Not Shown</div>
      <div class="forecast-note-text">
        ${shouldShowForecast({
          seriesLength: data.predictions.historicalDataPoints || 0,
          volatility: data.metrics.volatility,
          disagreementFlag: data.metrics.agreementIndex < 60,
          agreementIndex: data.metrics.agreementIndex,
        }).reason || 'Forecasts are shown only when reliability is sufficient. High volatility or low source agreement reduces forecast reliability.'}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- PAGE 7: GEOGRAPHIC INSIGHTS -->
  ${data.geographicData && data.geographicData.countries && data.geographicData.countries.length > 0 ? `
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 7 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Geographic Insights</h2>
    </div>
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Country</th>
          <th>${termAFormatted}</th>
          <th>${termBFormatted}</th>
          <th>Leader</th>
        </tr>
      </thead>
      <tbody>
        ${geographicRows}
      </tbody>
    </table>
    ${geographicInsight ? `
    <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 6px; font-size: 13px; line-height: 1.6; color: #374151; border-left: 3px solid #2563eb;">
      ${geographicInsight}
    </div>
    ` : `
    <p style="margin-top: 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">Regional data reflects relative interest from Google Trends. Higher values indicate stronger relative interest in that region.</p>
    `}
  </div>
  ` : ''}

  <!-- PAGE 8: APPENDIX -->
  <div class="page">
    <div class="page-footer">
      <div class="page-footer-left">TrendArc</div>
      <div class="page-footer-right">Page 8 • ${date}</div>
    </div>
    <div class="page-header">
      <h2>Appendix</h2>
    </div>
    
    <table class="data-table">
      <tbody>
        <tr>
          <td style="width: 30%; font-weight: 600; color: #374151;">Sources</td>
          <td>${data.verdict.sources.join(', ')}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Model Version</td>
          <td>${data.modelVersion || 'TrendArc v1.0'}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Export Version</td>
          <td>${data.exportVersion || '2.0'}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Computed At</td>
          <td>${new Date(data.generatedAt).toISOString()}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Data Freshness</td>
          <td>${data.dataFreshness ? new Date(data.dataFreshness.lastUpdatedAt).toISOString() : new Date(data.generatedAt).toISOString()}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Region</td>
          <td>${formatRegion(data.geo)}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Timeframe</td>
          <td>${formatTimeframe(data.timeframe)}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Terms</td>
          <td>${termAFormatted} vs ${termBFormatted}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #374151;">Live Report</td>
          <td><a href="${data.reportUrl}" style="color: #2563eb; text-decoration: none;">${data.reportUrl}</a></td>
        </tr>
      </tbody>
    </table>
    
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.6;">
      <p>This report was generated on ${date}</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} TrendArc. All rights reserved.</p>
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
        // Generate score chart image - try cache first, then generate directly if needed
        const chartCacheKey = createScoreChartCacheKey(
          data.slug,
          data.timeframe,
          data.geo
        );
        
        console.log('[PDF Generator] Generating score chart image...', {
          slug: data.slug,
          seriesLength: data.series.length,
          termA: data.termA,
          termB: data.termB,
        });
        
        let scoreChartImage: Buffer | null = null;
        
        // Try to get from cache or generate
        try {
          scoreChartImage = await getOrGenerateChartImage(
            () => generateScoreChartImage(
              data.series!,
              data.termA,
              data.termB,
              data.category || 'general',
              { width: 800, height: 400, deviceScaleFactor: 2 }
            ),
            chartCacheKey
          );
        } catch (cacheError) {
          console.warn('[PDF Generator] Cache/generation failed, trying direct generation:', cacheError);
          // Fallback: generate directly without cache
          scoreChartImage = await generateScoreChartImage(
            data.series!,
            data.termA,
            data.termB,
            data.category || 'general',
            { width: 800, height: 400, deviceScaleFactor: 2 }
          );
        }
        
        if (scoreChartImage && scoreChartImage.length > 0) {
          scoreChartImageBase64 = scoreChartImage.toString('base64');
          // Validate base64 string
          if (scoreChartImageBase64 && scoreChartImageBase64.length > 100) {
            console.log('[PDF Generator] ✅ Score chart generated successfully', {
              imageSize: scoreChartImage.length,
              base64Length: scoreChartImageBase64.length,
              base64Preview: scoreChartImageBase64.substring(0, 50) + '...',
            });
          } else {
            console.error('[PDF Generator] ❌ Score chart base64 string is invalid or too short', {
              base64Length: scoreChartImageBase64?.length || 0,
            });
            scoreChartImageBase64 = undefined;
          }
        } else {
          console.error('[PDF Generator] ❌ Score chart generation returned null or empty buffer');
          scoreChartImageBase64 = undefined;
        }
      } catch (error: any) {
        console.error('[PDF Generator] ❌ Error generating score chart image:', {
          error: error?.message,
          stack: error?.stack,
          slug: data.slug,
        });
        // Don't fail the PDF generation if chart fails, but log the error
        // Set to undefined so HTML won't try to render it
        scoreChartImageBase64 = undefined;
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
          // Generate forecast chart image - try cache first, then generate directly if needed
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
          
          console.log('[PDF Generator] Generating forecast chart image...', {
            slug: data.slug,
            forecastPoints: forecastPoints.length,
          });
          
          let forecastChartImage: Buffer | null = null;
          
          // Try to get from cache or generate
          try {
            forecastChartImage = await getOrGenerateChartImage(
              () => generateForecastChartImage(
                data.series!,
                forecastPoints,
                data.termA,
                { width: 800, height: 400, deviceScaleFactor: 2 }
              ),
              forecastCacheKey
            );
          } catch (cacheError) {
            console.warn('[PDF Generator] Forecast cache/generation failed, trying direct generation:', cacheError);
            // Fallback: generate directly without cache
            forecastChartImage = await generateForecastChartImage(
              data.series!,
              forecastPoints,
              data.termA,
              { width: 800, height: 400, deviceScaleFactor: 2 }
            );
          }
          
          if (forecastChartImage && forecastChartImage.length > 0) {
            forecastChartImageBase64 = forecastChartImage.toString('base64');
            // Validate base64 string
            if (forecastChartImageBase64 && forecastChartImageBase64.length > 100) {
              console.log('[PDF Generator] ✅ Forecast chart generated successfully', {
                imageSize: forecastChartImage.length,
                base64Length: forecastChartImageBase64.length,
                base64Preview: forecastChartImageBase64.substring(0, 50) + '...',
              });
            } else {
              console.error('[PDF Generator] ❌ Forecast chart base64 string is invalid or too short', {
                base64Length: forecastChartImageBase64?.length || 0,
              });
              forecastChartImageBase64 = undefined;
            }
          } else {
            console.warn('[PDF Generator] ⚠️ Forecast chart generation returned null or empty buffer');
            forecastChartImageBase64 = undefined;
          }
        } catch (error: any) {
          console.error('[PDF Generator] ❌ Error generating forecast chart image:', {
            error: error?.message,
            stack: error?.stack,
            slug: data.slug,
          });
          // Set to undefined so HTML won't try to render it
          forecastChartImageBase64 = undefined;
        }
      }
    }
    
    // Launch browser with serverless-compatible configuration
    // Use @sparticuz/chromium for Vercel/serverless environments
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    };

    // In serverless environments, use the Chromium binary from @sparticuz/chromium
    if (isServerless) {
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.args.push(...chromium.args);
      browser = await puppeteerCore.launch(launchOptions);
    } else {
      // For local development, use regular puppeteer if available
      try {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch(launchOptions);
      } catch {
        // Fallback: try to find Chrome in common locations
        const possiblePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ];
        for (const path of possiblePaths) {
          try {
            const fs = require('fs');
            if (fs.existsSync(path)) {
              launchOptions.executablePath = path;
              break;
            }
          } catch {}
        }
        browser = await puppeteerCore.launch(launchOptions);
      }
    }

    const page = await browser.newPage();
    
    // Generate HTML with embedded chart images
    // Log chart status before generating HTML
    console.log('[PDF Generator] Chart status before HTML generation:', {
      hasScoreChart: !!scoreChartImageBase64 && scoreChartImageBase64.length > 100,
      hasForecastChart: !!forecastChartImageBase64 && forecastChartImageBase64.length > 100,
      scoreChartLength: scoreChartImageBase64?.length || 0,
      forecastChartLength: forecastChartImageBase64?.length || 0,
    });
    
    // Generate HTML with embedded chart images
    const html = generatePDFHTML(data, scoreChartImageBase64, forecastChartImageBase64);
    
    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });
    
    // Wait a bit for images to load in the PDF
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF with minimal margins to maximize content area
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      preferCSSPageSize: false,
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
