import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findMany({
    select: { department: true, position: true },
  });

  const departments = Array.from(new Set(staff.map((s) => s.department).filter(Boolean))).sort();
  const positions = Array.from(new Set(staff.map((s) => s.position).filter(Boolean))).sort();

  return NextResponse.json({ departments, positions });
}