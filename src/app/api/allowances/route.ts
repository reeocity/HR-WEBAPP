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

  const allowances = await prisma.monthlyAllowance.findMany({
    where: { month, year, ...(staffId ? { staffId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { staff: { select: { id: true, staffId: true, fullName: true, department: true, position: true } } },
  });

  return NextResponse.json({
    allowances: allowances.map((a) => ({
      id: a.id,
      month: a.month,
      year: a.year,
      reason: a.reason,
      amount: a.amount.toString(),
      staff: a.staff,
      createdAt: a.createdAt.toISOString().slice(0, 10),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.staffId || !body.month || !body.year || !body.reason || !body.amount) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  const created = await prisma.monthlyAllowance.create({
    data: {
      staffId: body.staffId,
      month: Number(body.month),
      year: Number(body.year),
      reason: body.reason,
      amount: body.amount,
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

  const existing = await prisma.monthlyAllowance.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.monthlyAllowance.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
