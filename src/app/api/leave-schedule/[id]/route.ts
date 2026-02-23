import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "Unknown";
}

// PUT /api/leave-schedule/[id]
export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { month, startDate, endDate, days, notes } = body;

    // Validate month is between 1-11
    if (month && (month < 1 || month > 11)) {
      return NextResponse.json(
        { error: "Leave can only be scheduled from January to November" },
        { status: 400 }
      );
    }

    // Check if leave schedule exists
    const existingSchedule = await prisma.leaveSchedule.findUnique({
      where: { id },
      include: {
        staff: true,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Leave schedule not found" },
        { status: 404 }
      );
    }

    // If month is changing, validate the new month constraints
    if (month && month !== existingSchedule.month) {
      // Check if more than 10 people are scheduled for the new month
      const totalInMonth = await prisma.leaveSchedule.count({
        where: {
          year: existingSchedule.year,
          month,
          id: { not: id }, // Exclude current schedule
        },
      });

      if (totalInMonth >= 10) {
        return NextResponse.json(
          { error: `Maximum of 10 people can go on leave in ${getMonthName(month)}. Currently ${totalInMonth} scheduled.` },
          { status: 400 }
        );
      }

      // Check if 2 or more people from the same department are scheduled for the new month
      const deptInMonth = await prisma.leaveSchedule.count({
        where: {
          year: existingSchedule.year,
          month,
          id: { not: id }, // Exclude current schedule
          staff: {
            department: existingSchedule.staff.department,
          },
        },
      });

      if (deptInMonth >= 2) {
        return NextResponse.json(
          { error: `Maximum of 2 people from ${existingSchedule.staff.department} can go on leave in ${getMonthName(month)}. Currently ${deptInMonth} scheduled.` },
          { status: 400 }
        );
      }
    }

    // Update leave schedule
    const updatedSchedule = await prisma.leaveSchedule.update({
      where: { id },
      data: {
        month: month !== undefined ? month : existingSchedule.month,
        startDate: startDate ? new Date(startDate) : existingSchedule.startDate,
        endDate: endDate ? new Date(endDate) : existingSchedule.endDate,
        days: days !== undefined ? days : existingSchedule.days,
        notes: notes !== undefined ? notes : existingSchedule.notes,
      },
      include: {
        staff: {
          select: {
            fullName: true,
            staffId: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({ leaveSchedule: updatedSchedule });
  } catch (error) {
    console.error("Error updating leave schedule:", error);
    return NextResponse.json(
      { error: "Failed to update leave schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/leave-schedule/[id]
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if leave schedule exists
    const existingSchedule = await prisma.leaveSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Leave schedule not found" },
        { status: 404 }
      );
    }

    // Delete leave schedule
    await prisma.leaveSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Leave schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete leave schedule" },
      { status: 500 }
    );
  }
}
