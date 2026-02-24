import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get document completion status for all staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'complete', 'incomplete', or 'all'

    const staff = await prisma.staff.findMany({
      where: {
        status: 'ACTIVE'
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
        offerLetterDate: true,
        hasValidId: true,
        hasProofOfAddress: true,
        hasPassportPhotos: true,
        hasQualification: true,
        hasGuarantorForms: true,
        documentsVerifiedAt: true,
        documentsVerifiedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    // Calculate document completion status
    const staffWithStatus = staff.map(s => {
      const documentsComplete = s.hasValidId && 
                               s.hasProofOfAddress && 
                               s.hasPassportPhotos && 
                               s.hasQualification && 
                               s.hasGuarantorForms;
      
      const documentsCount = [
        s.hasValidId,
        s.hasProofOfAddress,
        s.hasPassportPhotos,
        s.hasQualification,
        s.hasGuarantorForms
      ].filter(Boolean).length;

      // Calculate days since resumption for confirmation reminder
      const daysSinceResumption = Math.floor(
        (new Date().getTime() - new Date(s.resumptionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const needsConfirmationReminder = !s.isConfirmed && daysSinceResumption > 180; // 6 months = ~180 days

      return {
        ...s,
        documentsComplete,
        documentsCount,
        totalDocuments: 5,
        daysSinceResumption,
        needsConfirmationReminder
      };
    });

    // Filter based on query parameter
    let filteredStaff = staffWithStatus;
    if (filter === 'complete') {
      filteredStaff = staffWithStatus.filter(s => s.documentsComplete);
    } else if (filter === 'incomplete') {
      filteredStaff = staffWithStatus.filter(s => !s.documentsComplete);
    } else if (filter === 'needs-confirmation') {
      filteredStaff = staffWithStatus.filter(s => s.needsConfirmationReminder);
    }

    return NextResponse.json({
      staff: filteredStaff,
      summary: {
        total: staffWithStatus.length,
        complete: staffWithStatus.filter(s => s.documentsComplete).length,
        incomplete: staffWithStatus.filter(s => !s.documentsComplete).length,
        needsConfirmation: staffWithStatus.filter(s => s.needsConfirmationReminder).length
      }
    });
  } catch (error) {
    console.error('Error fetching staff documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff documents' },
      { status: 500 }
    );
  }
}

// PATCH - Update document status for a staff member
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      staffId, 
      isConfirmed,
      confirmationDate,
      offerLetterGiven,
      offerLetterDate,
      hasValidId,
      hasProofOfAddress,
      hasPassportPhotos,
      hasQualification,
      hasGuarantorForms,
      verifiedBy
    } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (typeof isConfirmed === 'boolean') {
      updateData.isConfirmed = isConfirmed;
      if (isConfirmed && !confirmationDate) {
        updateData.confirmationDate = new Date();
      } else if (confirmationDate) {
        updateData.confirmationDate = new Date(confirmationDate);
      }
    }

    if (typeof offerLetterGiven === 'boolean') {
      updateData.offerLetterGiven = offerLetterGiven;
      if (offerLetterGiven && !offerLetterDate) {
        updateData.offerLetterDate = new Date();
      } else if (offerLetterDate) {
        updateData.offerLetterDate = new Date(offerLetterDate);
      }
    }

    if (typeof hasValidId === 'boolean') updateData.hasValidId = hasValidId;
    if (typeof hasProofOfAddress === 'boolean') updateData.hasProofOfAddress = hasProofOfAddress;
    if (typeof hasPassportPhotos === 'boolean') updateData.hasPassportPhotos = hasPassportPhotos;
    if (typeof hasQualification === 'boolean') updateData.hasQualification = hasQualification;
    if (typeof hasGuarantorForms === 'boolean') updateData.hasGuarantorForms = hasGuarantorForms;

    // Check if all documents are now complete
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        hasValidId: true,
        hasProofOfAddress: true,
        hasPassportPhotos: true,
        hasQualification: true,
        hasGuarantorForms: true,
      }
    });

    if (staff) {
      const allDocsComplete = 
        (updateData.hasValidId ?? staff.hasValidId) &&
        (updateData.hasProofOfAddress ?? staff.hasProofOfAddress) &&
        (updateData.hasPassportPhotos ?? staff.hasPassportPhotos) &&
        (updateData.hasQualification ?? staff.hasQualification) &&
        (updateData.hasGuarantorForms ?? staff.hasGuarantorForms);

      if (allDocsComplete && verifiedBy) {
        updateData.documentsVerifiedAt = new Date();
        updateData.documentsVerifiedBy = verifiedBy;
      }
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        staffId: true,
        fullName: true,
        isConfirmed: true,
        confirmationDate: true,
        offerLetterGiven: true,
        offerLetterDate: true,
        hasValidId: true,
        hasProofOfAddress: true,
        hasPassportPhotos: true,
        hasQualification: true,
        hasGuarantorForms: true,
        documentsVerifiedAt: true,
        documentsVerifiedBy: true,
      }
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff documents:', error);
    return NextResponse.json(
      { error: 'Failed to update staff documents' },
      { status: 500 }
    );
  }
}
