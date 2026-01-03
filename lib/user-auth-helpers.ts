import { auth } from "@/lib/auth-user";
import { prisma } from "@/lib/db";

/**
 * Get the current authenticated user session
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user) {
      console.log('[getCurrentUser] No session or user found');
      return null;
    }
    
    // Ensure user has id property
    const user = session.user as any;
    if (!user.id) {
      console.error('[getCurrentUser] User session missing id. Session:', {
        hasUser: !!session.user,
        userKeys: Object.keys(user),
        tokenId: (session as any).token?.id,
      });
      
      // Try to get user from database if we have email
      if (user.email) {
        console.log('[getCurrentUser] Attempting to fetch user from DB by email:', user.email);
        const dbUser = await prisma.user.findUnique({ 
          where: { email: user.email },
          select: { id: true, email: true, name: true, subscriptionTier: true }
        });
        if (dbUser) {
          console.log('[getCurrentUser] Found user in DB, returning with id:', dbUser.id);
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            subscriptionTier: dbUser.subscriptionTier,
          };
        }
      }
      
      return null;
    }
    
    console.log('[getCurrentUser] User found with id:', user.id);
    return user;
  } catch (error) {
    console.error('[getCurrentUser] Error getting user session:', error);
    return null;
  }
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
 */
export async function canAccessPremium(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const userId = (user as any).id;
  if (!userId) {
    console.error('[canAccessPremium] User object missing id:', user);
    return false;
  }
  
  const fullUser = await getUserWithSubscription(userId);

  if (!fullUser) return false;

  // Check if user is premium tier
  if (fullUser.subscriptionTier === "premium") return true;

  // Check if user has active subscription in trial
  const activeSub = fullUser.subscriptions[0];
  if (activeSub && activeSub.status === "trialing") return true;

  return false;
}
