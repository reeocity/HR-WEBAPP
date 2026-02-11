/*
  Warnings:

  - The values [PAID] on the enum `PayrollStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `total_deductions` to the `PayrollRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_gross_salary` to the `PayrollRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_net_pay` to the `PayrollRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_staff` to the `PayrollRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PayrollStatus_new" AS ENUM ('DRAFT', 'APPROVED', 'LOCKED');
ALTER TABLE "PayrollRun" ALTER COLUMN "status" TYPE "PayrollStatus_new" USING ("status"::text::"PayrollStatus_new");
ALTER TYPE "PayrollStatus" RENAME TO "PayrollStatus_old";
ALTER TYPE "PayrollStatus_new" RENAME TO "PayrollStatus";
DROP TYPE "public"."PayrollStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "PayrollRun" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "locked_at" TIMESTAMP(3),
ADD COLUMN     "locked_by" TEXT,
ADD COLUMN     "total_deductions" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "total_gross_salary" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "total_net_pay" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "total_staff" INTEGER NOT NULL;
