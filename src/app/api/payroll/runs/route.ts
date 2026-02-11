import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const runs = await prisma.payrollRun.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    runs: runs.map((run) => ({
      id: run.id,
      month: run.month,
      year: run.year,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
      approvedAt: run.approvedAt ? run.approvedAt.toISOString() : null,
      lockedAt: run.lockedAt ? run.lockedAt.toISOString() : null,
      totalStaff: run.totalStaff,
      totalGrossSalary: Number(run.totalGrossSalary),
      totalDeductions: Number(run.totalDeductions),
      totalNetPay: Number(run.totalNetPay),
    })),
  });
}
