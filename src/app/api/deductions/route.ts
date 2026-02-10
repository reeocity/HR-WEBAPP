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
  const staffId = url.searchParams.get("staffId") || undefined;

  if (!month || !year) {
    return NextResponse.json({ message: "Month and year are required." }, { status: 400 });
  }

  const logs = await prisma.manualDeduction.findMany({
    where: { month, year, ...(staffId ? { staffId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { staff: { select: { id: true, staffId: true, fullName: true, department: true, position: true } } },
  });

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      month: l.month,
      year: l.year,
      category: l.category,
      amount: l.amount.toString(),
      note: l.note,
      staff: l.staff,
      createdAt: l.createdAt.toISOString().slice(0, 10),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.staffId || !body.month || !body.year || !body.category || !body.amount) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  const created = await prisma.manualDeduction.create({
    data: {
      staffId: body.staffId,
      month: Number(body.month),
      year: Number(body.year),
      category: body.category,
      amount: body.amount,
      note: body.note ?? null,
      createdById: session.userId,
    },
  });

  return NextResponse.json({ id: created.id });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body?.id) return NextResponse.json({ message: "id is required." }, { status: 400 });

  const existing = await prisma.manualDeduction.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.manualDeduction.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}