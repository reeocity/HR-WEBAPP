import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { month, year } = body;

  if (!month || !year) {
    return NextResponse.json({ message: "Month and year are required." }, { status: 400 });
  }

  // Check if payroll run already exists for this month
  const existing = await prisma.payrollRun.findFirst({
    where: { month, year },
  });

  if (existing) {
    return NextResponse.json(
      { message: "Payroll run already exists for this month/year." },
      { status: 400 }
    );
  }

  // Get all ACTIVE staff
  const staff = await prisma.staff.findMany({
    where: { status: "ACTIVE" },
    include: {
      salaryHistory: {
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
  });

  if (staff.length === 0) {
    return NextResponse.json(
      { message: "No active staff to generate payroll for." },
      { status: 400 }
    );
  }

  // Calculate payslips for each staff member
  let totalGrossSalary = 0;
  let totalDeductions = 0;
  let totalNetPay = 0;

  for (const s of staff) {
    // Get current salary
    const salaryRecord = s.salaryHistory[0];
    const salary = salaryRecord ? Number(salaryRecord.monthlySalary) : 0;

    if (salary === 0) continue;

    // Fetch payslip data to get all deductions and allowances
    const payslipRes = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payslips/${s.id}?month=${month}&year=${year}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!payslipRes.ok) continue;

    const payslipData = await payslipRes.json();
    const gross = payslipData.totals?.grossSalary || salary;
    const deductions = payslipData.totals?.totalDeductions || 0;
    const net = gross - deductions;

    totalGrossSalary += gross;
    totalDeductions += deductions;
    totalNetPay += net;
  }

  // Create PayrollRun record
  const payrollRun = await prisma.payrollRun.create({
    data: {
      month,
      year,
      status: "DRAFT",
      totalStaff: staff.length,
      totalGrossSalary,
      totalDeductions,
      totalNetPay,
      createdById: session.userId,
    },
  });

  return NextResponse.json({
    message: "Payroll run generated successfully.",
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
  });
}
