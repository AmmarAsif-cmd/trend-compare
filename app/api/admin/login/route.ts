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

    // Debug logging (remove in production)
    const hasPasswordHash = !!process.env.ADMIN_PASSWORD_HASH;
    const hasPasswordPlain = !!process.env.ADMIN_PASSWORD;
    console.log('[Login API] Password check:', {
      hasPasswordHash,
      hasPasswordPlain,
      passwordLength: password?.length,
      hashLength: process.env.ADMIN_PASSWORD_HASH?.length,
    });

    const isValid = verifyPassword(password);

    if (!isValid) {
      // Record failed attempt
      recordFailedAttempt(clientIP);

      const attemptsLeft = 5 - (getRemainingLockoutTime(clientIP) > 0 ? 5 : 1);

      // More helpful error message
      let errorMessage = "Invalid password";
      if (!hasPasswordHash && !hasPasswordPlain) {
        errorMessage = "Admin password not configured. Please set ADMIN_PASSWORD in .env.local";
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
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
