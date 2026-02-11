import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();

  if (!body.salary || body.salary <= 0) {
    return NextResponse.json({ message: "Invalid salary amount." }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) return NextResponse.json({ message: "Staff not found." }, { status: 404 });

  // Create new salary history record
  const salaryHistory = await prisma.salaryHistory.create({
    data: {
      staffId: id,
      monthlySalary: body.salary,
      effectiveFrom: new Date(),
    },
  });

  return NextResponse.json({ salaryHistory });
}
