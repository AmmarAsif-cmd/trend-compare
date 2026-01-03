import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth-helpers";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (name !== undefined) {
      // Validate name
      if (typeof name !== "string") {
        return NextResponse.json(
          { error: "Name must be a string" },
          { status: 400 }
        );
      }

      // Trim and validate length
      const trimmedName = name.trim();
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { error: "Name must be 100 characters or less" },
          { status: 400 }
        );
      }

      // Update user name
      const updatedUser = await prisma.user.update({
        where: { id: (user as any).id },
        data: { name: trimmedName || null },
      });

      return NextResponse.json({
        success: true,
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
        },
      });
    }

    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[User Update] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user" },
      { status: 500 }
    );
  }
}


