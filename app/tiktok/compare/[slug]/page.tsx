/**
 * TikTok Comparison Page
 * Shows detailed comparison between two TikTok users
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import TikTokProfileImage from "@/components/tiktok/TikTokProfileImage";
import { formatTikTokUsernameForDisplay, getTikTokProfileUrl } from "@/lib/tiktok-username-normalizer";
import { getTikTokUsers, TikTokUserData } from "@/lib/tiktok/user-service";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Trophy, Users, Video, Heart } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TikTokComparePage({ params }: PageProps) {
  const { slug } = await params;

  // Parse slug (format: "username1-vs-username2" or "username2-vs-username1")
  const usernames = slug.split("-vs-");
  if (usernames.length !== 2) {
    notFound();
  }

  const [usernameA, usernameB] = usernames;

  // Fetch users
  let userA: TikTokUserData | null = null;
  let userB: TikTokUserData | null = null;
  try {
    const users = await getTikTokUsers([usernameA, usernameB]);
    userA = users[0];
    userB = users[1];

    if (!userA || !userB) {
      notFound();
    }

    // Calculate scores (simplified - you can enhance this)
    const calculateScore = (user: typeof userA) => {
      if (!user) return 0;
      let score = 0;
      if (user.followerCount) score += Math.log10(user.followerCount) * 20;
      if (user.engagementRate) score += user.engagementRate * 2;
      if (user.verified) score += 10;
      return Math.round(score);
    };

    const scoreA = calculateScore(userA);
    const scoreB = calculateScore(userB);
    const winner = scoreA > scoreB ? userA.username : userB.username;
    const margin = Math.abs(scoreA - scoreB);

    // Store comparison in database (or update if exists)
    const comparisonSlug = [usernameA, usernameB].sort().join("-vs-");
    await prisma.tikTokComparison.upsert({
      where: { slug: comparisonSlug },
      update: {
        userAScore: scoreA,
        userBScore: scoreB,
        winner,
        margin,
        viewCount: { increment: 1 },
      },
      create: {
        slug: comparisonSlug,
        userAUsername: userA.username,
        userBUsername: userB.username,
        userAScore: scoreA,
        userBScore: scoreB,
        winner,
        margin,
        viewCount: 1,
      },
    });
  } catch (error) {
    // If user not found or other error, show 404
    console.error('[TikTok Compare Page] Error:', error);
    notFound();
  }

  if (!userA || !userB) {
    notFound();
  }
  
  // Calculate scores for display
  const calculateScore = (user: typeof userA) => {
    if (!user) return 0;
    let score = 0;
    if (user.followerCount) score += Math.log10(user.followerCount) * 20;
    if (user.engagementRate) score += user.engagementRate * 2;
    if (user.verified) score += 10;
    return Math.round(score);
  };

  const scoreA = calculateScore(userA);
  const scoreB = calculateScore(userB);
  const winner = scoreA > scoreB ? userA.username : userB.username;
  const margin = Math.abs(scoreA - scoreB);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/tiktok"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to TikTok Explorer</span>
        </Link>

        {/* Comparison Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* User A */}
            <div className="text-center">
              <TikTokProfileImage
                avatarUrl={userA.avatarUrl}
                username={userA.username}
                displayName={userA.displayName}
                size="large"
                showVerified
                verified={userA.verified}
                className="mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {formatTikTokUsernameForDisplay(userA.username)}
              </h2>
              {userA.displayName && (
                <p className="text-slate-600 mb-4">{userA.displayName}</p>
              )}
              <a
                href={getTikTokProfileUrl(userA.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              >
                View on TikTok <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-400 mb-4">VS</div>
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-4">
                <div className="text-sm text-slate-600 mb-2">Winner</div>
                <div className="flex items-center justify-center gap-2 text-yellow-600">
                  <Trophy className="w-6 h-6" />
                  <span className="text-xl font-bold">
                    {formatTikTokUsernameForDisplay(winner)}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  by {margin} points
                </div>
              </div>
            </div>

            {/* User B */}
            <div className="text-center">
              <TikTokProfileImage
                avatarUrl={userB.avatarUrl}
                username={userB.username}
                displayName={userB.displayName}
                size="large"
                showVerified
                verified={userB.verified}
                className="mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {formatTikTokUsernameForDisplay(userB.username)}
              </h2>
              {userB.displayName && (
                <p className="text-slate-600 mb-4">{userB.displayName}</p>
              )}
              <a
                href={getTikTokProfileUrl(userB.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              >
                View on TikTok <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Scores & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User A Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {formatTikTokUsernameForDisplay(userA.username)}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Score</div>
                <div className="text-4xl font-bold text-slate-900">{scoreA}</div>
              </div>
              {userA.followerCount && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Followers</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {userA.followerCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {userA.videoCount && (
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Videos</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {userA.videoCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {userA.engagementRate && (
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Engagement Rate</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {userA.engagementRate.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User B Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {formatTikTokUsernameForDisplay(userB.username)}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Score</div>
                <div className="text-4xl font-bold text-slate-900">{scoreB}</div>
              </div>
              {userB.followerCount && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Followers</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {userB.followerCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {userB.videoCount && (
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Videos</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {userB.videoCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {userB.engagementRate && (
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Engagement Rate</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {userB.engagementRate.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {(userA.bio || userB.bio) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">About</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userA.bio && (
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2">
                    {formatTikTokUsernameForDisplay(userA.username)}
                  </div>
                  <p className="text-slate-600">{userA.bio}</p>
                </div>
              )}
              {userB.bio && (
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2">
                    {formatTikTokUsernameForDisplay(userB.username)}
                  </div>
                  <p className="text-slate-600">{userB.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

