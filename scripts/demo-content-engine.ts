/**
 * Content Engine Demo
 * Demonstrates the pattern detection and narrative generation system
 */

import { generateComparisonContent } from '../lib/content-engine';
import type { SeriesPoint } from '../lib/trends';

// Generate realistic mock data for demonstration
function generateMockData(
  term1: string,
  term2: string,
  days: number = 90
): SeriesPoint[] {
  const series: SeriesPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Term1: Growing trend with seasonal spike
    const baseValue1 = 50 + (i / days) * 30; // Growth from 50 to 80
    const seasonalBoost1 = date.getMonth() === 8 ? 25 : 0; // September spike
    const noise1 = (Math.random() - 0.5) * 10;
    const value1 = Math.max(0, Math.min(100, baseValue1 + seasonalBoost1 + noise1));

    // Term2: Stable with volatility
    const baseValue2 = 40 + (Math.sin(i / 10) * 15); // Oscillating
    const noise2 = (Math.random() - 0.5) * 8;
    const value2 = Math.max(0, Math.min(100, baseValue2 + noise2));

    series.push({
      date: date.toISOString().split('T')[0],
      [term1]: Math.round(value1),
      [term2]: Math.round(value2),
    });
  }

  return series;
}

async function runDemo() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           CONTENT ENGINE DEMO');
  console.log('═══════════════════════════════════════════════════════════\n');

  const terms = ['chatgpt', 'gemini'];
  const series = generateMockData(terms[0], terms[1], 90);

  console.log(`📊 Generated ${series.length} days of mock data for: ${terms.join(' vs ')}\n`);
  console.log(`Sample data points:`);
  console.log(series.slice(0, 3));
  console.log(`... (${series.length - 6} more points)`);
  console.log(series.slice(-3));
  console.log('\n');

  console.log('⚙️  Running Content Engine (Deep Analysis Mode)...\n');

  try {
    const result = await generateComparisonContent(terms, series, {
      deepAnalysis: true,
      useMultiSource: false, // Skip multi-source for demo
    });

    console.log('✅ Analysis Complete!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                     RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Performance
    console.log('⏱️  PERFORMANCE:');
    console.log(`   Total Time: ${result.performance.totalMs}ms`);
    console.log(`   Analysis: ${result.performance.analysisMs}ms`);
    console.log(`   Narrative: ${result.performance.narrativeMs}ms\n`);

    // Insights Summary
    console.log('📈 INSIGHTS:');
    console.log(`   Confidence: ${result.insights.confidence}%`);
    console.log(`   Data Points: ${result.insights.dataPoints}`);
    console.log(`   Date Range: ${result.insights.dateRange.start} to ${result.insights.dateRange.end}\n`);

    // Narrative
    console.log('📝 GENERATED NARRATIVE:\n');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`HEADLINE: ${result.narrative.headline}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`SUBTITLE: ${result.narrative.subtitle}\n`);

    // Key Takeaways
    console.log('🎯 KEY TAKEAWAYS:');
    result.narrative.keyTakeaways.forEach((takeaway, i) => {
      console.log(`   ${i + 1}. ${takeaway}`);
    });
    console.log('');

    // Sections
    console.log('📄 CONTENT SECTIONS:\n');
    result.narrative.sections.forEach((section, i) => {
      console.log(`┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ ${(i + 1) + '. ' + section.title.toUpperCase().padEnd(57)}│`);
      console.log(`│ Confidence: ${section.confidence}%`.padEnd(62) + '│');
      console.log(`└─────────────────────────────────────────────────────────────┘`);
      console.log(`${section.content}\n`);
    });

    // SEO
    console.log('🔍 SEO METADATA:');
    console.log(`   Description: ${result.narrative.seoDescription}`);
    console.log(`   Uniqueness Score: ${result.narrative.uniquenessScore}/100\n`);

    // Pattern Details
    console.log('═══════════════════════════════════════════════════════════');
    console.log('               DETAILED PATTERN ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    result.insights.termInsights.forEach((ti: any) => {
      console.log(`▶ ${ti.term.toUpperCase()}\n`);

      if (ti.trend) {
        console.log(`  📊 TREND:`);
        console.log(`     Direction: ${ti.trend.direction}`);
        console.log(`     Strength: ${ti.trend.strength}/100`);
        console.log(`     Momentum: ${ti.trend.momentum.toFixed(2)}%`);
        console.log(`     Acceleration: ${ti.trend.acceleration.toFixed(2)}%`);
        console.log(`     R²: ${ti.trend.rSquared.toFixed(3)}\n`);
      }

      if (ti.volatility) {
        console.log(`  📉 VOLATILITY:`);
        console.log(`     Level: ${ti.volatility.level}`);
        console.log(`     Stability: ${ti.volatility.stability}/100`);
        console.log(`     Consistency: ${ti.volatility.consistency}/100`);
        console.log(`     Risk Score: ${ti.volatility.riskScore}/100\n`);
      }

      if (ti.seasonal && ti.seasonal.length > 0) {
        console.log(`  📅 SEASONAL PATTERNS:`);
        ti.seasonal.forEach((pattern: any) => {
          console.log(`     - ${pattern.period}: ${pattern.strength}% strength`);
          console.log(`       ${pattern.description}`);
        });
        console.log('');
      }

      if (ti.spikes && ti.spikes.length > 0) {
        console.log(`  ⚡ TOP SPIKES:`);
        ti.spikes.slice(0, 3).forEach((spike: any) => {
          console.log(`     - ${spike.date}: ${spike.magnitude.toFixed(1)}% surge`);
          if (spike.context) console.log(`       Context: ${spike.context}`);
        });
        console.log('');
      }
    });

    // Comparison
    if (result.insights.comparison) {
      console.log(`📊 COMPARISON ANALYSIS:\n`);
      const comp = result.insights.comparison;

      if (comp.leader) {
        console.log(`   🏆 Leader: ${comp.leader}`);
        console.log(`   Gap: ${comp.gap.toFixed(1)}%\n`);
      }

      if (comp.trend) {
        console.log(`   Trends: ${comp.trend.convergence}`);
        console.log(`   Correlation: ${(comp.trend.correlation * 100).toFixed(1)}%\n`);
      }

      if (comp.insights && comp.insights.length > 0) {
        console.log(`   Key Insights:`);
        comp.insights.forEach((insight: string) => {
          console.log(`   - ${insight}`);
        });
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    DEMO COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✨ This content is 100% unique and data-driven!');
    console.log(`   Uniqueness Score: ${result.narrative.uniquenessScore}/100\n`);

    console.log('🎯 Benefits:');
    console.log('   ✓ NO AI required (zero cost)');
    console.log('   ✓ NO keyword hardcoding (works for ANY term)');
    console.log('   ✓ Unique content for each comparison (SEO-safe)');
    console.log('   ✓ Multi-source fallback (system always works)');
    console.log('   ✓ ML-ready architecture (future predictive models)\n');

  } catch (error) {
    console.error('❌ Error running demo:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Run the demo
runDemo().catch(console.error);
