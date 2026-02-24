import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface StaffBasic {
  id: string;
  staffId: string | null;
  fullName: string;
  department: string;
  position: string;
  resumptionDate: Date;
  isConfirmed: boolean;
  confirmationDate: Date | null;
  offerLetterGiven: boolean;
  phone: string | null;
  createdAt: Date;
}

// GET - Get staff pending confirmation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysThreshold = parseInt(searchParams.get('days') || '180'); // Default 6 months = 180 days

    // Get ALL staff (both confirmed and unconfirmed)
    const allStaff = await prisma.staff.findMany({
      where: {
        OR: [{ status: { not: 'INACTIVE' } }, { status: null }],
      },
      select: {
        id: true,
        staffId: true,
        fullName: true,
        department: true,
        position: true,
        resumptionDate: true,
        isConfirmed: true,
        confirmationDate: true,
        offerLetterGiven: true,
        phone: true,
        createdAt: true,
      },
      orderBy: {
        resumptionDate: 'asc'
      }
    });

    // Calculate days since resumption for all staff
    const now = new Date();
    const staffWithDays = allStaff.map((s: StaffBasic) => {
      const daysSinceResumption = Math.floor(
        (now.getTime() - new Date(s.resumptionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const monthsSinceResumption = Math.floor(daysSinceResumption / 30);

      return {
        ...s,
        daysSinceResumption,
        monthsSinceResumption,
        needsConfirmation: !s.isConfirmed && daysSinceResumption >= daysThreshold
      };
    });

    // Filter to only those needing confirmation (unconfirmed and past threshold)
    const needingConfirmation = staffWithDays.filter(s => s.needsConfirmation);

    // Group by urgency level
    const critical = needingConfirmation.filter(s => s.monthsSinceResumption >= 9); // 9+ months
    const urgent = needingConfirmation.filter(s => s.monthsSinceResumption >= 6 && s.monthsSinceResumption < 9); // 6-9 months
    const approaching = staffWithDays.filter(s => 
      !s.isConfirmed && s.monthsSinceResumption >= 5 && s.monthsSinceResumption < 6
    ); // Almost 6 months

    return NextResponse.json({
      reminders: needingConfirmation,
      allStaff: staffWithDays,
      summary: {
        total: needingConfirmation.length,
        critical: critical.length,
        urgent: urgent.length,
        approaching: approaching.length,
      },
      grouped: {
        critical,
        urgent,
        approaching
      }
    });
  } catch (error) {
    console.error('Error fetching confirmation reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch confirmation reminders' },
      { status: 500 }
    );
  }
}
