import { NextResponse } from 'next/server';
import { getAlertsToCheck, checkAlert, updateAlertStatus } from '@/lib/trend-alerts';
import { sendTrendAlertEmail } from '@/lib/email-alerts';
import { prisma } from '@/lib/db';

/**
 * Cron job endpoint to check and process trend alerts
 * 
 * This endpoint should be called periodically (e.g., every hour) by:
 * - Vercel Cron Jobs (vercel.json)
 * - External cron service (cron-job.org, EasyCron, etc.)
 * - Server cron (crontab)
 * 
 * Security: Should be protected with a secret token or Vercel Cron auth
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // Optional: Add authentication check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  let processedCount = 0;
  let triggeredCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    console.log('[Cron] Starting alert check job...');
    
    // Get all alerts that need checking
    const alerts = await getAlertsToCheck();
    console.log(`[Cron] Found ${alerts.length} alerts to check`);

    // Process each alert
    for (const alert of alerts) {
      try {
        processedCount++;
        
        // Check if alert should trigger
        const result = await checkAlert(alert);
        
        if (result.shouldTrigger) {
          triggeredCount++;
          
          // Get user email
          const user = await prisma.user.findUnique({
            where: { id: alert.userId },
            select: { email: true, name: true },
          });

          if (!user || !user.email) {
            console.warn(`[Cron] User ${alert.userId} not found or has no email for alert ${alert.id}`);
            errors.push(`Alert ${alert.id}: User not found`);
            errorCount++;
            continue;
          }

          // Send email
          try {
            await sendTrendAlertEmail(user.email, {
              termA: alert.termA,
              termB: alert.termB,
              slug: alert.slug,
              reason: result.reason || 'Alert triggered',
              currentScoreA: result.currentScoreA || 0,
              currentScoreB: result.currentScoreB || 0,
              baselineScoreA: alert.baselineScoreA || undefined,
              baselineScoreB: alert.baselineScoreB || undefined,
              alertType: alert.alertType,
            });

            // Update alert: mark as triggered, increment notify count
            await prisma.trendAlert.update({
              where: { id: alert.id },
              data: {
                lastTriggered: new Date(),
                notifyCount: alert.notifyCount + 1,
                lastChecked: new Date(),
              },
            });

            console.log(`[Cron] ✅ Alert ${alert.id} triggered and email sent to ${user.email}`);
          } catch (emailError) {
            console.error(`[Cron] ❌ Failed to send email for alert ${alert.id}:`, emailError);
            errors.push(`Alert ${alert.id}: Email send failed - ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
            errorCount++;
          }
        } else {
          // Alert didn't trigger, just update lastChecked
          await prisma.trendAlert.update({
            where: { id: alert.id },
            data: { lastChecked: new Date() },
          });
        }
      } catch (alertError) {
        console.error(`[Cron] ❌ Error processing alert ${alert.id}:`, alertError);
        errors.push(`Alert ${alert.id}: ${alertError instanceof Error ? alertError.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    
    const summary = {
      success: true,
      processed: processedCount,
      triggered: triggeredCount,
      errors: errorCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...(errors.length > 0 && { errorDetails: errors }),
    };

    console.log(`[Cron] ✅ Alert check job completed:`, summary);
    
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron] ❌ Fatal error in alert check job:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: processedCount,
        triggered: triggeredCount,
        errors: errorCount,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

