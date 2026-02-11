import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      staffId: true,
      fullName: true,
      department: true,
      position: true,
      status: true,
      inactiveReason: true,
      lastActiveDate: true,
      phone: true,
      resumptionDate: true,
    },
  });

  return NextResponse.json({
    staff: staff.map((s) => ({
      ...s,
      resumptionDate: s.resumptionDate.toISOString().slice(0, 10),
      lastActiveDate: s.lastActiveDate ? s.lastActiveDate.toISOString().slice(0, 10) : null,
    })),
  });
}