import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseStaffWorkbook } from "@/lib/staff-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "Excel file is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors, hasGuarantorColumns } = parseStaffWorkbook(buffer);

  if (errors.length) {
    return NextResponse.json({
      newCount: 0,
      updateCount: 0,
      errorCount: errors.length,
      missingGuarantorCount: 0,
      errors,
    });
  }

  let newCount = 0;
  let updateCount = 0;
  let missingGuarantorCount = 0;

  for (const row of rows) {
    let staff = null;

    if (row.staffId) {
      staff = await prisma.staff.findUnique({ where: { staffId: row.staffId } });
    } else if (row.phone) {
      staff = await prisma.staff.findFirst({
        where: {
          fullName: { equals: row.fullName, mode: "insensitive" },
          phone: row.phone,
        },
      });
    }

    if (staff) {
      updateCount += 1;
    } else {
      newCount += 1;
    }

    if (!hasGuarantorColumns) {
      missingGuarantorCount += 1;
    } else if (!row.guarantor1Name || !row.guarantor2Name) {
      missingGuarantorCount += 1;
    }
  }

  return NextResponse.json({
    newCount,
    updateCount,
    errorCount: 0,
    missingGuarantorCount,
    errors: [],
  });
}
