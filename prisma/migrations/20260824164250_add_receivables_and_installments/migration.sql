-- CreateEnum
CREATE TYPE "public"."SalePaymentMode" AS ENUM ('CASH', 'INSTALLMENT');

-- CreateEnum
CREATE TYPE "public"."InstallmentPeriod" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."ReceivableStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "firstDueDate" TIMESTAMP(3),
ADD COLUMN     "installmentsCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paymentMode" "public"."SalePaymentMode" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "period" "public"."InstallmentPeriod" NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "public"."AccountReceivable" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "paymentMode" "public"."SalePaymentMode" NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(14,2) NOT NULL,
    "status" "public"."ReceivableStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountReceivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Installment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountReceivableId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(14,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."ReceivableStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InstallmentPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "installmentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "paidById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountReceivable_saleId_key" ON "public"."AccountReceivable"("saleId");

-- CreateIndex
CREATE INDEX "AccountReceivable_companyId_status_idx" ON "public"."AccountReceivable"("companyId", "status");

-- CreateIndex
CREATE INDEX "AccountReceivable_companyId_dueDate_idx" ON "public"."AccountReceivable"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "AccountReceivable_companyId_customerId_idx" ON "public"."AccountReceivable"("companyId", "customerId");

-- CreateIndex
CREATE INDEX "AccountReceivable_companyId_createdAt_idx" ON "public"."AccountReceivable"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Installment_companyId_status_idx" ON "public"."Installment"("companyId", "status");

-- CreateIndex
CREATE INDEX "Installment_companyId_dueDate_idx" ON "public"."Installment"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "Installment_accountReceivableId_idx" ON "public"."Installment"("accountReceivableId");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_accountReceivableId_number_key" ON "public"."Installment"("accountReceivableId", "number");

-- CreateIndex
CREATE INDEX "InstallmentPayment_companyId_paidAt_idx" ON "public"."InstallmentPayment"("companyId", "paidAt");

-- CreateIndex
CREATE INDEX "InstallmentPayment_installmentId_createdAt_idx" ON "public"."InstallmentPayment"("installmentId", "createdAt");

-- CreateIndex
CREATE INDEX "InstallmentPayment_paidById_idx" ON "public"."InstallmentPayment"("paidById");

-- AddForeignKey
ALTER TABLE "public"."AccountReceivable" ADD CONSTRAINT "AccountReceivable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountReceivable" ADD CONSTRAINT "AccountReceivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountReceivable" ADD CONSTRAINT "AccountReceivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Installment" ADD CONSTRAINT "Installment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Installment" ADD CONSTRAINT "Installment_accountReceivableId_fkey" FOREIGN KEY ("accountReceivableId") REFERENCES "public"."AccountReceivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."Installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
