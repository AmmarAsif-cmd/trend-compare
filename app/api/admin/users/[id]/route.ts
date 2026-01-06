import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/admin/users/[id]
 * Admin endpoint to delete a user and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user and all related data in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete user-related records
      await tx.comparisonHistory.deleteMany({ where: { userId: id } });
      await tx.savedComparison.deleteMany({ where: { userId: id } });
      await tx.trendAlert.deleteMany({ where: { userId: id } });
      await tx.exportHistory.deleteMany({ where: { userId: id } });
      await tx.pdfJob.deleteMany({ where: { userId: id } });
      await tx.comparisonSnapshot.deleteMany({ where: { userId: id } });
      
      // Delete subscriptions
      await tx.subscription.deleteMany({ where: { userId: id } });
      
      // Delete NextAuth sessions and accounts
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.account.deleteMany({ where: { userId: id } });
      
      // Finally, delete the user
      await tx.user.delete({ where: { id } });
    });

    console.log(`[Admin] User deleted: ${user.email} (${id})`);

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been deleted successfully`,
    });
  } catch (error: any) {
    console.error("[Admin Delete User] Error:", error);
    
    // Handle foreign key constraint errors
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete user due to existing relationships. Please contact support." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}

