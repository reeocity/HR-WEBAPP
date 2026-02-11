import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ staffId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { staffId } = await context.params;
  const url = new URL(request.url);
  const month = Number(url.searchParams.get("month"));
  const year = Number(url.searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ message: "Month and year are required." }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, staffId: true, fullName: true, department: true, position: true, status: true, lastActiveDate: true, resumptionDate: true },
  });
  if (!staff) return NextResponse.json({ message: "Staff not found." }, { status: 404 });

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const salary = await prisma.salaryHistory.findFirst({
    where: { staffId, effectiveFrom: { lte: end } },
    orderBy: { effectiveFrom: "desc" },
  });

  const [lateness, absence, queries, manual, mealTickets, allowances] = await Promise.all([
    prisma.latenessLog.findMany({ where: { staffId, date: { gte: start, lt: end } }, orderBy: { date: "asc" } }),
    prisma.absenceLog.findMany({ where: { staffId, date: { gte: start, lt: end } }, orderBy: { date: "asc" } }),
    prisma.queryLog.findMany({ where: { staffId, date: { gte: start, lt: end } }, orderBy: { date: "asc" } }),
    prisma.manualDeduction.findMany({ where: { staffId, month, year }, orderBy: { createdAt: "asc" } }),
    prisma.staffMealTicket.findMany({ where: { staffId, date: { gte: start, lt: end } } }),
    prisma.monthlyAllowance.findMany({ where: { staffId, month, year }, orderBy: { createdAt: "asc" } }),
  ]);

  let grossSalary = Number(salary?.monthlySalary ?? 0);
  const dailySalary = grossSalary / 31;

  if (staff.status === "INACTIVE" && staff.lastActiveDate) {
    const lastActive = new Date(staff.lastActiveDate);
    const activeDays = lastActive < start ? 0 : lastActive >= end ? 31 : lastActive.getDate();
    grossSalary = (grossSalary / 31) * activeDays;
  }

  const permissionDays = absence.filter((a) => a.type === "PERMISSION").length;
  const noPermissionDays = absence.filter((a) => a.type === "NO_PERMISSION").length;
  const absenceDeduction = (permissionDays * dailySalary) + (noPermissionDays * dailySalary * 2);

  const lateDays = lateness.length;
  let latenessDeductionDays = 0;
  if (lateDays <= 2) latenessDeductionDays = 0;
  else if (lateDays <= 4) latenessDeductionDays = 1;
  else if (lateDays <= 7) latenessDeductionDays = 2;
  else if (lateDays <= 10) latenessDeductionDays = 3;
  else if (lateDays <= 15) latenessDeductionDays = 4;
  else latenessDeductionDays = 5;

  const latenessDeduction = latenessDeductionDays * dailySalary;

  const manualDeductionsTotal = manual.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const allowancesTotal = allowances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const querySurchargeTotal = queries.reduce((sum, q) => sum + Number(q.surchargeAmount || 0), 0);
  const queryPenaltyDaysTotal = queries.reduce((sum, q) => sum + Number(q.penaltyDays || 0), 0);
  const queryPenaltyDeduction = queryPenaltyDaysTotal * dailySalary;

  const mealTicketTotal = mealTickets.reduce((sum, m) => sum + Number(m.amount || 0), 0);

  // New staff statutory charge: 25% for first 2 months
  let newStaffStatutory = 0;
  const resumptionDate = new Date(staff.resumptionDate);
  const currentMonthStart = new Date(year, month - 1, 1);
  const monthsDiff = (currentMonthStart.getFullYear() - resumptionDate.getFullYear()) * 12 + (currentMonthStart.getMonth() - resumptionDate.getMonth());
  
  // Apply 25% charge if staff is in their first or second month of employment
  if (monthsDiff <= 1) {
    newStaffStatutory = grossSalary * 0.25;
  }

  // Default charges applied to all staff (but not to new staff in first 2 months)
  const bankCharges = 50;
  const waterRate = 150;
  const oldStaffStatutory = (monthsDiff > 1) ? (grossSalary >= 60000 ? 1000 : 500) : 0;
  const defaultChargesTotal = bankCharges + waterRate + oldStaffStatutory;

  const netSalary =
    grossSalary -
    absenceDeduction -
    latenessDeduction -
    manualDeductionsTotal -
    querySurchargeTotal -
    queryPenaltyDeduction -
    mealTicketTotal -
    defaultChargesTotal -
    newStaffStatutory +
    allowancesTotal;

  return NextResponse.json({
    staff: {
      id: staff.id,
      staffId: staff.staffId,
      fullName: staff.fullName,
      department: staff.department,
      position: staff.position,
      status: staff.status,
      lastActiveDate: staff.lastActiveDate ? staff.lastActiveDate.toISOString().slice(0, 10) : null,
    },
    salary: salary ? { monthlySalary: salary.monthlySalary.toString(), effectiveFrom: salary.effectiveFrom.toISOString().slice(0, 10) } : null,
    lateness: lateness.map((l) => ({
      id: l.id,
      date: l.date.toISOString().slice(0, 10),
      arrivalTime: l.arrivalTime ?? null,
    })),
    absence: absence.map((a) => ({ id: a.id, date: a.date.toISOString().slice(0, 10), type: a.type })),
    queries: queries.map((q) => ({
      id: q.id,
      date: q.date.toISOString().slice(0, 10),
      reason: q.reason,
      surchargeAmount: q.surchargeAmount?.toString() ?? null,
      penaltyDays: q.penaltyDays ?? null,
    })),
    manual: manual.map((m) => ({
      id: m.id,
      category: m.category,
      amount: m.amount.toString(),
      note: m.note,
    })),
    allowances: allowances.map((a) => ({
      id: a.id,
      reason: a.reason,
      amount: a.amount.toString(),
    })),
    mealTickets: mealTickets.map((m) => ({ id: m.id, date: m.date.toISOString().slice(0, 10), amount: m.amount.toString() })),
    totals: {
      grossSalary,
      dailySalary,
      absenceDeduction,
      latenessDeductionDays,
      latenessDeduction,
      manualDeductionsTotal,
      allowancesTotal,
      querySurchargeTotal,
      queryPenaltyDaysTotal,
      queryPenaltyDeduction,
      mealTicketTotal,
      bankCharges,
      waterRate,
      oldStaffStatutory,
      defaultChargesTotal,
      newStaffStatutory,
      netSalary,
    },
  });
}