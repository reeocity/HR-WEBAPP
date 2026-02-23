import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/leave-schedule/eligible-staff
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active staff (not INACTIVE)
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
        position: true,
        resumptionDate: true,
        status: true,
      },
      orderBy: { fullName: "asc" },
    });

    console.log(`Found ${allStaff.length} total staff`);

    // Filter staff with > 1 year tenure
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const eligibleStaff = allStaff.filter((staff) => {
      const resumptionDate = new Date(staff.resumptionDate);
      return resumptionDate <= oneYearAgo;
    });

    console.log(`${eligibleStaff.length} eligible for leave (>1 year tenure)`);

    // Convert dates to strings for JSON serialization
    const serializedStaff = eligibleStaff.map(staff => ({
      ...staff,
      resumptionDate: staff.resumptionDate.toISOString(),
    }));

    return NextResponse.json({ eligibleStaff: serializedStaff });
  } catch (error) {
    console.error("Error fetching eligible staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch eligible staff" },
      { status: 500 }
    );
  }
}
