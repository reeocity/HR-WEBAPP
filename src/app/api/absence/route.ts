import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const logs = await prisma.absenceLog.findMany({
    orderBy: { date: "desc" },
    take: 200,
    include: {
      staff: { select: { id: true, staffId: true, fullName: true, department: true, position: true } },
    },
  });

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      date: l.date.toISOString().slice(0, 10),
      type: l.type,
      staff: l.staff,
    })),
  });
}