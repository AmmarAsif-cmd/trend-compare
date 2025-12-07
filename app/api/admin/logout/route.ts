import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Logout API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
