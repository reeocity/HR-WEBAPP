import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const staff = await prisma.staff.findUnique({
    where: { id },
  });
  if (!staff) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const [latenessLogs, absenceLogs, queryLogs, mealTickets] = await Promise.all([
    prisma.latenessLog.findMany({ where: { staffId: staff.id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.absenceLog.findMany({ where: { staffId: staff.id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.queryLog.findMany({ where: { staffId: staff.id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.staffMealTicket.findMany({ where: { staffId: staff.id }, orderBy: { date: "desc" }, take: 20 }),
  ]);

  return NextResponse.json({
    staff: {
      ...staff,
      resumptionDate: staff.resumptionDate.toISOString().slice(0, 10),
    },
    latenessLogs: latenessLogs.map((l) => ({ ...l, date: l.date.toISOString().slice(0, 10) })),
    absenceLogs: absenceLogs.map((a) => ({ ...a, date: a.date.toISOString().slice(0, 10) })),
    queryLogs: queryLogs.map((q) => ({ ...q, date: q.date.toISOString().slice(0, 10) })),
    mealTickets: mealTickets.map((m) => ({ ...m, date: m.date.toISOString().slice(0, 10), amount: m.amount.toString() })),
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();

  const staff = await prisma.staff.update({
    where: { id },
    data: {
      staffId: body.staffId ?? null,
      fullName: body.fullName,
      department: body.department,
      position: body.position,
      status: body.status,
      phone: body.phone,
      resumptionDate: new Date(body.resumptionDate),
    },
  });
  return NextResponse.json({ staff });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.guarantor.deleteMany({ where: { staffId: id } }),
    prisma.salaryHistory.deleteMany({ where: { staffId: id } }),
    prisma.latenessLog.deleteMany({ where: { staffId: id } }),
    prisma.absenceLog.deleteMany({ where: { staffId: id } }),
    prisma.queryLog.deleteMany({ where: { staffId: id } }),
    prisma.manualDeduction.deleteMany({ where: { staffId: id } }),
    prisma.staffMealTicket.deleteMany({ where: { staffId: id } }),
    prisma.payrollDeductionLine.deleteMany({ where: { payrollLine: { staffId: id } } }),
    prisma.payrollLine.deleteMany({ where: { staffId: id } }),
    prisma.staff.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}