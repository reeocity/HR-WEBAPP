# Document Tracking & Staff Confirmation System

## Overview
This system adds comprehensive document tracking and staff confirmation management to the HR system.

## Features Implemented

### 1. Database Schema Updates
Added the following fields to the Staff model:
- **Confirmation Status:**
  - `isConfirmed` - Boolean flag indicating if staff is confirmed
  - `confirmationDate` - Date when staff was confirmed
  - `offerLetterGiven` - Boolean flag for offer letter status
  - `offerLetterDate` - Date when offer letter was given

- **Document Tracking:**
  - `hasValidId` - Valid ID card (NIN, Passport)
  - `hasProofOfAddress` - Valid proof of address (utility bill)
  - `hasPassportPhotos` - Two passport photos
  - `hasQualification` - Copy of highest qualification
  - `hasGuarantorForms` - Guarantor forms and letters of undertaking
  - `documentsVerifiedAt` - Timestamp when all documents were verified
  - `documentsVerifiedBy` - User ID who verified the documents

### 2. API Endpoints

#### `/api/staff/documents` (GET, PATCH)
- **GET**: Retrieve staff with document completion status
  - Query params: `filter` (all, complete, incomplete, needs-confirmation)
  - Returns summary statistics and staff list with document status
  
- **PATCH**: Update document status for a staff member
  - Updates confirmation status, offer letter status, and individual document checkboxes
  - Automatically sets verification timestamp when all documents are complete

#### `/api/staff/confirmation-reminders` (GET)
- Retrieves staff pending confirmation after 6+ months
- Groups staff by urgency:
  - **Critical**: 9+ months (highest priority)
  - **Urgent**: 6-9 months
  - **Approaching**: 5-6 months (warning)
- Query params: `days` (threshold, default: 180)

### 3. User Interface

#### `/documents` - Document Management Page
Features:
- Summary cards showing total staff, complete/incomplete documents, and staff needing confirmation
- Filter tabs (All Staff, Complete, Incomplete, Needs Confirmation)
- Quick checkboxes for offer letter and confirmation status
- Document progress indicator (e.g., "3/5" documents)
- "Manage" button opens detailed modal for each staff member

**Modal Features:**
- Checkbox for offer letter given
- Checkbox for staff confirmed
- Complete checklist of 5 required documents
- Save changes button with loading state

#### `/confirmation-reminders` - Confirmation Reminders Page
Features:
- Alert banner highlighting action required
- Summary cards by urgency level
- Filter tabs (All Pending, Critical, Urgent, Approaching)
- Table showing:
  - Staff details (name, ID, phone)
  - Department and position
  - Resumption date
  - Months employed
  - Offer letter status
  - Urgency level badge
  - "Confirm Now" quick action button
  - "View" link to staff details

#### Updated Staff Details Page
Added new section showing:
- Offer letter given (checkbox)
- Staff confirmed (checkbox)
- Complete document checklist with all 5 required documents
- All changes save with the main "Save Changes" button

### 4. Dashboard Integration
Added two new action cards to the main dashboard:
- **Documents & Confirmation** - Track document submission and staff confirmation
- **Confirmation Reminders** - Staff pending confirmation (6+ months)

## Document Checklist
The system tracks these 5 required documents:
1. Valid ID card (NIN, Passport)
2. Valid proof of address (utility bill)
3. Two passport photos
4. Copy of highest qualification
5. Guarantor forms and letters of undertaking

## Business Logic

### Document Completion
- Staff is considered "complete" when all 5 documents are checked
- System automatically tracks verification timestamp and user

### Confirmation Reminders
- Calculates days since resumption date
- Flags staff as needing confirmation after 180 days (6 months)
- Groups by urgency:
  - 5-6 months: Approaching (warning)
  - 6-9 months: Urgent (action needed)
  - 9+ months: Critical (immediate action required)

### Quick Actions
- One-click confirmation from reminders page
- Quick checkboxes for offer letter and confirmation in main documents page
- Detailed modal for managing all documents at once

## Database Migration
Migration file created: `20260224000000_add_confirmation_and_documents`
Applied using: `npx prisma db push`

## Usage

### Tracking Documents
1. Navigate to "Documents & Confirmation" from dashboard
2. View summary of document completion status
3. Use filters to find staff with incomplete documents
4. Click "Manage" to open detailed checklist for each staff member
5. Check off documents as they're received
6. Save changes

### Managing Confirmation Reminders
1. Navigate to "Confirmation Reminders" from dashboard
2. View staff grouped by urgency
3. Use filters to focus on critical/urgent cases
4. Quick-confirm staff using "Confirm Now" button
5. Or click "View" to see full staff details

### Individual Staff Management
1. Go to Staff → Select staff member
2. Scroll to "Confirmation & Onboarding" section
3. Update offer letter status and confirmation
4. Check off received documents
5. Save all changes

## Technical Details

### Files Created/Modified
**New Files:**
- `src/app/(protected)/documents/page.tsx`
- `src/app/(protected)/confirmation-reminders/page.tsx`
- `src/app/api/staff/documents/route.ts`
- `src/app/api/staff/confirmation-reminders/route.ts`
- `prisma/migrations/20260224000000_add_confirmation_and_documents/migration.sql`

**Modified Files:**
- `prisma/schema.prisma`
- `src/app/(protected)/staff/[id]/page.tsx`
- `src/app/(protected)/page.tsx`
- `src/app/api/staff/[id]/route.ts`

### TypeScript Types
Proper TypeScript interfaces defined for type safety:
- `StaffWithDocuments` - Complete staff record with documents
- `StaffBasic` - Basic staff info for reminders
- Proper typing throughout to avoid `any` warnings
