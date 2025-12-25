import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserWithSubscription } from "@/lib/user-auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (user as any).id;

    // Get full user details with subscription
    const fullUser = await getUserWithSubscription(userId);

    if (!fullUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get active subscription if exists
    const activeSubscription = fullUser.subscriptions.find(
      (sub: any) => sub.status === "active" || sub.status === "trialing"
    );

    return NextResponse.json({
      success: true,
      user: {
        email: fullUser.email,
        name: fullUser.name,
        subscriptionTier: fullUser.subscriptionTier,
        subscription: activeSubscription
          ? {
              status: activeSubscription.status,
              currentPeriodEnd: activeSubscription.currentPeriodEnd,
              cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[User Me] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
