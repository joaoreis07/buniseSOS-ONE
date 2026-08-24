-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('CALL', 'MEETING', 'WHATSAPP', 'EMAIL', 'TASK', 'NOTE');

-- CreateEnum
CREATE TYPE "public"."ActivityStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ActivityType" NOT NULL DEFAULT 'TASK',
    "status" "public"."ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "ownerId" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "customerId" TEXT,
    "leadId" TEXT,
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_companyId_deletedAt_idx" ON "public"."Activity"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Activity_companyId_status_deletedAt_idx" ON "public"."Activity"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Activity_companyId_type_deletedAt_idx" ON "public"."Activity"("companyId", "type", "deletedAt");

-- CreateIndex
CREATE INDEX "Activity_companyId_ownerId_deletedAt_idx" ON "public"."Activity"("companyId", "ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "Activity_companyId_dueAt_idx" ON "public"."Activity"("companyId", "dueAt");

-- CreateIndex
CREATE INDEX "Activity_customerId_idx" ON "public"."Activity"("customerId");

-- CreateIndex
CREATE INDEX "Activity_leadId_idx" ON "public"."Activity"("leadId");

-- CreateIndex
CREATE INDEX "Activity_opportunityId_idx" ON "public"."Activity"("opportunityId");

-- CreateIndex
CREATE INDEX "Activity_companyId_createdAt_idx" ON "public"."Activity"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
