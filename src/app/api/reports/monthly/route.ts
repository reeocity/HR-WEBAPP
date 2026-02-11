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
        salary: salary ? Number(salary.monthlySalary) : 0,
      };
    })
  );

  // Fetch absence records with staff details
  const absenceRecords = await prisma.absenceLog.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    include: {
      staff: { select: { id: true, fullName: true, staffId: true } },
    },
    orderBy: { date: "asc" },
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

  // Calculate lateness summary (group by staff)
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
    latenessSummary: Object.values(latenessSummary),
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
  });
}