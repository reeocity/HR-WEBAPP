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
      phone: true,
      resumptionDate: true,
    },
  });

  return NextResponse.json({ staff });
}