"use client";

import Link from "next/link";
import TikTokProfileImage from "./TikTokProfileImage";
import { formatTikTokUsernameForDisplay } from "@/lib/tiktok-username-normalizer";
import { Eye, Heart, Share2, Trophy } from "lucide-react";

interface TikTokUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  verified: boolean;
}

interface TikTokComparisonCardProps {
  comparison: {
    id: string;
    slug: string;
    userA: TikTokUser;
    userB: TikTokUser;
    userAScore: number;
    userBScore: number;
    winner: string;
    margin: number;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    createdAt: Date;
  };
}

export default function TikTokComparisonCard({ comparison }: TikTokComparisonCardProps) {
  const { userA, userB, userAScore, userBScore, winner, margin, viewCount, likeCount, slug } = comparison;
  
  const winnerIsA = winner === userA.username;
  const winnerUser = winnerIsA ? userA : userB;
  const loserUser = winnerIsA ? userB : userA;
  const winnerScore = winnerIsA ? userAScore : userBScore;
  const loserScore = winnerIsA ? userBScore : userAScore;

  return (
    <Link
      href={`/tiktok/compare/${slug}`}
      className="block bg-white rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 overflow-hidden group"
    >
      {/* Header with VS */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-center">
            <TikTokProfileImage
              avatarUrl={userA.avatarUrl}
              username={userA.username}
              displayName={userA.displayName}
              size="small"
              showVerified
              verified={userA.verified}
              className="mx-auto mb-2"
            />
            <div className="font-semibold text-slate-900 text-sm">
              {formatTikTokUsernameForDisplay(userA.username)}
            </div>
            {userA.displayName && (
              <div className="text-xs text-slate-600 truncate">
                {userA.displayName}
              </div>
            )}
          </div>

          <div className="text-2xl font-bold text-slate-400">VS</div>

          <div className="flex-1 text-center">
            <TikTokProfileImage
              avatarUrl={userB.avatarUrl}
              username={userB.username}
              displayName={userB.displayName}
              size="small"
              showVerified
              verified={userB.verified}
              className="mx-auto mb-2"
            />
            <div className="font-semibold text-slate-900 text-sm">
              {formatTikTokUsernameForDisplay(userB.username)}
            </div>
            {userB.displayName && (
              <div className="text-xs text-slate-600 truncate">
                {userB.displayName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Score</div>
            <div className="text-2xl font-bold text-slate-900">{Math.round(winnerScore)}</div>
          </div>
          <div className="flex items-center gap-2 text-yellow-500">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold text-sm">Winner</span>
          </div>
          <div className="flex-1 text-right">
            <div className="text-xs text-slate-500 mb-1">Score</div>
            <div className="text-2xl font-bold text-slate-400">{Math.round(loserScore)}</div>
          </div>
        </div>

        {/* Winner Badge */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-3 mb-4 border border-yellow-200">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="font-semibold text-sm text-yellow-900">
              {formatTikTokUsernameForDisplay(winnerUser.username)} wins by {Math.round(margin)} points
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <Eye className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-slate-900">{viewCount.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Views</div>
          </div>
          <div className="text-center">
            <Heart className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-slate-900">{likeCount.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Likes</div>
          </div>
          <div className="text-center">
            <Share2 className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-slate-900">{comparison.shareCount.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Shares</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

