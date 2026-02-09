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

  const staffList = await prisma.staff.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, staffId: true, fullName: true, department: true, position: true },
  });

  const rows = await Promise.all(
    staffList.map(async (s) => {
      const salary = await prisma.salaryHistory.findFirst({
        where: { staffId: s.id, effectiveFrom: { lte: end } },
        orderBy: { effectiveFrom: "desc" },
      });

      const [lateness, absence, queries, manual] = await Promise.all([
        prisma.latenessLog.findMany({ where: { staffId: s.id, date: { gte: start, lt: end } } }),
        prisma.absenceLog.findMany({ where: { staffId: s.id, date: { gte: start, lt: end } } }),
        prisma.queryLog.findMany({ where: { staffId: s.id, date: { gte: start, lt: end } } }),
        prisma.manualDeduction.findMany({ where: { staffId: s.id, month, year } }),
      ]);

      const grossSalary = Number(salary?.monthlySalary ?? 0);
      const dailySalary = grossSalary / 31;

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
      const querySurchargeTotal = queries.reduce((sum, q) => sum + Number(q.surchargeAmount || 0), 0);
      const queryPenaltyDaysTotal = queries.reduce((sum, q) => sum + Number(q.penaltyDays || 0), 0);
      const queryPenaltyDeduction = queryPenaltyDaysTotal * dailySalary;

      const totalDeductions =
        absenceDeduction +
        latenessDeduction +
        manualDeductionsTotal +
        querySurchargeTotal +
        queryPenaltyDeduction;

      const netSalary = grossSalary - totalDeductions;

      return {
        staffId: s.staffId,
        fullName: s.fullName,
        department: s.department,
        position: s.position,
        grossSalary,
        totalDeductions,
        netSalary,
      };
    })
  );

  const totals = rows.reduce(
    (acc, r) => {
      acc.gross += r.grossSalary;
      acc.deductions += r.totalDeductions;
      acc.net += r.netSalary;
      return acc;
    },
    { gross: 0, deductions: 0, net: 0 }
  );

  return NextResponse.json({ month, year, rows, totals });
}