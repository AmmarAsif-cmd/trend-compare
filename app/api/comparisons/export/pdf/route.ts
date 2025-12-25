/**
 * POST /api/comparisons/export/pdf
 * 
 * Premium-only PDF export with job queue system
 * 
 * Requirements:
 * - No exports for free users (block server-side)
 * - Queued job system (PdfJob table)
 * - Generate once and reuse
 * - Store fileUrl and serve signed URL
 * - Rate limit: 1 per user per 5 minutes
 * - Ensure exports never trigger AI calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { canAccessPremium, getCurrentUser } from '@/lib/user-auth-helpers';
import { prisma } from '@/lib/db';
import { fromSlug, toCanonicalSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';

export const dynamic = 'force-dynamic';

// Rate limiting: 1 PDF per user per 5 minutes
const PDF_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

/**
 * Check if user can request PDF (rate limit)
 */
async function checkPdfRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const recentJob = await prisma.pdfJob.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - PDF_RATE_LIMIT_MS),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (recentJob) {
    const retryAfter = Math.ceil((PDF_RATE_LIMIT_MS - (Date.now() - recentJob.createdAt.getTime())) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/**
 * Generate signed URL for PDF (placeholder - implement with your storage provider)
 */
async function generateSignedUrl(fileUrl: string, expiresInSeconds: number = 3600): Promise<string> {
  // TODO: Implement signed URL generation with your storage provider (S3, Cloudflare R2, etc.)
  // For now, return the fileUrl directly
  return fileUrl;
}

export async function POST(request: NextRequest) {
  try {
    // Check premium access (server-side enforcement)
    const hasPremium = await canAccessPremium();
    if (!hasPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to export PDFs' },
        { status: 403 }
      );
    }

    // Get user
    const user = await getCurrentUser();
    if (!user || !(user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = (user as any).id;

    // Check rate limit
    const rateLimitCheck = await checkPdfRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before requesting another PDF.',
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { slug, timeframe = '12m', geo = '' } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Validate and normalize slug
    const raw = fromSlug(slug);
    const checked = raw.map(validateTopic);
    const valid = checked.filter(isValidTopic);
    
    if (valid.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    const canonical = toCanonicalSlug(valid.map((c) => c.term));
    
    if (!canonical || canonical !== slug) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    // Check if PDF job already exists and is completed
    const existingJob = await prisma.pdfJob.findUnique({
      where: {
        user_slug_timeframe_geo: {
          userId,
          slug: canonical,
          timeframe,
          geo,
        },
      },
    });

    // If job exists and is completed, return signed URL
    if (existingJob && existingJob.status === 'completed' && existingJob.fileUrl) {
      // Check if signed URL is still valid
      if (existingJob.signedUrl && existingJob.signedUrlExpiresAt && existingJob.signedUrlExpiresAt > new Date()) {
        return NextResponse.json({
          success: true,
          jobId: existingJob.id,
          status: 'completed',
          signedUrl: existingJob.signedUrl,
          expiresAt: existingJob.signedUrlExpiresAt.toISOString(),
        });
      }

      // Generate new signed URL
      const signedUrl = await generateSignedUrl(existingJob.fileUrl, 3600);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await prisma.pdfJob.update({
        where: { id: existingJob.id },
        data: {
          signedUrl,
          signedUrlExpiresAt: expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        jobId: existingJob.id,
        status: 'completed',
        signedUrl,
        expiresAt: expiresAt.toISOString(),
      });
    }

    // If job exists and is pending/processing, return job status
    if (existingJob && (existingJob.status === 'pending' || existingJob.status === 'processing')) {
      return NextResponse.json({
        success: true,
        jobId: existingJob.id,
        status: existingJob.status,
        message: 'PDF generation in progress',
      });
    }

    // If job exists and failed, create new job
    if (existingJob && existingJob.status === 'failed') {
      // Delete old failed job and create new one
      await prisma.pdfJob.delete({
        where: { id: existingJob.id },
      });
    }

    // Create new PDF job
    const pdfJob = await prisma.pdfJob.create({
      data: {
        userId,
        slug: canonical,
        timeframe,
        geo,
        status: 'pending',
      },
    });

    // Trigger PDF generation job (async, fire-and-forget)
    // This will be handled by a background job processor
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${appUrl}/api/jobs/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Job-Secret': process.env.JOB_SECRET || 'default-job-secret',
      },
      body: JSON.stringify({
        jobId: pdfJob.id,
        slug: canonical,
        timeframe,
        geo,
        userId,
      }),
    }).catch(error => {
      console.error('[PDF Export] Failed to trigger PDF generation job:', error);
    });

    return NextResponse.json({
      success: true,
      jobId: pdfJob.id,
      status: 'pending',
      message: 'PDF generation queued',
    });
  } catch (error) {
    console.error('[PDF Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to queue PDF export' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comparisons/export/pdf?jobId=xxx
 * 
 * Check PDF job status
 */
export async function GET(request: NextRequest) {
  try {
    // Check premium access
    const hasPremium = await canAccessPremium();
    if (!hasPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    if (!user || !(user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = (user as any).id;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = await prisma.pdfJob.findFirst({
      where: {
        id: jobId,
        userId, // Ensure user can only access their own jobs
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      fileUrl: job.fileUrl,
      signedUrl: job.signedUrl,
      expiresAt: job.signedUrlExpiresAt?.toISOString(),
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    });
  } catch (error) {
    console.error('[PDF Export Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get PDF job status' },
      { status: 500 }
    );
  }
}

