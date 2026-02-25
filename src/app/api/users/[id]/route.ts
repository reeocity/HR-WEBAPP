import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// DELETE - Remove admin user
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;

    // Prevent self-deletion
    if (id === session.userId) {
      return NextResponse.json({ message: "You cannot delete your own account." }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Check if this is the last admin
    const userCount = await prisma.user.count();
    if (userCount <= 1) {
      return NextResponse.json({ message: "Cannot delete the last admin user." }, { status: 400 });
    }

    // Delete the user
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Admin user deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete user." }, { status: 500 });
  }
}
