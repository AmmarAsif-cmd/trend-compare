import { auth } from "@/lib/auth-user";
import { prisma } from "@/lib/db";

/**
 * Get the current authenticated user session
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Check if user has premium subscription
 */
export async function isPremiumUser(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  return (user as any).subscriptionTier === "premium";
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(): Promise<"free" | "premium" | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return (user as any).subscriptionTier as "free" | "premium";
}

/**
 * Get full user details including subscriptions
 */
export async function getUserWithSubscription(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: {
          status: "active",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
}

/**
 * Check if user can access premium features
 * Returns true if user is premium or in trial
 * 
 * TEMPORARY: Always returns true for testing purposes
 * TODO: Remove this bypass before production
 */
export async function canAccessPremium(): Promise<boolean> {
  // TEMPORARY: Always return true for testing
  return true;
  
  // Original code (commented out for testing):
  // const user = await getCurrentUser();
  // if (!user) return false;
  //
  // const userId = (user as any).id;
  // const fullUser = await getUserWithSubscription(userId);
  //
  // if (!fullUser) return false;
  //
  // // Check if user is premium tier
  // if (fullUser.subscriptionTier === "premium") return true;
  //
  // // Check if user has active subscription in trial
  // const activeSub = fullUser.subscriptions[0];
  // if (activeSub && activeSub.status === "trialing") return true;
  //
  // return false;
}
