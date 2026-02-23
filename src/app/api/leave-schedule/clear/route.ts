import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// DELETE /api/leave-schedule/clear?year=2026
export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "");

    if (!year) {
      return NextResponse.json(
        { error: "Year is required" },
        { status: 400 }
      );
    }

    // Delete leave schedules for March-November only (keep Jan-Feb for manual entry)
    const result = await prisma.leaveSchedule.deleteMany({
      where: {
        year,
        month: { gte: 3 }, // Only delete March onwards
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} leave schedule(s) for March-November ${year} (January-February preserved)`,
    });
  } catch (error) {
    console.error("Error clearing leave schedules:", error);
    return NextResponse.json(
      { error: "Failed to clear leave schedules" },
      { status: 500 }
    );
  }
}
