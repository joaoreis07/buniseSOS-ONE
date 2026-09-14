-- CreateEnum
CREATE TYPE "public"."OperationalDocumentKind" AS ENUM ('SALE_RECEIPT', 'PAYMENT_RECEIPT', 'PURCHASE_RECORD');

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "tradeName" TEXT,
ADD COLUMN     "document" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "zipCode" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "public"."CompanySettings" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "logoPath" TEXT,
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#047857',
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#0f172a',
ADD COLUMN     "documentTitle" TEXT,
ADD COLUMN     "documentHeader" TEXT,
ADD COLUMN     "documentFooter" TEXT,
ADD COLUMN     "communicationSignature" TEXT,
ADD COLUMN     "defaultSaleNotes" TEXT,
ADD COLUMN     "defaultPurchaseNotes" TEXT,
ADD COLUMN     "defaultReceiptNotes" TEXT,
ADD COLUMN     "allowSaleWithoutCustomer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultInstallmentCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."DocumentSequence" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "public"."OperationalDocumentKind" NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperationalDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "public"."OperationalDocumentKind" NOT NULL,
    "number" INTEGER NOT NULL,
    "saleId" TEXT,
    "purchaseId" TEXT,
    "installmentPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "OperationalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_companyId_kind_key" ON "public"."DocumentSequence"("companyId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalDocument_companyId_kind_number_key" ON "public"."OperationalDocument"("companyId", "kind", "number");

-- CreateIndex
CREATE INDEX "OperationalDocument_companyId_createdAt_idx" ON "public"."OperationalDocument"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalDocument_companyId_saleId_idx" ON "public"."OperationalDocument"("companyId", "saleId");

-- CreateIndex
CREATE INDEX "OperationalDocument_companyId_purchaseId_idx" ON "public"."OperationalDocument"("companyId", "purchaseId");

-- CreateIndex
CREATE INDEX "OperationalDocument_companyId_installmentPaymentId_idx" ON "public"."OperationalDocument"("companyId", "installmentPaymentId");

-- Partial uniques: one operational document per source entity per kind
CREATE UNIQUE INDEX "OperationalDocument_company_kind_sale_key"
  ON "public"."OperationalDocument"("companyId", "kind", "saleId")
  WHERE "saleId" IS NOT NULL;

CREATE UNIQUE INDEX "OperationalDocument_company_kind_purchase_key"
  ON "public"."OperationalDocument"("companyId", "kind", "purchaseId")
  WHERE "purchaseId" IS NOT NULL;

CREATE UNIQUE INDEX "OperationalDocument_company_kind_payment_key"
  ON "public"."OperationalDocument"("companyId", "kind", "installmentPaymentId")
  WHERE "installmentPaymentId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."DocumentSequence" ADD CONSTRAINT "DocumentSequence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalDocument" ADD CONSTRAINT "OperationalDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalDocument" ADD CONSTRAINT "OperationalDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalDocument" ADD CONSTRAINT "OperationalDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalDocument" ADD CONSTRAINT "OperationalDocument_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "public"."Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalDocument" ADD CONSTRAINT "OperationalDocument_installmentPaymentId_fkey" FOREIGN KEY ("installmentPaymentId") REFERENCES "public"."InstallmentPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
