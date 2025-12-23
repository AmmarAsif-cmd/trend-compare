/**
 * API Route: Save/Unsave Comparison
 * POST: Save a comparison
 * DELETE: Unsave a comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveComparison, unsaveComparison } from '@/lib/saved-comparisons';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error('[API Save] Failed to parse request body:', jsonError);
      return NextResponse.json(
        { success: false, message: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { slug, termA, termB, category, notes, tags } = body;

    console.log('[API Save] Request received:', { slug, termA, termB, category });

    if (!slug || !termA || !termB) {
      console.warn('[API Save] Missing required fields:', { slug, termA, termB });
      return NextResponse.json(
        { success: false, message: 'Missing required fields: slug, termA, termB' },
        { status: 400 }
      );
    }

    const result = await saveComparison(slug, termA, termB, category, notes, tags);

    console.log('[API Save] Result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      const statusCode = result.message?.includes('logged in') ? 401 : 400;
      const errorResponse = { 
        success: false, 
        message: result.message || 'Failed to save comparison',
      };
      console.log('[API Save] Returning error response:', JSON.stringify(errorResponse, null, 2));
      return NextResponse.json(errorResponse, { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const successResponse = { 
      success: true, 
      message: result.message || 'Comparison saved', 
      id: result.id,
    };
    console.log('[API Save] Returning success response:', JSON.stringify(successResponse, null, 2));
    return NextResponse.json(successResponse, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[API Save] Error saving comparison:', {
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      name: error?.name,
    });
    
    // Always return valid JSON, even on error
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Failed to save comparison',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = body.slug || request.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    const result = await unsaveComparison(slug);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Error unsaving comparison:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to unsave comparison' },
      { status: 500 }
    );
  }
}

