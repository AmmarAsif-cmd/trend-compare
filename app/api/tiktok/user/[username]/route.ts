/**
 * TikTok User API Route
 * GET /api/tiktok/user/[username]
 * Fetches TikTok user profile data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTikTokUser } from '@/lib/tiktok/user-service';
import { normalizeTikTokUsername } from '@/lib/tiktok-username-normalizer';
import { TikTokUserNotFoundError, InvalidTikTokUsernameError, TikTokAPINotConfiguredError } from '@/lib/tiktok/errors';
import { getUserFriendlyMessage } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Normalize username
    const normalized = normalizeTikTokUsername(username);
    if (!normalized) {
      return NextResponse.json(
        { error: `Invalid username format: ${username}` },
        { status: 400 }
      );
    }

    // Fetch user data
    const user = await getTikTokUser(normalized);

    if (!user) {
      return NextResponse.json(
        { error: `User "${normalized}" not found on TikTok` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      videoCount: user.videoCount,
      likeCount: user.likeCount,
      engagementRate: user.engagementRate,
      verified: user.verified,
      bio: user.bio,
      profileUrl: user.profileUrl,
      lastUpdated: user.lastUpdated.toISOString(),
    });
  } catch (error) {
    console.error('[TikTok User API] Error:', error);

    // Handle specific TikTok errors
    if (error instanceof TikTokUserNotFoundError) {
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.statusCode }
      );
    }

    if (error instanceof InvalidTikTokUsernameError) {
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.statusCode }
      );
    }

    if (error instanceof TikTokAPINotConfiguredError) {
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.statusCode }
      );
    }

    // Generic error
    const message = getUserFriendlyMessage(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

