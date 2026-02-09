import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();

  const log = await prisma.absenceLog.create({
    data: {
      staffId: id,
      date: new Date(body.date),
      type: body.type,
      createdById: session.userId,
    },
  });

  return NextResponse.json({ log: { ...log, date: log.date.toISOString().slice(0, 10) } });
}