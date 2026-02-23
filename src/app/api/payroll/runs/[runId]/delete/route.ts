import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
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

    // Only allow deletion of DRAFT status
    if (payrollRun.status !== "DRAFT") {
      return NextResponse.json(
        {
          message: `Cannot delete ${payrollRun.status} payroll. Only DRAFT payroll runs can be deleted.`,
        },
        { status: 400 }
      );
    }

    // Delete the payroll run and all associated payroll lines
    await prisma.payrollRun.delete({
      where: { id: runId },
    });

    return NextResponse.json({
      message: `Payroll run for ${payrollRun.month}/${payrollRun.year} has been deleted.`,
    });
  } catch (error) {
    console.error("Error deleting payroll run:", error);
    return NextResponse.json(
      { message: "Failed to delete payroll run" },
      { status: 500 }
    );
  }
}
