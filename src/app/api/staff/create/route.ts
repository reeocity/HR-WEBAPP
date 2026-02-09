import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.staffId || !body.fullName || !body.department || !body.position || !body.resumptionDate) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  const staff = await prisma.staff.create({
    data: {
      staffId: body.staffId,
      fullName: body.fullName,
      department: body.department,
      position: body.position,
      status: body.status ?? "ACTIVE",
      phone: body.phone ?? null,
      resumptionDate: new Date(body.resumptionDate),
      createdById: session.userId,
    },
  });

  return NextResponse.json({ staff });
}