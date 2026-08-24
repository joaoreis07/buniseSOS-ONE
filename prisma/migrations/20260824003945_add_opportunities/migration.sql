-- CreateEnum
CREATE TYPE "public"."OpportunityStage" AS ENUM ('NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "public"."Opportunity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "ownerId" TEXT,
    "stage" "public"."OpportunityStage" NOT NULL DEFAULT 'NEW',
    "estimatedValue" DECIMAL(14,2),
    "probability" INTEGER NOT NULL DEFAULT 10,
    "expectedCloseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_companyId_deletedAt_idx" ON "public"."Opportunity"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_name_idx" ON "public"."Opportunity"("companyId", "name");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_stage_deletedAt_idx" ON "public"."Opportunity"("companyId", "stage", "deletedAt");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_ownerId_deletedAt_idx" ON "public"."Opportunity"("companyId", "ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_expectedCloseDate_idx" ON "public"."Opportunity"("companyId", "expectedCloseDate");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_createdAt_idx" ON "public"."Opportunity"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Opportunity_leadId_idx" ON "public"."Opportunity"("leadId");

-- CreateIndex
CREATE INDEX "Opportunity_customerId_idx" ON "public"."Opportunity"("customerId");

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
