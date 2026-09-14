-- CreateEnum
CREATE TYPE "public"."CommunicationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'INTERNAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CommunicationType" AS ENUM ('MANUAL', 'REMINDER', 'FOLLOW_UP', 'TRANSACTIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CommunicationStatus" AS ENUM ('PREPARED', 'OPENED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CommunicationOrigin" AS ENUM ('CRM', 'SALE', 'FINANCE', 'ACTIVITY', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'OVERDUE_RECEIVABLE', 'PAYMENT_RECEIVED', 'SALE_COMPLETED', 'PURCHASE_RECEIVED', 'TASK_ASSIGNED', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "public"."CommunicationChannel" NOT NULL DEFAULT 'WHATSAPP',
    "type" "public"."CommunicationType" NOT NULL DEFAULT 'MANUAL',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Communication" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "activityId" TEXT,
    "saleId" TEXT,
    "installmentId" TEXT,
    "channel" "public"."CommunicationChannel" NOT NULL,
    "type" "public"."CommunicationType" NOT NULL DEFAULT 'MANUAL',
    "origin" "public"."CommunicationOrigin" NOT NULL DEFAULT 'MANUAL',
    "status" "public"."CommunicationStatus" NOT NULL DEFAULT 'PREPARED',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "recipient" TEXT,
    "externalId" TEXT,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationTemplate_companyId_deletedAt_idx" ON "public"."CommunicationTemplate"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_companyId_channel_active_idx" ON "public"."CommunicationTemplate"("companyId", "channel", "active");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_companyId_createdAt_idx" ON "public"."CommunicationTemplate"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_companyId_createdAt_idx" ON "public"."Communication"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_companyId_status_idx" ON "public"."Communication"("companyId", "status");

-- CreateIndex
CREATE INDEX "Communication_companyId_channel_idx" ON "public"."Communication"("companyId", "channel");

-- CreateIndex
CREATE INDEX "Communication_companyId_type_idx" ON "public"."Communication"("companyId", "type");

-- CreateIndex
CREATE INDEX "Communication_companyId_customerId_createdAt_idx" ON "public"."Communication"("companyId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_companyId_userId_createdAt_idx" ON "public"."Communication"("companyId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_saleId_idx" ON "public"."Communication"("saleId");

-- CreateIndex
CREATE INDEX "Communication_installmentId_idx" ON "public"."Communication"("installmentId");

-- CreateIndex
CREATE INDEX "Communication_activityId_idx" ON "public"."Communication"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_companyId_idempotencyKey_key" ON "public"."Notification"("companyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Notification_companyId_userId_createdAt_idx" ON "public"."Notification"("companyId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_companyId_userId_readAt_idx" ON "public"."Notification"("companyId", "userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_companyId_type_createdAt_idx" ON "public"."Notification"("companyId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."Installment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
