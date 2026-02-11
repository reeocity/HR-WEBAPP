import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ runId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { runId } = await context.params;

  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: runId },
  });

  if (!payrollRun) {
    return NextResponse.json({ message: "Payroll run not found." }, { status: 404 });
  }

  // Get all ACTIVE staff with their salary
  const staff = await prisma.staff.findMany({
    where: { status: "ACTIVE" },
    include: {
      salaryHistory: {
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  // Build payslips
  const payslips = staff.map((s) => {
    const salaryRecord = s.salaryHistory[0];
    const salary = salaryRecord ? Number(salaryRecord.monthlySalary) : 0;

    // Basic calculation - would need to fetch actual deductions from DB for accurate amounts
    // For now, returning placeholder values
    return {
      staffId: s.staffId || s.id,
      fullName: s.fullName,
      department: s.department,
      position: s.position,
      salary,
      grossTotal: salary, // Would be calculated with allowances
      totalDeductions: 0, // Would be calculated from actual deductions
      netPay: salary,
    };
  });

  return NextResponse.json({
    payrollRun: {
      id: payrollRun.id,
      month: payrollRun.month,
      year: payrollRun.year,
      status: payrollRun.status,
      totalStaff: payrollRun.totalStaff,
      totalGrossSalary: Number(payrollRun.totalGrossSalary),
      totalDeductions: Number(payrollRun.totalDeductions),
      totalNetPay: Number(payrollRun.totalNetPay),
    },
    payslips,
  });
}
