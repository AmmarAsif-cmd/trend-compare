/**
 * Chart Image Generator
 * Generates PNG images of charts for PDF embedding
 * Uses Puppeteer to render Chart.js charts server-side
 */

// Use puppeteer-core for serverless, puppeteer for local dev
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    // Fallback if CDN fails - wait a bit longer
    if (typeof Chart === 'undefined') {
      setTimeout(() => {
        if (typeof Chart === 'undefined') {
          console.error('Chart.js failed to load from CDN');
        }
      }, 5000);
    }
  </script>
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
    
    // Wait for chart to render - increased timeout for serverless
    setTimeout(() => {
      window.chartReady = true;
      console.log('[ChartImageGenerator] Chart ready flag set in HTML');
    }, 1000);
  </script>
</body>
</html>
  `;

  let browser: any = null;
  
  try {
    // Use serverless-compatible Chromium for Vercel/serverless environments
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
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
    await page.setViewport({ width, height: height + 100, deviceScaleFactor });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for Chart.js to load and chart to render
    try {
      // Wait for Chart.js library to be available
      await page.waitForFunction(() => typeof (window as any).Chart !== 'undefined', { timeout: 15000 });
      console.log('[ChartImageGenerator] Chart.js library loaded');
      
      // Wait for chart to be created and ready
      await page.waitForFunction(() => (window as any).chartReady === true, { timeout: 15000 });
      console.log('[ChartImageGenerator] Chart ready flag set');
      
      // Additional wait to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify chart canvas exists and Chart.js is ready
      const canvasReady = await page.evaluate(() => {
        const canvas = document.getElementById('chart') as HTMLCanvasElement;
        if (!canvas) return false;
        // Check if canvas has dimensions (indicates it's been initialized)
        return canvas.width > 0 && canvas.height > 0;
      });
      
      if (!canvasReady) {
        console.warn('[ChartImageGenerator] Canvas not ready, waiting longer...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (waitError) {
      console.error('[ChartImageGenerator] Error waiting for chart:', waitError);
      // Continue anyway - might still work
    }

    // Take screenshot of the canvas element specifically
    const canvas = await page.$('#chart');
    if (!canvas) {
      console.error('[ChartImageGenerator] Chart canvas element not found');
      throw new Error('Chart canvas not found');
    }
    
    console.log('[ChartImageGenerator] Taking screenshot of chart canvas...');
    const imageBuffer = await canvas.screenshot({
      type: 'png',
    }) as Buffer;
    
    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('[ChartImageGenerator] Screenshot returned empty buffer');
      throw new Error('Screenshot returned empty buffer');
    }
    
    console.log('[ChartImageGenerator] Screenshot captured successfully', {
      bufferSize: imageBuffer.length,
    });

    await browser.close();

    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('[ChartImageGenerator] Screenshot returned empty buffer');
      return null;
    }

    console.log('[ChartImageGenerator] Chart image generated successfully', {
      bufferSize: imageBuffer.length,
      width,
      height,
    });

    return imageBuffer;
  } catch (error: any) {
    console.error('[ChartImageGenerator] Error generating chart image:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    // Ensure browser is closed even on error
    try {
      if (browser) {
        await browser.close();
      }
    } catch (closeError) {
      console.error('[ChartImageGenerator] Error closing browser:', closeError);
    }
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
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    // Fallback if CDN fails - wait a bit longer
    if (typeof Chart === 'undefined') {
      setTimeout(() => {
        if (typeof Chart === 'undefined') {
          console.error('Chart.js failed to load from CDN');
        }
      }, 5000);
    }
  </script>
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

  let browser: any = null;
  
  try {
    // Use serverless-compatible Chromium for Vercel/serverless environments
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
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
    await page.setViewport({ width, height: height + 100, deviceScaleFactor });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for Chart.js to load and chart to render
    try {
      // Wait for Chart.js library to be available
      await page.waitForFunction(() => typeof (window as any).Chart !== 'undefined', { timeout: 15000 });
      console.log('[ChartImageGenerator] Chart.js library loaded (forecast)');
      
      // Wait for chart to be created and ready
      await page.waitForFunction(() => (window as any).chartReady === true, { timeout: 15000 });
      console.log('[ChartImageGenerator] Forecast chart ready flag set');
      
      // Additional wait to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify chart canvas exists and has content
      const canvasExists = await page.evaluate(() => {
        const canvas = document.getElementById('chart') as HTMLCanvasElement;
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) return true;
        }
        return false;
      });
      
      if (!canvasExists) {
        console.warn('[ChartImageGenerator] Forecast canvas exists but appears empty, waiting longer...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (waitError) {
      console.error('[ChartImageGenerator] Error waiting for forecast chart:', waitError);
      // Continue anyway - might still work
    }

    // Take screenshot of the canvas element specifically
    const canvas = await page.$('#chart');
    if (!canvas) {
      console.error('[ChartImageGenerator] Forecast chart canvas element not found');
      throw new Error('Forecast chart canvas not found');
    }
    
    console.log('[ChartImageGenerator] Taking screenshot of forecast chart canvas...');
    const imageBuffer = await canvas.screenshot({
      type: 'png',
    }) as Buffer;
    
    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('[ChartImageGenerator] Forecast screenshot returned empty buffer');
      throw new Error('Forecast screenshot returned empty buffer');
    }
    
    console.log('[ChartImageGenerator] Forecast screenshot captured successfully', {
      bufferSize: imageBuffer.length,
    });

    await browser.close();

    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('[ChartImageGenerator] Forecast screenshot returned empty buffer');
      return null;
    }

    console.log('[ChartImageGenerator] Forecast chart image generated successfully', {
      bufferSize: imageBuffer.length,
    });

    return imageBuffer;
  } catch (error) {
    console.error('[ChartImageGenerator] Error generating forecast chart image:', error);
    return null;
  }
}

