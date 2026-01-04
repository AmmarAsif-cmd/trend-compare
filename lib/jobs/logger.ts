/**
 * Job Logger
 * 
 * Logs job runs and failures for monitoring
 */

import { prisma } from '@/lib/db';

export type JobType = 'warmup-forecasts' | 'warmup-ai-explanations' | 'warmup-on-demand';

export interface JobLog {
  jobType: JobType;
  status: 'success' | 'failed' | 'running';
  processed?: number;
  failed?: number;
  errors?: string[];
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * Log job execution
 */
export async function logJobExecution(log: JobLog): Promise<void> {
  try {
    // Store in database for persistence
    // For now, we'll use console logging and can add DB table later
    console.log(`[JobLogger] ${log.jobType}:`, {
      status: log.status,
      processed: log.processed,
      failed: log.failed,
      duration: `${log.duration}ms`,
      errors: log.errors?.slice(0, 5), // Limit error display
      metadata: log.metadata,
    });

    // TODO: Add JobLog table to Prisma schema if needed for persistence
    // await prisma.jobLog.create({ data: { ... } });
  } catch (error) {
    console.error('[JobLogger] Failed to log job execution:', error);
  }
}

/**
 * Log job start
 */
export async function logJobStart(jobType: JobType, metadata?: Record<string, any>): Promise<void> {
  await logJobExecution({
    jobType,
    status: 'running',
    duration: 0,
    metadata,
  });
}

/**
 * Log job completion
 */
export async function logJobCompletion(
  jobType: JobType,
  result: { success: boolean; processed?: number; failed?: number; errors?: string[]; duration: number }
): Promise<void> {
  await logJobExecution({
    jobType,
    status: result.success ? 'success' : 'failed',
    processed: result.processed,
    failed: result.failed,
    errors: result.errors,
    duration: result.duration,
  });
}

