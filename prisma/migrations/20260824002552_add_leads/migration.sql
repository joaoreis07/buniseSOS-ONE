-- CreateEnum
CREATE TYPE "public"."LeadOrigin" AS ENUM ('WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'REFERRAL', 'ECOMMERCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST');

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "origin" "public"."LeadOrigin" NOT NULL DEFAULT 'OTHER',
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "ownerId" TEXT,
    "estimatedValue" DECIMAL(14,2),
    "notes" TEXT,
    "convertedCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_companyId_deletedAt_idx" ON "public"."Lead"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Lead_companyId_name_idx" ON "public"."Lead"("companyId", "name");

-- CreateIndex
CREATE INDEX "Lead_companyId_email_idx" ON "public"."Lead"("companyId", "email");

-- CreateIndex
CREATE INDEX "Lead_companyId_status_deletedAt_idx" ON "public"."Lead"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Lead_companyId_origin_deletedAt_idx" ON "public"."Lead"("companyId", "origin", "deletedAt");

-- CreateIndex
CREATE INDEX "Lead_companyId_ownerId_deletedAt_idx" ON "public"."Lead"("companyId", "ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "Lead_companyId_createdAt_idx" ON "public"."Lead"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_convertedCustomerId_idx" ON "public"."Lead"("convertedCustomerId");

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_convertedCustomerId_fkey" FOREIGN KEY ("convertedCustomerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
