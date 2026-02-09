import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst();
    if (existingUser) {
      return NextResponse.json({ message: "Admin already configured." }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unable to create admin." }, { status: 500 });
  }
}
