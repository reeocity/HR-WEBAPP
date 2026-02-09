import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseStaffWorkbook } from "@/lib/staff-import";

export const runtime = "nodejs";

function generateStaffId(index: number) {
  return `AUTO-${Date.now()}-${index + 1}`;
}

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
    return NextResponse.json({ message: "Fix errors before confirming import.", errors }, { status: 400 });
  }

  let created = 0;
  let updated = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const staffIdValue = row.staffId?.trim() || generateStaffId(index);

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
      staff = await prisma.staff.update({
        where: { id: staff.id },
        data: {
          fullName: row.fullName,
          department: row.department,
          position: row.position,
          resumptionDate: row.resumptionDate,
          status: row.status,
          phone: row.phone ?? staff.phone,
          bankDetails: row.bankDetails,
          bankName: row.bankName,
          createdById: staff.createdById ?? session.userId,
        },
      });
      updated += 1;
    } else {
      staff = await prisma.staff.create({
        data: {
          staffId: staffIdValue,
          fullName: row.fullName,
          department: row.department,
          position: row.position,
          resumptionDate: row.resumptionDate,
          status: row.status,
          phone: row.phone,
          bankDetails: row.bankDetails,
          bankName: row.bankName,
          createdById: session.userId,
        },
      });
      created += 1;
    }

    const effectiveFrom = row.resumptionDate;
    await prisma.salaryHistory.upsert({
      where: {
        staffId_effectiveFrom: {
          staffId: staff.id,
          effectiveFrom,
        },
      },
      update: {
        monthlySalary: new Prisma.Decimal(row.monthlySalary),
        createdById: session.userId,
      },
      create: {
        staffId: staff.id,
        effectiveFrom,
        monthlySalary: new Prisma.Decimal(row.monthlySalary),
        createdById: session.userId,
      },
    });

    if (hasGuarantorColumns) {
      if (row.guarantor1Name) {
        await prisma.guarantor.upsert({
          where: { staffId_slot: { staffId: staff.id, slot: 1 } },
          update: {
            name: row.guarantor1Name,
            phone: row.guarantor1Phone,
            createdById: session.userId,
          },
          create: {
            staffId: staff.id,
            slot: 1,
            name: row.guarantor1Name,
            phone: row.guarantor1Phone,
            createdById: session.userId,
          },
        });
      }

      if (row.guarantor2Name) {
        await prisma.guarantor.upsert({
          where: { staffId_slot: { staffId: staff.id, slot: 2 } },
          update: {
            name: row.guarantor2Name,
            phone: row.guarantor2Phone,
            createdById: session.userId,
          },
          create: {
            staffId: staff.id,
            slot: 2,
            name: row.guarantor2Name,
            phone: row.guarantor2Phone,
            createdById: session.userId,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, created, updated });
}