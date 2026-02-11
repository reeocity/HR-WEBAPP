import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();

  const log = await prisma.latenessLog.create({
    data: {
      staffId: id,
      date: new Date(body.date),
      arrivalTime: body.arrivalTime ?? null,
      createdById: session.userId,
    },
  });

  return NextResponse.json({
    log: {
      ...log,
      date: log.date.toISOString().slice(0, 10),
      arrivalTime: log.arrivalTime ?? null,
    },
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  if (!body?.logId) return NextResponse.json({ message: "logId is required." }, { status: 400 });

  const log = await prisma.latenessLog.findUnique({ where: { id: body.logId } });
  if (!log || log.staffId !== id) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.latenessLog.delete({ where: { id: body.logId } });
  return NextResponse.json({ ok: true });
}