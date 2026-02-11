import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(_: Request, context: { params: Promise<{ runId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { runId } = await context.params;

  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: runId },
  });

  if (!payrollRun) {
    return NextResponse.json({ message: "Payroll run not found." }, { status: 404 });
  }

  if (payrollRun.status !== "DRAFT") {
    return NextResponse.json(
      { message: "Only DRAFT payroll runs can be approved." },
      { status: 400 }
    );
  }

  const updated = await prisma.payrollRun.update({
    where: { id: runId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: session.userId,
    },
  });

  return NextResponse.json({
    message: "Payroll approved successfully.",
    payrollRun: {
      id: updated.id,
      month: updated.month,
      year: updated.year,
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString() || null,
    },
  });
}
