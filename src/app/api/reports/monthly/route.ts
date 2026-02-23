import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const month = Number(url.searchParams.get("month"));
  const year = Number(url.searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ message: "Month and year are required." }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  // Fetch new staff hired in this month with their salary
  const newStaffList = await prisma.staff.findMany({
    where: {
      resumptionDate: { gte: start, lt: end },
    },
    orderBy: { resumptionDate: "asc" },
  });

  // Get salary for each new staff
  const newStaffWithSalary = await Promise.all(
    newStaffList.map(async (s) => {
      const salary = await prisma.salaryHistory.findFirst({
        where: { staffId: s.id },
        orderBy: { effectiveFrom: "desc" },
      });
      return {
        id: s.id,
        staffId: s.staffId,
        fullName: s.fullName,
        department: s.department,
        position: s.position,
        resumptionDate: s.resumptionDate.toISOString().slice(0, 10),
        accountNumber: s.accountNumber || null,
        salary: salary ? Number(salary.monthlySalary) : 0,
      };
    })
  );

  // Fetch absence records with staff details - SPLIT by type
  const absenceRecords = await prisma.absenceLog.findMany({
    where: {
      date: { gte: start, lt: end },
      type: "NO_PERMISSION",
    },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { date: "asc" },
  });

  // Fetch permission absence records (PERMISSION type)
  const permissionAbsences = await prisma.absenceLog.findMany({
    where: {
      date: { gte: start, lt: end },
      type: "PERMISSION",
    },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true, department: true } },
    },
    orderBy: { date: "asc" },
  });

  // Group permission absences by staff (count days)
  const permissionAbsenceSummary: Record<string, { fullName: string; staffId: string | null; department: string; count: number }> = {};
  permissionAbsences.forEach((absence) => {
    const staffKey = absence.staffId;
    if (!permissionAbsenceSummary[staffKey]) {
      permissionAbsenceSummary[staffKey] = {
        fullName: absence.staff.fullName,
        staffId: absence.staff.staffId,
        department: absence.staff.department,
        count: 0,
      };
    }
    permissionAbsenceSummary[staffKey].count += 1;
  });

  // Fetch lateness records
  const latenessRecords = await prisma.latenessLog.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { date: "asc" },
  });

  // Fetch queries
  const queryRecords = await prisma.queryLog.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { date: "asc" },
  });

  // Fetch meal tickets
  const mealTickets = await prisma.staffMealTicket.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { date: "asc" },
  });

  // Fetch manual deductions
  const manualDeductions = await prisma.manualDeduction.findMany({
    where: { month, year },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Fetch inactive staff
  const inactiveStaff = await prisma.staff.findMany({
    where: { status: "INACTIVE" },
    select: {
      id: true,
      staffId: true,
      fullName: true,
      inactiveReason: true,
      lastActiveDate: true,
    },
    orderBy: { lastActiveDate: "desc" },
  });

  // Fetch allowances
  const allowances = await prisma.monthlyAllowance.findMany({
    where: { month, year },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Fetch all staff to check statutory deductions for those in first/second month
  const allStaff = await prisma.staff.findMany({
    where: {
      status: {
        not: "INACTIVE",
      },
    },
    select: {
      id: true,
      staffId: true,
      fullName: true,
      resumptionDate: true,
    },
  });

  // Get salary for each staff
  const staffWithSalary = await Promise.all(
    allStaff.map(async (s) => {
      const salary = await prisma.salaryHistory.findFirst({
        where: { staffId: s.id },
        orderBy: { effectiveFrom: "desc" },
      });
      return {
        ...s,
        salary: salary ? Number(salary.monthlySalary) : 0,
      };
    })
  );

  // Calculate statutory deductions for staff in 1st or 2nd month
  const statutoryDeductions = staffWithSalary
    .map((staff) => {
      const resumption = new Date(staff.resumptionDate);
      const now = end; // Use end of report month
      const diffMs = now.getTime() - resumption.getTime();
      const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      const employmentMonth = diffMonths + 1;

      // Only include staff in their 1st or 2nd month
      if (employmentMonth < 1 || employmentMonth > 2) {
        return null;
      }

      // 25% statutory deduction
      const statutoryAmount = staff.salary * 0.25;

      return {
        staffName: staff.fullName,
        staffId: staff.staffId,
        amount: statutoryAmount.toString(),
        employmentMonth: employmentMonth,
        note: `${employmentMonth === 1 ? "First month" : "Second month"} statutory deduction (25%)`,
      };
    })
    .filter((s) => s !== null) as Array<{ staffName: string; staffId: string | null; amount: string; employmentMonth: number; note: string }>;

  // Fetch salary upgrades (salary history entries in this month)
  const salaryUpgrades = await prisma.salaryHistory.findMany({
    where: {
      effectiveFrom: {
        gte: start,
        lt: end,
      },
    },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { effectiveFrom: "asc" },
  });

  // Get previous salary for comparison
  const salaryUpgradesWithComparison = await Promise.all(
    salaryUpgrades.map(async (upgrade) => {
      const previousSalary = await prisma.salaryHistory.findFirst({
        where: {
          staffId: upgrade.staffId,
          effectiveFrom: {
            lt: upgrade.effectiveFrom,
          },
        },
        orderBy: { effectiveFrom: "desc" },
      });
      return {
        staffName: upgrade.staff.fullName,
        staffId: upgrade.staff.staffId,
        newSalary: upgrade.monthlySalary.toString(),
        previousSalary: previousSalary ? previousSalary.monthlySalary.toString() : "0",
        effectiveFrom: upgrade.effectiveFrom.toISOString().slice(0, 10),
      };
    })
  );

  // Calculate lateness summary (group by staff) - only include staff with 3+ lateness
  const latenessSummary: Record<string, { fullName: string; staffId: string | null; count: number }> = {};
  latenessRecords.forEach((log) => {
    const staffKey = log.staffId;
    if (!latenessSummary[staffKey]) {
      latenessSummary[staffKey] = {
        fullName: log.staff.fullName,
        staffId: log.staff.staffId,
        count: 0,
      };
    }
    latenessSummary[staffKey].count += 1;
  });

  // Filter to only include staff with 3 or more lateness records (who have penalties)
  const filteredLatenessSummary = Object.values(latenessSummary).filter((l) => l.count >= 3);

  // Calculate meal charges summary
  const mealSummary: Record<string, { fullName: string; staffId: string | null; count: number; total: number }> = {};
  mealTickets.forEach((ticket) => {
    const staffKey = ticket.staffId;
    if (!mealSummary[staffKey]) {
      mealSummary[staffKey] = {
        fullName: ticket.staff.fullName,
        staffId: ticket.staff.staffId,
        count: 0,
        total: 0,
      };
    }
    mealSummary[staffKey].count += 1;
    mealSummary[staffKey].total += Number(ticket.amount || 0);
  });

  return NextResponse.json({
    month,
    year,
    newStaff: newStaffWithSalary,
    absenceRecords: absenceRecords.map((a) => ({
      staffName: a.staff.fullName,
      staffId: a.staff.staffId,
      date: a.date.toISOString().slice(0, 10),
      type: a.type,
    })),
    permissionAbsences: Object.values(permissionAbsenceSummary),
    latenessSummary: filteredLatenessSummary,
    queries: queryRecords.map((q) => ({
      staffName: q.staff.fullName,
      staffId: q.staff.staffId,
      date: q.date.toISOString().slice(0, 10),
      reason: q.reason,
      surcharge: q.surchargeAmount?.toString() ?? "0",
      penaltyDays: q.penaltyDays ?? 0,
    })),
    mealSummary: Object.values(mealSummary),
    manualDeductions: manualDeductions.map((m) => ({
      staffName: m.staff.fullName,
      staffId: m.staff.staffId,
      category: m.category,
      amount: m.amount.toString(),
      note: m.note,
    })),
    inactiveStaff: inactiveStaff.map((s) => ({
      staffId: s.staffId,
      fullName: s.fullName,
      reason: s.inactiveReason,
      lastActiveDate: s.lastActiveDate ? s.lastActiveDate.toISOString().slice(0, 10) : null,
    })),
    allowances: allowances.map((a) => ({
      staffName: a.staff.fullName,
      staffId: a.staff.staffId,
      reason: a.reason,
      amount: a.amount.toString(),
    })),
    statutoryDeductions: statutoryDeductions,
    salaryUpgrades: salaryUpgradesWithComparison,
  });
}