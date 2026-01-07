/**
 * TikTok Feed Component
 * Displays a feed of TikTok comparisons
 */

import { prisma } from "@/lib/db";
import TikTokComparisonCard from "./TikTokComparisonCard";

export default async function TikTokFeed() {
  // Fetch recent TikTok comparisons from database
  const comparisons = await prisma.tikTokComparison.findMany({
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      userA: true,
      userB: true,
    },
  });

  // If no comparisons exist, show empty state
  if (comparisons.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            No Comparisons Yet
          </h2>
          <p className="text-slate-600 mb-6">
            Be the first to compare TikTok creators! Use the form above to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Recent Comparisons</h2>
          <p className="text-slate-600 mt-1">
            Browse the latest TikTok creator comparisons
          </p>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparisons.map((comparison) => (
          <TikTokComparisonCard
            key={comparison.id}
            comparison={{
              id: comparison.id,
              slug: comparison.slug,
              userA: {
                username: comparison.userA.username,
                displayName: comparison.userA.displayName,
                avatarUrl: comparison.userA.avatarUrl,
                followerCount: comparison.userA.followerCount,
                verified: comparison.userA.verified,
              },
              userB: {
                username: comparison.userB.username,
                displayName: comparison.userB.displayName,
                avatarUrl: comparison.userB.avatarUrl,
                followerCount: comparison.userB.followerCount,
                verified: comparison.userB.verified,
              },
              userAScore: comparison.userAScore,
              userBScore: comparison.userBScore,
              winner: comparison.winner,
              margin: comparison.margin,
              viewCount: comparison.viewCount,
              likeCount: comparison.likeCount,
              shareCount: comparison.shareCount,
              createdAt: comparison.createdAt,
            }}
          />
        ))}
      </div>

      {/* Load More (Future: Implement pagination) */}
      {comparisons.length >= 20 && (
        <div className="text-center py-8">
          <p className="text-slate-600">
            Showing 20 most recent comparisons
          </p>
        </div>
      )}
    </div>
  );
}

