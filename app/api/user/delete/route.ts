import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth-helpers";
import { prisma } from "@/lib/db";
import { signOut } from "next-auth/react";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const userId = (user as any).id;

    // Delete user and related data in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete related records
      await tx.comparisonHistory.deleteMany({ where: { userId } });
      await tx.savedComparison.deleteMany({ where: { userId } });
      await tx.trendAlert.deleteMany({ where: { userId } });
      
      // Delete NextAuth sessions and accounts
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      
      // Delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error: any) {
    console.error("[User Delete] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}

