import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "Unknown";
}

// GET /api/leave-schedule?year=2024
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const schedules = await prisma.leaveSchedule.findMany({
      where: { year },
      include: {
        staff: {
          select: {
            fullName: true,
            staffId: true,
            department: true,
          },
        },
      },
      orderBy: [{ month: "asc" }, { startDate: "asc" }],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching leave schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave schedules" },
      { status: 500 }
    );
  }
}

// POST /api/leave-schedule
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { staffId, year, month, startDate, endDate, days, notes } = body;

    // Validate required fields
    if (!staffId || !year || !month || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate month is between 1-11
    if (month < 1 || month > 11) {
      return NextResponse.json(
        { error: "Leave can only be scheduled from January to November" },
        { status: 400 }
      );
    }

    // Check if staff exists and has > 1 year tenure
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const resumptionDate = new Date(staff.resumptionDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (resumptionDate > oneYearAgo) {
      return NextResponse.json(
        { error: "Staff must have more than 1 year tenure to be eligible for leave" },
        { status: 400 }
      );
    }

    // Check if staff already has a leave schedule for this year
    const existingSchedule = await prisma.leaveSchedule.findUnique({
      where: {
        staffId_year_unique: {
          staffId,
          year,
        },
      },
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: "Staff already has a leave schedule for this year. Please edit the existing one." },
        { status: 400 }
      );
    }

    // Check if more than 10 people are scheduled for this month
    const totalInMonth = await prisma.leaveSchedule.count({
      where: {
        year,
        month,
      },
    });

    if (totalInMonth >= 10) {
      return NextResponse.json(
        { error: `Maximum of 10 people can go on leave in ${getMonthName(month)}. Currently ${totalInMonth} scheduled.` },
        { status: 400 }
      );
    }

    // Check if 2 or more people from the same department are scheduled for this month
    const deptInMonth = await prisma.leaveSchedule.count({
      where: {
        year,
        month,
        staff: {
          department: staff.department,
        },
      },
    });

    if (deptInMonth >= 2) {
      return NextResponse.json(
        { error: `Maximum of 2 people from ${staff.department} can go on leave in ${getMonthName(month)}. Currently ${deptInMonth} scheduled.` },
        { status: 400 }
      );
    }

    // Create leave schedule
    const leaveSchedule = await prisma.leaveSchedule.create({
      data: {
        staffId,
        year,
        month,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: days || 0,
        notes: notes || null,
        createdById: session.userId,
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

    return NextResponse.json({ leaveSchedule }, { status: 201 });
  } catch (error) {
    console.error("Error creating leave schedule:", error);
    return NextResponse.json(
      { error: "Failed to create leave schedule" },
      { status: 500 }
    );
  }
}
