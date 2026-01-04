import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth-helpers";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (user as any).id;
    const session = await createCheckoutSession(userId, user.email);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("[Checkout] Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
