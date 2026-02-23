import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/leave-schedule/auto-generate
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { year } = body;

    if (!year) {
      return NextResponse.json(
        { error: "Year is required" },
        { status: 400 }
      );
    }

    // Get all staff (not INACTIVE)
    const allStaff = await prisma.staff.findMany({
      where: {
        NOT: {
          status: "INACTIVE",
        },
      },
      select: {
        id: true,
        staffId: true,
        fullName: true,
        department: true,
        resumptionDate: true,
      },
      orderBy: { department: "asc" },
    });

    console.log(`Total staff found: ${allStaff.length}`);

    // Filter staff with > 1 year tenure
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const eligibleStaff = allStaff.filter((staff) => {
      const resumptionDate = new Date(staff.resumptionDate);
      return resumptionDate <= oneYearAgo;
    });

    console.log(`Eligible staff (>1 year): ${eligibleStaff.length}`);

    if (eligibleStaff.length === 0) {
      return NextResponse.json(
        { error: "No eligible staff found. Staff must have more than 1 year tenure." },
        { status: 400 }
      );
    }

    // Check for existing schedules for this year
    const existingCount = await prisma.leaveSchedule.count({
      where: { year },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        { error: `${existingCount} leave schedule(s) already exist for ${year}. Please delete them first or use a different year.` },
        { status: 400 }
      );
    }

    // Group staff by department
    const deptGroups: Record<string, typeof eligibleStaff> = {};
    eligibleStaff.forEach((staff) => {
      if (!deptGroups[staff.department]) {
        deptGroups[staff.department] = [];
      }
      deptGroups[staff.department].push(staff);
    });

    const schedules = [];
    const monthCounts: Record<number, number> = {}; // Track total per month
    const monthDeptCounts: Record<string, number> = {}; // Track per dept per month

    // Distribute staff across Jan-Nov respecting constraints
    for (const [dept, staffList] of Object.entries(deptGroups)) {
      for (const staff of staffList) {
        let assigned = false;

        // Try to find a suitable month (Jan-Nov)
        for (let attempt = 0; attempt < 11; attempt++) {
          const testMonth = ((attempt) % 11) + 1;
          const deptMonthKey = `${dept}-${testMonth}`;

          const totalInMonth = monthCounts[testMonth] || 0;
          const deptInMonth = monthDeptCounts[deptMonthKey] || 0;

          // Check constraints: max 10 per month, max 2 per dept per month
          if (totalInMonth < 10 && deptInMonth < 2) {
            // Assign leave to this month
            const startDay = 1 + (totalInMonth * 2); // Spread out start dates
            const endDay = Math.min(startDay + 13, 28); // 14 days leave

            schedules.push({
              staffId: staff.id,
              year,
              month: testMonth,
              startDate: new Date(year, testMonth - 1, startDay),
              endDate: new Date(year, testMonth - 1, endDay),
              days: 14,
              notes: "Auto-generated leave schedule",
              createdById: session.userId,
            });

            monthCounts[testMonth] = totalInMonth + 1;
            monthDeptCounts[deptMonthKey] = deptInMonth + 1;
            assigned = true;
            break;
          }
        }

        if (!assigned) {
          console.warn(`Could not assign leave for ${staff.fullName} - constraints full`);
        }
      }
    }

    console.log(`Creating ${schedules.length} leave schedules`);

    // Create all schedules
    const result = await prisma.leaveSchedule.createMany({
      data: schedules,
    });

    return NextResponse.json({
      success: true,
      created: result.count,
      message: `Successfully created ${result.count} leave schedules for ${year}`,
    });
  } catch (error) {
    console.error("Error auto-generating leave schedules:", error);
    return NextResponse.json(
      { error: "Failed to auto-generate leave schedules" },
      { status: 500 }
    );
  }
}
