import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSession,
  getClientIP,
  isRateLimited,
  recordFailedAttempt,
  clearLoginAttempts,
  getRemainingLockoutTime,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      const remainingMinutes = getRemainingLockoutTime(clientIP);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
          locked: true,
          remainingMinutes,
        },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const isValid = verifyPassword(password);

    if (!isValid) {
      // Record failed attempt
      recordFailedAttempt(clientIP);

      const attemptsLeft = 5 - (getRemainingLockoutTime(clientIP) > 0 ? 5 : 1);

      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
          attemptsLeft: Math.max(0, attemptsLeft),
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    clearLoginAttempts(clientIP);

    // Create session
    await createSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Login API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
