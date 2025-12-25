/**
 * PDF Generation Utility for Comparison Reports
 * Uses Puppeteer to generate professional PDF reports
 */

import puppeteer from 'puppeteer';

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
};

/**
 * Generate HTML content for PDF
 */
function generatePDFHTML(data: ComparisonPDFData): string {
  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const termAFormatted = formatTerm(data.termA);
  const termBFormatted = formatTerm(data.termB);
  const date = new Date(data.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate additional metrics
  const scoreDifference = data.verdict.winnerScore - data.verdict.loserScore;
  const dominancePercent = (data.verdict.winnerScore / (data.verdict.winnerScore + data.verdict.loserScore)) * 100;
  
  // Create progress bar HTML
  const createProgressBar = (value: number, label: string, color: string) => {
    const width = Math.min(100, Math.max(0, value));
    return `
      <div class="progress-bar-container">
        <div class="progress-bar-label">
          <span>${label}</span>
          <span class="progress-bar-value">${value.toFixed(1)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${width}%; background: ${color};"></div>
        </div>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${termAFormatted} vs ${termBFormatted} - Trend Comparison Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1a1a1a;
      line-height: 1.65;
      background: #ffffff;
      font-size: 14px;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }
    
    /* Cover Page */
    .cover-page {
      min-height: 297mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 35px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      page-break-after: always;
    }
    
    .cover-logo {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-bottom: 20px;
    }
    
    .cover-title {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .cover-title h1 {
      font-size: 48px;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 25px;
      letter-spacing: -1px;
    }
    
    .cover-subtitle {
      font-size: 20px;
      font-weight: 500;
      opacity: 0.95;
      margin-bottom: 40px;
    }
    
    .cover-meta {
      font-size: 16px;
      opacity: 0.9;
      line-height: 2;
    }
    
    .cover-meta-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .cover-meta-label {
      font-weight: 600;
    }
    
    /* Content Pages */
    .page {
      padding: 35px 45px;
      page-break-after: always;
      min-height: 297mm;
    }
    
    .page-header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 12px;
      margin-bottom: 28px;
    }
    
    .page-header h2 {
      font-size: 24px;
      font-weight: 800;
      color: #1a1a1a;
      letter-spacing: -0.5px;
    }
    
    .section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 19px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
      letter-spacing: -0.3px;
    }
    
    /* Executive Summary */
    .executive-summary {
      background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
      border-left: 5px solid #667eea;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 28px;
    }
    
    .executive-summary h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    
    .summary-points {
      list-style: none;
      padding: 0;
    }
    
    .summary-points li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .summary-points li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 18px;
    }
    
    /* Verdict Card */
    .verdict-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }
    
    .verdict-card h3 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 16px;
      opacity: 0.95;
    }
    
    .winner-announcement {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .winner-announcement .trophy {
      font-size: 36px;
    }
    
    .verdict-headline {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 24px;
      opacity: 0.95;
    }
    
    .verdict-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 24px;
    }
    
    .verdict-stat {
      text-align: center;
    }
    
    .verdict-stat-label {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .verdict-stat-value {
      font-size: 32px;
      font-weight: 900;
      line-height: 1;
    }
    
    /* Score Comparison */
    .scores-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .score-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      position: relative;
    }
    
    .score-card.winner {
      border-color: #667eea;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    }
    
    .score-card.winner::before {
      content: "🏆 Winner";
      position: absolute;
      top: -12px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    
    .score-card-title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
    
    .overall-score {
      font-size: 60px;
      font-weight: 900;
      color: #667eea;
      margin-bottom: 20px;
      line-height: 1;
    }
    
    .score-card.winner .overall-score {
      color: #667eea;
    }
    
    .breakdown-grid {
      display: grid;
      gap: 16px;
    }
    
    /* Progress Bars */
    .progress-bar-container {
      margin-bottom: 16px;
    }
    
    .progress-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #4b5563;
    }
    
    .progress-bar-value {
      color: #1a1a1a;
      font-weight: 700;
    }
    
    .progress-bar-bg {
      height: 12px;
      background: #f3f4f6;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .progress-bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s ease;
    }
    
    /* Insights Section */
    .insights-container {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .insights-list {
      list-style: none;
      padding: 0;
    }
    
    .insights-list li {
      padding: 12px 0;
      padding-left: 30px;
      position: relative;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      line-height: 1.7;
    }
    
    .insights-list li:last-child {
      border-bottom: none;
    }
    
    .insights-list li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 20px;
    }
    
    .insights-box {
      background: #ffffff;
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .insights-box h4 {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    
    .insights-box p {
      font-size: 13px;
      line-height: 1.7;
      color: #4b5563;
    }
    
    .peak-explanation {
      background: #fff7ed;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .peak-explanation h5 {
      font-size: 14px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 6px;
    }
    
    .peak-explanation p {
      font-size: 13px;
      line-height: 1.6;
      color: #78350f;
    }
    
    /* Geographic Table */
    .geographic-section {
      margin-bottom: 32px;
    }
    
    .geographic-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .geographic-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .geographic-table th {
      padding: 12px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .geographic-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    .geographic-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .geographic-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    /* Comparison Table */
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .comparison-table thead {
      background: #f9fafb;
    }
    
    .comparison-table th {
      padding: 12px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      color: #1a1a1a;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .comparison-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
    }
    
    .comparison-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    /* Predictions Section */
    .predictions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .prediction-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
    }
    
    .prediction-card h4 {
      font-size: 17px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
    
    .prediction-trend {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    
    .prediction-trend.rising {
      background: #dcfce7;
      color: #166534;
    }
    
    .prediction-trend.falling {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .prediction-trend.stable {
      background: #f3f4f6;
      color: #374151;
    }
    
    .prediction-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .prediction-stat {
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
    }
    
    .prediction-stat-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .prediction-stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .prediction-explanation {
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 13px;
      line-height: 1.6;
      color: #0c4a6e;
    }
    
    /* Footer */
    .footer {
      margin-top: 50px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      page-break-inside: avoid;
    }
    
    .footer-logo {
      font-size: 20px;
      font-weight: 900;
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .footer p {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    
    /* Page Break Helpers */
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      .section {
        page-break-inside: avoid;
      }
      .verdict-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div class="cover-logo">TRENDARC</div>
    </div>
    <div class="cover-title">
      <h1>${termAFormatted}<br>vs<br>${termBFormatted}</h1>
      <div class="cover-subtitle">Trend Comparison Analysis Report</div>
    </div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Generated:</span>
        <span>${date}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Timeframe:</span>
        <span>${data.timeframe.toUpperCase()}</span>
      </div>
      ${data.geo ? `
      <div class="cover-meta-item">
        <span class="cover-meta-label">Region:</span>
        <span>${data.geo}</span>
      </div>
      ` : ''}
      <div class="cover-meta-item">
        <span class="cover-meta-label">Category:</span>
        <span>${data.verdict.category.charAt(0).toUpperCase() + data.verdict.category.slice(1)}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Data Sources:</span>
        <span>${data.verdict.sources.join(', ')}</span>
      </div>
    </div>
  </div>

  <!-- Page 1: Executive Summary -->
  <div class="page">
    <div class="page-header">
      <h2>Executive Summary</h2>
    </div>
    
    <div class="executive-summary">
      <h3>Key Findings</h3>
      <ul class="summary-points">
        <li><strong>${formatTerm(data.verdict.winner)}</strong> leads with a TrendArc Score of <strong>${data.verdict.winnerScore.toFixed(1)}/100</strong>, compared to ${formatTerm(data.verdict.loser)}'s score of ${data.verdict.loserScore.toFixed(1)}/100</li>
        <li>The margin of ${data.verdict.margin.toFixed(1)}% indicates ${data.verdict.margin >= 20 ? 'a significant' : data.verdict.margin >= 10 ? 'a notable' : 'a slight'} advantage for the leader</li>
        <li>Analysis confidence of ${data.verdict.confidence}% ${data.verdict.confidence >= 80 ? 'provides high reliability' : data.verdict.confidence >= 60 ? 'suggests moderate reliability' : 'indicates preliminary findings'}</li>
        <li>This report analyzes data from ${data.verdict.sources.length} source${data.verdict.sources.length > 1 ? 's' : ''}: ${data.verdict.sources.join(', ')}</li>
      </ul>
    </div>

    <div class="section">
      <div class="verdict-card">
        <h3>TrendArc Verdict</h3>
        <div class="winner-announcement">
          <span class="trophy">🏆</span>
          <span>${formatTerm(data.verdict.winner)} Wins</span>
        </div>
        <div class="verdict-headline">${data.verdict.headline}</div>
        <div class="verdict-stats">
          <div class="verdict-stat">
            <div class="verdict-stat-label">Winner Score</div>
            <div class="verdict-stat-value">${data.verdict.winnerScore.toFixed(1)}</div>
          </div>
          <div class="verdict-stat">
            <div class="verdict-stat-label">Loser Score</div>
            <div class="verdict-stat-value">${data.verdict.loserScore.toFixed(1)}</div>
          </div>
          <div class="verdict-stat">
            <div class="verdict-stat-label">Margin</div>
            <div class="verdict-stat-value">${data.verdict.margin.toFixed(1)}%</div>
          </div>
          <div class="verdict-stat">
            <div class="verdict-stat-label">Confidence</div>
            <div class="verdict-stat-value">${data.verdict.confidence}%</div>
          </div>
        </div>
      </div>
      <div class="insights-box">
        <h4>Recommendation</h4>
        <p>${data.verdict.recommendation}</p>
      </div>
    </div>
  </div>

  <!-- Page 2: Detailed Scores -->
  <div class="page">
    <div class="page-header">
      <h2>Detailed Score Analysis</h2>
    </div>

    <div class="section">
      <div class="section-title">TrendArc Score Breakdown</div>
      <div class="scores-comparison">
        <div class="score-card ${data.verdict.winner === data.termA ? 'winner' : ''}">
          <div class="score-card-title">${termAFormatted}</div>
          <div class="overall-score">${data.scores.termA.overall.toFixed(1)}</div>
          <div class="breakdown-grid">
            ${createProgressBar(data.scores.termA.breakdown.searchInterest, 'Search Interest', '#667eea')}
            ${createProgressBar(data.scores.termA.breakdown.socialBuzz, 'Social Buzz', '#10b981')}
            ${createProgressBar(data.scores.termA.breakdown.authority, 'Authority', '#f59e0b')}
            ${createProgressBar(data.scores.termA.breakdown.momentum, 'Momentum', '#ef4444')}
          </div>
        </div>
        <div class="score-card ${data.verdict.winner === data.termB ? 'winner' : ''}">
          <div class="score-card-title">${termBFormatted}</div>
          <div class="overall-score">${data.scores.termB.overall.toFixed(1)}</div>
          <div class="breakdown-grid">
            ${createProgressBar(data.scores.termB.breakdown.searchInterest, 'Search Interest', '#667eea')}
            ${createProgressBar(data.scores.termB.breakdown.socialBuzz, 'Social Buzz', '#10b981')}
            ${createProgressBar(data.scores.termB.breakdown.authority, 'Authority', '#f59e0b')}
            ${createProgressBar(data.scores.termB.breakdown.momentum, 'Momentum', '#ef4444')}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Score Comparison Table</div>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>${termAFormatted}</th>
            <th>${termBFormatted}</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Overall Score</strong></td>
            <td>${data.scores.termA.overall.toFixed(1)}</td>
            <td>${data.scores.termB.overall.toFixed(1)}</td>
            <td><strong>${scoreDifference.toFixed(1)}</strong></td>
          </tr>
          <tr>
            <td>Search Interest</td>
            <td>${data.scores.termA.breakdown.searchInterest.toFixed(1)}</td>
            <td>${data.scores.termB.breakdown.searchInterest.toFixed(1)}</td>
            <td>${(data.scores.termA.breakdown.searchInterest - data.scores.termB.breakdown.searchInterest).toFixed(1)}</td>
          </tr>
          <tr>
            <td>Social Buzz</td>
            <td>${data.scores.termA.breakdown.socialBuzz.toFixed(1)}</td>
            <td>${data.scores.termB.breakdown.socialBuzz.toFixed(1)}</td>
            <td>${(data.scores.termA.breakdown.socialBuzz - data.scores.termB.breakdown.socialBuzz).toFixed(1)}</td>
          </tr>
          <tr>
            <td>Authority</td>
            <td>${data.scores.termA.breakdown.authority.toFixed(1)}</td>
            <td>${data.scores.termB.breakdown.authority.toFixed(1)}</td>
            <td>${(data.scores.termA.breakdown.authority - data.scores.termB.breakdown.authority).toFixed(1)}</td>
          </tr>
          <tr>
            <td>Momentum</td>
            <td>${data.scores.termA.breakdown.momentum.toFixed(1)}</td>
            <td>${data.scores.termB.breakdown.momentum.toFixed(1)}</td>
            <td>${(data.scores.termA.breakdown.momentum - data.scores.termB.breakdown.momentum).toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  ${data.aiInsights ? `
  <!-- Page 3: AI Insights -->
  <div class="page">
    <div class="page-header">
      <h2>AI-Powered Insights</h2>
    </div>
    
    ${data.aiInsights.whatDataTellsUs && data.aiInsights.whatDataTellsUs.length > 0 ? `
    <div class="section">
      <div class="section-title">Key Findings</div>
      <div class="insights-container">
        <ul class="insights-list">
          ${data.aiInsights.whatDataTellsUs.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}
    
    ${data.aiInsights.whyThisMatters ? `
    <div class="section">
      <div class="insights-box">
        <h4>Why This Matters</h4>
        <p>${data.aiInsights.whyThisMatters}</p>
      </div>
    </div>
    ` : ''}
    
    ${data.aiInsights.keyDifferences ? `
    <div class="section">
      <div class="insights-box">
        <h4>Key Differences</h4>
        <p>${data.aiInsights.keyDifferences}</p>
      </div>
    </div>
    ` : ''}
    
    ${data.aiInsights.volatilityAnalysis ? `
    <div class="section">
      <div class="insights-box" style="border-left-color: #f59e0b;">
        <h4>Volatility Analysis</h4>
        <p>${data.aiInsights.volatilityAnalysis}</p>
      </div>
    </div>
    ` : ''}
    
    ${data.aiInsights.peakExplanations ? `
    <div class="section">
      <div class="section-title">Peak Explanations</div>
      ${data.aiInsights.peakExplanations.termA ? `
      <div class="peak-explanation">
        <h5>${termAFormatted}</h5>
        <p>${data.aiInsights.peakExplanations.termA}</p>
      </div>
      ` : ''}
      ${data.aiInsights.peakExplanations.termB ? `
      <div class="peak-explanation">
        <h5>${termBFormatted}</h5>
        <p>${data.aiInsights.peakExplanations.termB}</p>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    ${data.aiInsights.prediction ? `
    <div class="section">
      <div class="insights-box" style="border-left-color: #10b981; background: #f0fdf4;">
        <h4>📈 Future Forecast</h4>
        <p>${data.aiInsights.prediction}</p>
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.predictions && (data.predictions.predictionsA || data.predictions.predictionsB) ? `
  <!-- Predictions Section -->
  <div class="page">
    <div class="page-header">
      <h2>Future Trend Forecast</h2>
    </div>
    
    <div class="section">
      <div class="section-title">30-Day Predictions</div>
      <p style="color: #6b7280; margin-bottom: 16px; font-size: 13px;">
        Based on ${data.predictions.historicalDataPoints ? (data.predictions.historicalDataPoints > 200 ? '~5 years' : data.predictions.historicalDataPoints > 100 ? '~1 year' : `${data.predictions.historicalDataPoints} days`) : 'historical'} of historical data
      </p>
      <div class="predictions-grid">
        ${data.predictions.predictionsA ? `
        <div class="prediction-card">
          <h4>${termAFormatted}</h4>
          <div class="prediction-trend ${data.predictions.predictionsA.trend}">
            ${data.predictions.predictionsA.trend === 'rising' ? '↗ Rising' : data.predictions.predictionsA.trend === 'falling' ? '↘ Falling' : '→ Stable'}
          </div>
          <div class="prediction-stats">
            <div class="prediction-stat">
              <div class="prediction-stat-label">Forecast Period</div>
              <div class="prediction-stat-value">${data.predictions.predictionsA.forecastPeriod} days</div>
            </div>
            <div class="prediction-stat">
              <div class="prediction-stat-label">Confidence</div>
              <div class="prediction-stat-value">${data.predictions.predictionsA.confidence.toFixed(0)}%</div>
            </div>
            ${data.predictions.predictionsA.metrics ? `
            <div class="prediction-stat">
              <div class="prediction-stat-label">Data Quality</div>
              <div class="prediction-stat-value">${data.predictions.predictionsA.metrics.dataQuality.toFixed(0)}%</div>
            </div>
            <div class="prediction-stat">
              <div class="prediction-stat-label">Trend Strength</div>
              <div class="prediction-stat-value">${data.predictions.predictionsA.metrics.trendStrength.toFixed(0)}%</div>
            </div>
            ` : ''}
          </div>
          ${data.predictions.predictionsA.explanation ? `
          <div class="prediction-explanation">
            <strong>Forecast:</strong> ${data.predictions.predictionsA.explanation}
          </div>
          ` : ''}
        </div>
        ` : ''}
        ${data.predictions.predictionsB ? `
        <div class="prediction-card">
          <h4>${termBFormatted}</h4>
          <div class="prediction-trend ${data.predictions.predictionsB.trend}">
            ${data.predictions.predictionsB.trend === 'rising' ? '↗ Rising' : data.predictions.predictionsB.trend === 'falling' ? '↘ Falling' : '→ Stable'}
          </div>
          <div class="prediction-stats">
            <div class="prediction-stat">
              <div class="prediction-stat-label">Forecast Period</div>
              <div class="prediction-stat-value">${data.predictions.predictionsB.forecastPeriod} days</div>
            </div>
            <div class="prediction-stat">
              <div class="prediction-stat-label">Confidence</div>
              <div class="prediction-stat-value">${data.predictions.predictionsB.confidence.toFixed(0)}%</div>
            </div>
            ${data.predictions.predictionsB.metrics ? `
            <div class="prediction-stat">
              <div class="prediction-stat-label">Data Quality</div>
              <div class="prediction-stat-value">${data.predictions.predictionsB.metrics.dataQuality.toFixed(0)}%</div>
            </div>
            <div class="prediction-stat">
              <div class="prediction-stat-label">Trend Strength</div>
              <div class="prediction-stat-value">${data.predictions.predictionsB.metrics.trendStrength.toFixed(0)}%</div>
            </div>
            ` : ''}
          </div>
          ${data.predictions.predictionsB.explanation ? `
          <div class="prediction-explanation">
            <strong>Forecast:</strong> ${data.predictions.predictionsB.explanation}
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.geographicData && data.geographicData.countries && data.geographicData.countries.length > 0 ? `
  <!-- Geographic Analysis -->
  <div class="page">
    <div class="page-header">
      <h2>Geographic Performance</h2>
    </div>
    
    <div class="geographic-section">
      <div class="section-title">Regional Breakdown</div>
      <p style="color: #6b7280; margin-bottom: 16px; font-size: 13px;">
        Top countries showing search interest for both terms. Higher values indicate stronger search interest in that region.
      </p>
      <table class="geographic-table">
        <thead>
          <tr>
            <th>Country</th>
            <th>${termAFormatted}</th>
            <th>${termBFormatted}</th>
            <th>Leader</th>
          </tr>
        </thead>
        <tbody>
          ${data.geographicData.countries.slice(0, 15).map(country => {
            const leader = country.termAValue >= country.termBValue ? termAFormatted : termBFormatted;
            return `
          <tr>
            <td><strong>${country.name}</strong></td>
            <td>${country.termAValue.toFixed(1)}</td>
            <td>${country.termBValue.toFixed(1)}</td>
            <td><strong>${leader}</strong></td>
          </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- Final Page: Footer -->
  <div class="page">
    <div class="footer">
      <div class="footer-logo">TRENDARC</div>
      <p><strong>Advanced Trend Comparison Platform</strong></p>
      <p style="margin-top: 15px;">
        View the full interactive report online:<br>
        <a href="${data.reportUrl}">${data.reportUrl}</a>
      </p>
      <p style="margin-top: 20px; font-size: 11px; color: #9ca3af;">
        This report was generated on ${date}<br>
        Data sources: ${data.verdict.sources.join(', ')}<br>
        Report ID: ${data.slug}
      </p>
      <p style="margin-top: 20px; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} TrendArc. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate PDF from comparison data
 */
export async function generateComparisonPDF(data: ComparisonPDFData): Promise<Buffer> {
  let browser;
  
  try {
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
    
    // Generate HTML
    const html = generatePDFHTML(data);
    
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

    return Buffer.from(pdf);
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
