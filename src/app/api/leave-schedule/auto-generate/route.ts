import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Public holidays for Nigeria in 2026
const PUBLIC_HOLIDAYS_2026 = [
  { date: new Date(2026, 2, 20), name: "Eid El-Fitr" },
  { date: new Date(2026, 2, 21), name: "Eid El-Fitr Holiday" },
  { date: new Date(2026, 3, 3), name: "Good Friday" },
  { date: new Date(2026, 3, 6), name: "Easter Monday" },
  { date: new Date(2026, 4, 1), name: "Workers' Day" },
  { date: new Date(2026, 4, 27), name: "Id el Kabir" },
  { date: new Date(2026, 4, 28), name: "Id el Kabir additional holiday" },
  { date: new Date(2026, 5, 12), name: "Democracy Day" },
  { date: new Date(2026, 7, 26), name: "Id el Maulud" },
  { date: new Date(2026, 8, 1), name: "National Day" },
  { date: new Date(2026, 11, 25), name: "Christmas Day" },
  { date: new Date(2026, 11, 26), name: "Boxing Day" },
];

// Check if a date is within restricted period of any holiday (2 days before or after)
function isNearHoliday(date: Date): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  for (const holiday of PUBLIC_HOLIDAYS_2026) {
    const holidayDate = new Date(holiday.date);
    holidayDate.setHours(0, 0, 0, 0);

    // Check if within 2 days before to 2 days after
    const daysBefore = Math.floor((holidayDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysBefore >= -2 && daysBefore <= 2) {
      return true;
    }
  }
  return false;
}

// Find valid leave dates for a given month
function findValidLeaveDates(year: number, month: number): { startDate: Date; endDate: Date } | null {
  // Try to find a 14-day period that doesn't violate holiday restrictions
  const monthEnd = new Date(year, month, 0);

  // Try different start dates within the month
  for (let startDay = 1; startDay <= 15; startDay++) {
    const startDate = new Date(year, month - 1, startDay);
    if (startDate > monthEnd) break;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // 14 days total

    // Check if entire period is valid
    let isValid = true;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (isNearHoliday(currentDate)) {
        isValid = false;
        break;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (isValid) {
      return { startDate, endDate };
    }
  }

  return null;
}

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

    // Check for existing schedules for this year (excluding Jan & Feb)
    const existingCount = await prisma.leaveSchedule.count({
      where: {
        year,
        month: { gte: 3 }, // Only count from March onwards
      },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        { error: `Leave schedules already exist for March-November ${year}. Please delete them first.` },
        { status: 400 }
      );
    }

    // Get staff that already have leave schedules for this year (to skip them)
    const staffWithSchedules = await prisma.leaveSchedule.findMany({
      where: { year },
      select: { staffId: true },
    });

    const scheduledStaffIds = new Set(staffWithSchedules.map(s => s.staffId));

    // Filter out staff who already have schedules for this year
    const availableStaff = eligibleStaff.filter(staff => !scheduledStaffIds.has(staff.id));

    if (availableStaff.length === 0) {
      return NextResponse.json(
        { error: `All ${eligibleStaff.length} eligible staff already have leave schedules for ${year}. Please delete some schedules or use a different year.` },
        { status: 400 }
      );
    }

    const schedules = [];
    const monthCounts: Record<number, number> = {}; // Track total per month
    const monthDeptCounts: Record<string, number> = {}; // Track per dept per month

    // Distribute available staff across March-Nov (months 3-11) with 5-7 per month
    for (const [dept, staffList] of Object.entries(
      availableStaff.reduce((acc, staff) => {
        if (!acc[staff.department]) acc[staff.department] = [];
        acc[staff.department].push(staff);
        return acc;
      }, {} as Record<string, typeof availableStaff>)
    )) {
      for (const staff of staffList) {
        let assigned = false;

        // Try to find a suitable month (March-Nov, months 3-11)
        for (let attempt = 0; attempt < 9; attempt++) {
          const testMonth = ((attempt) % 9) + 3;
          const deptMonthKey = `${dept}-${testMonth}`;

          const totalInMonth = monthCounts[testMonth] || 0;
          const deptInMonth = monthDeptCounts[deptMonthKey] || 0;

          // Check constraints: max 7 per month, max 2 per dept per month
          if (totalInMonth < 7 && deptInMonth < 2) {
            // Find valid leave dates considering holidays
            const validDates = findValidLeaveDates(year, testMonth);

            if (validDates) {
              schedules.push({
                staffId: staff.id,
                year,
                month: testMonth,
                startDate: validDates.startDate,
                endDate: validDates.endDate,
                resumptionDate: new Date(validDates.endDate.getTime() + 24 * 60 * 60 * 1000), // Day after leave ends
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
        }

        if (!assigned) {
          console.warn(`Could not assign leave for ${staff.fullName} - constraints full or no valid dates`);
        }
      }
    }

    console.log(`Creating ${schedules.length} leave schedules`);

    // Create all schedules
    const result = await prisma.leaveSchedule.createMany({
      data: schedules,
    });

    const skippedCount = eligibleStaff.length - availableStaff.length;
    const failedCount = availableStaff.length - schedules.length;

    return NextResponse.json({
      success: true,
      created: result.count,
      skipped: skippedCount,
      failed: failedCount,
      message: `Successfully created ${result.count} leave schedules for March-November ${year}. (${skippedCount} staff already have schedules, ${failedCount} could not be assigned due to constraints)`,
    });
  } catch (error) {
    console.error("Error auto-generating leave schedules:", error);
    return NextResponse.json(
      { error: "Failed to auto-generate leave schedules" },
      { status: 500 }
    );
  }
}
