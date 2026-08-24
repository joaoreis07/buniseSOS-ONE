-- CreateEnum
CREATE TYPE "public"."CustomerType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "public"."CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "public"."CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "whatsapp" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "status" "public"."CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "origin" TEXT,
    "notes" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_companyId_deletedAt_idx" ON "public"."Customer"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Customer_companyId_name_idx" ON "public"."Customer"("companyId", "name");

-- CreateIndex
CREATE INDEX "Customer_companyId_email_idx" ON "public"."Customer"("companyId", "email");

-- CreateIndex
CREATE INDEX "Customer_companyId_document_idx" ON "public"."Customer"("companyId", "document");

-- CreateIndex
CREATE INDEX "Customer_companyId_status_deletedAt_idx" ON "public"."Customer"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Customer_companyId_origin_deletedAt_idx" ON "public"."Customer"("companyId", "origin", "deletedAt");

-- CreateIndex
CREATE INDEX "Customer_companyId_ownerId_deletedAt_idx" ON "public"."Customer"("companyId", "ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "Customer_companyId_createdAt_idx" ON "public"."Customer"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
