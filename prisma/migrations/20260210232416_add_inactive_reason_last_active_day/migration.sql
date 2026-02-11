-- CreateEnum
CREATE TYPE "InactiveReason" AS ENUM ('TERMINATION', 'RESIGNATION', 'AWOL', 'SUSPENSION');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "inactive_reason" "InactiveReason",
ADD COLUMN     "last_active_date" TIMESTAMP(3);
