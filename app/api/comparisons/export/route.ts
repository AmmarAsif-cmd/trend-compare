import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { toCanonicalSlug } from '@/lib/slug';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to export data.' },
        { status: 401 }
      );
    }

    // Get parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'
    const timeframe = searchParams.get('timeframe') || '12m';
    const geo = searchParams.get('geo') || '';

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be "json" or "csv"' },
        { status: 400 }
      );
    }

    // Parse slug to get terms
    const terms = slug.split('-vs-');
    if (terms.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    // Get comparison data
    const comparison = await getOrBuildComparison({
      slug,
      terms,
      timeframe,
      geo,
    });

    if (!comparison || !comparison.series || comparison.series.length === 0) {
      return NextResponse.json(
        { error: 'Comparison data not found' },
        { status: 404 }
      );
    }

    // Get intelligent comparison for additional metrics
    let intelligentComparison = null;
    try {
      intelligentComparison = await runIntelligentComparison(terms, timeframe, geo);
    } catch (error) {
      console.warn('[Export] Could not fetch intelligent comparison data:', error);
    }

    // Prepare export data
    const exportData = {
      metadata: {
        termA: terms[0],
        termB: terms[1],
        slug,
        timeframe,
        geo: geo || 'Worldwide',
        exportedAt: new Date().toISOString(),
        dataPoints: comparison.series.length,
      },
      series: comparison.series.map((point: any) => ({
        date: point.date,
        [terms[0]]: point[terms[0]] || 0,
        [terms[1]]: point[terms[1]] || 0,
      })),
      statistics: {
        termA: {
          average: comparison.stats?.aShare || 0,
          peak: comparison.stats?.peakA || 0,
          peakDate: comparison.stats?.peakADate || null,
        },
        termB: {
          average: comparison.stats?.bShare || 0,
          peak: comparison.stats?.peakB || 0,
          peakDate: comparison.stats?.peakBDate || null,
        },
      },
    };

    // Add intelligent comparison data if available
    if (intelligentComparison) {
      exportData.metadata.sources = intelligentComparison.performance.sourcesQueried || [];
      exportData.scores = {
        termA: {
          overall: intelligentComparison.scores.termA.overall,
          breakdown: intelligentComparison.scores.termA.breakdown,
        },
        termB: {
          overall: intelligentComparison.scores.termB.overall,
          breakdown: intelligentComparison.scores.termB.breakdown,
        },
      };
    }

    // Generate filename
    const formatTerm = (term: string) => term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const filename = `${formatTerm(terms[0])}-vs-${formatTerm(terms[1])}-Trend-Data-${timeframe}${geo ? `-${geo}` : ''}`;

    if (format === 'csv') {
      // Generate CSV
      const csvRows: string[] = [];

      // Header row
      csvRows.push('Date,' + terms.map(t => `"${formatTerm(t)}"`).join(','));
      
      // Data rows
      for (const point of comparison.series) {
        const date = point.date || '';
        const valueA = point[terms[0]] || 0;
        const valueB = point[terms[1]] || 0;
        csvRows.push(`${date},${valueA},${valueB}`);
      }

      // Add statistics section
      csvRows.push('');
      csvRows.push('Statistics');
      csvRows.push(`Term,Average,Peak,Peak Date`);
      csvRows.push(`"${formatTerm(terms[0])}",${exportData.statistics.termA.average},${exportData.statistics.termA.peak},${exportData.statistics.termA.peakDate || 'N/A'}`);
      csvRows.push(`"${formatTerm(terms[1])}",${exportData.statistics.termB.average},${exportData.statistics.termB.peak},${exportData.statistics.termB.peakDate || 'N/A'}`);

      // Add scores if available
      if (exportData.scores) {
        csvRows.push('');
        csvRows.push('TrendArc Scores');
        csvRows.push(`Term,Overall Score,Search Interest,Social Buzz,Authority,Momentum`);
        csvRows.push(`"${formatTerm(terms[0])}",${exportData.scores.termA.overall},${exportData.scores.termA.breakdown.searchInterest},${exportData.scores.termA.breakdown.socialBuzz},${exportData.scores.termA.breakdown.authority},${exportData.scores.termA.breakdown.momentum}`);
        csvRows.push(`"${formatTerm(terms[1])}",${exportData.scores.termB.overall},${exportData.scores.termB.breakdown.searchInterest},${exportData.scores.termB.breakdown.socialBuzz},${exportData.scores.termB.breakdown.authority},${exportData.scores.termB.breakdown.momentum}`);
      }

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // Return JSON
      return NextResponse.json(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error: any) {
    console.error('[Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export comparison data' },
      { status: 500 }
    );
  }
}


