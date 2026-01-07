/**
 * TikTok User Service
 * Handles fetching, caching, and storing TikTok user data
 */

import { prisma } from '../db';
import { normalizeTikTokUsername, getTikTokProfileUrl } from '../tiktok-username-normalizer';
import { getApifyClient, TikTokUserProfile } from './apify-client';
import { TikTokUserNotFoundError } from './errors';

const CACHE_TTL_HOURS = 24; // Cache for 24 hours

export interface TikTokUserData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  followingCount: number | null;
  videoCount: number | null;
  likeCount: number | null;
  engagementRate: number | null;
  verified: boolean;
  bio: string | null;
  profileUrl: string | null;
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * Get TikTok user data from database or fetch from API
 * @param username - TikTok username (will be normalized)
 * @param forceRefresh - Force refresh even if cache is valid
 * @returns User data or null if not found
 */
export async function getTikTokUser(
  username: string,
  forceRefresh: boolean = false
): Promise<TikTokUserData | null> {
  const normalized = normalizeTikTokUsername(username);
  if (!normalized) {
    return null;
  }

  // Check database cache
  if (!forceRefresh) {
    const cached = await prisma.tikTokUser.findUnique({
      where: { username: normalized },
    });

    if (cached) {
      // Check if cache is still valid (< 24 hours old)
      const cacheAge = Date.now() - cached.lastUpdated.getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);

      if (cacheAgeHours < CACHE_TTL_HOURS) {
        // Cache is valid, return it
        return {
          id: cached.id,
          username: cached.username,
          displayName: cached.displayName,
          avatarUrl: cached.avatarUrl,
          followerCount: cached.followerCount,
          followingCount: cached.followingCount,
          videoCount: cached.videoCount,
          likeCount: cached.likeCount,
          engagementRate: cached.engagementRate,
          verified: cached.verified,
          bio: cached.bio,
          profileUrl: cached.profileUrl,
          lastUpdated: cached.lastUpdated,
          createdAt: cached.createdAt,
        };
      }
    }
  }

  // Cache expired or force refresh - fetch from API
  const apifyClient = getApifyClient();
  
  if (!apifyClient.isConfigured()) {
    // API not configured, return cached data if available (even if stale)
    const stale = await prisma.tikTokUser.findUnique({
      where: { username: normalized },
    });
    
    if (stale) {
      return {
        id: stale.id,
        username: stale.username,
        displayName: stale.displayName,
        avatarUrl: stale.avatarUrl,
        followerCount: stale.followerCount,
        followingCount: stale.followingCount,
        videoCount: stale.videoCount,
        likeCount: stale.likeCount,
        engagementRate: stale.engagementRate,
        verified: stale.verified,
        bio: stale.bio,
        profileUrl: stale.profileUrl,
        lastUpdated: stale.lastUpdated,
        createdAt: stale.createdAt,
      };
    }
    
    return null;
  }

  try {
    const profile = await apifyClient.fetchUserProfile(normalized);
    
    // fetchUserProfile can throw TikTokUserNotFoundError or return null
    // If we get here with a valid profile, store/update in database
    if (!profile) {
      const stale = await prisma.tikTokUser.findUnique({ where: { username: normalized } });
      if (stale) {
        return {
          id: stale.id,
          username: stale.username,
          displayName: stale.displayName,
          avatarUrl: stale.avatarUrl,
          followerCount: stale.followerCount,
          followingCount: stale.followingCount,
          videoCount: stale.videoCount,
          likeCount: stale.likeCount,
          engagementRate: stale.engagementRate,
          verified: stale.verified,
          bio: stale.bio,
          profileUrl: stale.profileUrl,
          lastUpdated: stale.lastUpdated,
          createdAt: stale.createdAt,
        };
      }
      return null;
    }

    // Store/update in database
    const user = await prisma.tikTokUser.upsert({
      where: { username: normalized },
      update: {
        displayName: profile.displayName || null,
        avatarUrl: profile.avatarUrl || null,
        followerCount: profile.followerCount ?? null,
        followingCount: profile.followingCount ?? null,
        videoCount: profile.videoCount ?? null,
        likeCount: profile.likeCount ?? null,
        engagementRate: profile.engagementRate ?? null,
        verified: profile.verified || false,
        bio: profile.bio || null,
        profileUrl: profile.profileUrl || getTikTokProfileUrl(normalized),
        lastUpdated: new Date(),
      },
      create: {
        username: normalized,
        displayName: profile.displayName || null,
        avatarUrl: profile.avatarUrl || null,
        followerCount: profile.followerCount ?? null,
        followingCount: profile.followingCount ?? null,
        videoCount: profile.videoCount ?? null,
        likeCount: profile.likeCount ?? null,
        engagementRate: profile.engagementRate ?? null,
        verified: profile.verified || false,
        bio: profile.bio || null,
        profileUrl: profile.profileUrl || getTikTokProfileUrl(normalized),
        lastUpdated: new Date(),
      },
    });

    return {
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
      lastUpdated: user.lastUpdated,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error(`[TikTok User Service] Error fetching user ${normalized}:`, error);
    
    // On error, return stale cache if available
    const stale = await prisma.tikTokUser.findUnique({
      where: { username: normalized },
    });
    
    if (stale) {
      return {
        id: stale.id,
        username: stale.username,
        displayName: stale.displayName,
        avatarUrl: stale.avatarUrl,
        followerCount: stale.followerCount,
        followingCount: stale.followingCount,
        videoCount: stale.videoCount,
        likeCount: stale.likeCount,
        engagementRate: stale.engagementRate,
        verified: stale.verified,
        bio: stale.bio,
        profileUrl: stale.profileUrl,
        lastUpdated: stale.lastUpdated,
        createdAt: stale.createdAt,
      };
    }
    
    throw error;
  }
}

/**
 * Get multiple TikTok users by usernames
 * @param usernames - Array of TikTok usernames
 * @returns Array of user data (null for users not found)
 */
export async function getTikTokUsers(
  usernames: string[]
): Promise<(TikTokUserData | null)[]> {
  const normalized = usernames
    .map((u) => normalizeTikTokUsername(u))
    .filter((u): u is string => u !== null);

  // Fetch all users in parallel
  const results = await Promise.allSettled(
    normalized.map((username) => getTikTokUser(username))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error('[TikTok User Service] Error fetching user:', result.reason);
    return null;
  });
}

