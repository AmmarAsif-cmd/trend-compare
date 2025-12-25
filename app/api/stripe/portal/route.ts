import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth-helpers";
import { createCustomerPortalSession } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (user as any).id;

    // Get user's Stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!dbUser?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    const session = await createCustomerPortalSession(dbUser.stripeCustomerId);

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("[Portal] Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
