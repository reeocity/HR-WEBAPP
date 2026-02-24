-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmation_date" TIMESTAMP(3),
ADD COLUMN     "offer_letter_given" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offer_letter_date" TIMESTAMP(3),
ADD COLUMN     "has_valid_id" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_proof_of_address" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_passport_photos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_qualification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_guarantor_forms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "documents_verified_at" TIMESTAMP(3),
ADD COLUMN     "documents_verified_by" TEXT;
