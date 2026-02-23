import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    // Get the payroll run
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: runId },
    });

    if (!payrollRun) {
      return NextResponse.json(
        { message: "Payroll run not found" },
        { status: 404 }
      );
    }

    // Only allow rejection of APPROVED status
    if (payrollRun.status !== "APPROVED") {
      return NextResponse.json(
        {
          message: `Cannot reject ${payrollRun.status} payroll. Only APPROVED payroll runs can be rejected.`,
        },
        { status: 400 }
      );
    }

    // Update the payroll run back to DRAFT
    await prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: "DRAFT",
        approvedAt: null,
      },
    });

    return NextResponse.json({
      message: `Payroll run for ${payrollRun.month}/${payrollRun.year} has been rejected and reverted to DRAFT status.`,
    });
  } catch (error) {
    console.error("Error rejecting payroll run:", error);
    return NextResponse.json(
      { message: "Failed to reject payroll run" },
      { status: 500 }
    );
  }
}
