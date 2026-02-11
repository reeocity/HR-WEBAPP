-- CreateTable
CREATE TABLE "MonthlyAllowance" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "MonthlyAllowance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MonthlyAllowance" ADD CONSTRAINT "MonthlyAllowance_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
