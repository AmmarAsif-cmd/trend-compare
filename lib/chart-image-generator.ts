/**
 * Chart Image Generator
 * Generates PNG images of charts for PDF embedding
 * Uses Puppeteer to render Chart.js charts server-side
 */

import puppeteer from 'puppeteer';
import type { SeriesPoint } from '@/lib/trends';
import type { ComparisonCategory } from '@/lib/category-resolver';
import { calculateTrendArcScoreTimeSeries } from '@/lib/trendarc-score-time-series';
import { formatTerm } from './term-formatter';

interface ChartImageOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
}

/**
 * Generate a PNG image of the TrendArc Score Over Time chart
 */
export async function generateScoreChartImage(
  series: SeriesPoint[],
  termA: string,
  termB: string,
  category: ComparisonCategory = 'general',
  options: ChartImageOptions = {}
): Promise<Buffer | null> {
  const { width = 800, height = 400, deviceScaleFactor = 2 } = options;

  if (!series || series.length === 0) {
    return null;
  }

  // Calculate scores over time
  const scoreDataA = calculateTrendArcScoreTimeSeries(series, termA, category);
  const scoreDataB = calculateTrendArcScoreTimeSeries(series, termB, category);

  const dates = series.map(p => p.date);
  const scoresA = scoreDataA.map(p => p.score);
  const scoresB = scoreDataB.map(p => p.score);

  const termAFormatted = formatTerm(termA);
  const termBFormatted = formatTerm(termB);

  // Generate HTML with Chart.js
  const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: white;
    }
    #chart-container {
      width: ${width}px;
      height: ${height}px;
    }
  </style>
</head>
<body>
  <canvas id="chart"></canvas>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: '${termAFormatted}',
            data: ${JSON.stringify(scoresA)},
            borderColor: 'rgb(139, 92, 246)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: '${termBFormatted}',
            data: ${JSON.stringify(scoresB)},
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: 'Inter',
                size: 12,
                weight: '500',
              },
              padding: 15,
              usePointStyle: true,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              family: 'Inter',
              size: 12,
              weight: '600',
            },
            bodyFont: {
              family: 'Inter',
              size: 11,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 10,
              },
              color: '#6b7280',
            },
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: '#f3f4f6',
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 10,
              },
              color: '#6b7280',
            },
          },
        },
      },
    });
    
    // Wait for chart to render
    setTimeout(() => {
      window.chartReady = true;
    }, 500);
  </script>
</body>
</html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height: height + 100, deviceScaleFactor });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for chart to be ready
    await page.waitForFunction(() => (window as any).chartReady === true, { timeout: 5000 });

    // Take screenshot
    const imageBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height: height + 100 },
    }) as Buffer;

    await browser.close();

    return imageBuffer;
  } catch (error) {
    console.error('[ChartImageGenerator] Error generating chart image:', error);
    return null;
  }
}

/**
 * Generate a PNG image of the Forecast chart
 */
export async function generateForecastChartImage(
  historicalSeries: SeriesPoint[],
  forecastPoints: Array<{ date: string; value: number; lowerBound?: number; upperBound?: number }>,
  term: string,
  options: ChartImageOptions = {}
): Promise<Buffer | null> {
  const { width = 800, height = 400, deviceScaleFactor = 2 } = options;

  if (!historicalSeries || historicalSeries.length === 0 || !forecastPoints || forecastPoints.length === 0) {
    return null;
  }

  const historicalDates = historicalSeries.map(p => p.date);
  const historicalValues = historicalSeries.map(p => Number(p[term] || 0));

  const forecastDates = forecastPoints.map(p => p.date);
  const forecastValues = forecastPoints.map(p => p.value);
  const forecastLower = forecastPoints.map(p => p.lowerBound || p.value);
  const forecastUpper = forecastPoints.map(p => p.upperBound || p.value);

  const termFormatted = formatTerm(term);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: white;
    }
  </style>
</head>
<body>
  <canvas id="chart"></canvas>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify([...historicalDates, ...forecastDates])},
        datasets: [
          {
            label: 'Historical',
            data: ${JSON.stringify([...historicalValues, ...new Array(forecastValues.length).fill(null)])},
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Forecast',
            data: ${JSON.stringify([...new Array(historicalValues.length).fill(null), ...forecastValues])},
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Uncertainty Band',
            data: ${JSON.stringify([...new Array(historicalValues.length).fill(null), ...forecastUpper])},
            borderColor: 'rgba(168, 85, 247, 0.2)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 1,
            fill: '+1',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: 'Inter',
                size: 12,
                weight: '500',
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6',
            },
          },
        },
      },
    });
    
    setTimeout(() => {
      window.chartReady = true;
    }, 500);
  </script>
</body>
</html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height: height + 100, deviceScaleFactor });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.waitForFunction(() => (window as any).chartReady === true, { timeout: 5000 });

    const imageBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height: height + 100 },
    }) as Buffer;

    await browser.close();

    return imageBuffer;
  } catch (error) {
    console.error('[ChartImageGenerator] Error generating forecast chart image:', error);
    return null;
  }
}

