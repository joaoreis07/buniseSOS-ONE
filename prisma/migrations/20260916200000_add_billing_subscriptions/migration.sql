-- CreateEnum
CREATE TYPE "public"."BillingProduct" AS ENUM ('ONE', 'FINANCE', 'ODONTO');

-- CreateEnum
CREATE TYPE "public"."PlanInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BillingWebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'BILLING';

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN "asaasCustomerId" TEXT;

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" TEXT NOT NULL,
    "product" "public"."BillingProduct" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "interval" "public"."PlanInterval" NOT NULL DEFAULT 'MONTHLY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "product" "public"."BillingProduct" NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "asaasCustomerId" TEXT,
    "asaasSubscriptionId" TEXT,
    "startedAt" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "lastPaymentStatus" TEXT,
    "invoiceUrl" TEXT,
    "graceUntil" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "companyId" TEXT,
    "status" "public"."BillingWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payloadKind" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_asaasCustomerId_key" ON "public"."Company"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "public"."Plan"("slug");

-- CreateIndex
CREATE INDEX "Plan_product_active_idx" ON "public"."Plan"("product", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_asaasSubscriptionId_key" ON "public"."Subscription"("asaasSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_companyId_status_idx" ON "public"."Subscription"("companyId", "status");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "public"."Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_asaasSubscriptionId_idx" ON "public"."Subscription"("asaasSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_companyId_product_key" ON "public"."Subscription"("companyId", "product");

-- CreateIndex
CREATE UNIQUE INDEX "BillingWebhookEvent_externalId_key" ON "public"."BillingWebhookEvent"("externalId");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_companyId_createdAt_idx" ON "public"."BillingWebhookEvent"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_eventType_createdAt_idx" ON "public"."BillingWebhookEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_status_idx" ON "public"."BillingWebhookEvent"("status");

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillingWebhookEvent" ADD CONSTRAINT "BillingWebhookEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: único plano comercial desta fase. Preço configurável no banco (não no frontend).
INSERT INTO "public"."Plan" (
    "id",
    "product",
    "name",
    "slug",
    "description",
    "price",
    "currency",
    "interval",
    "active",
    "createdAt",
    "updatedAt"
) VALUES (
    'plan_one_monthly',
    'ONE',
    'BusinessOS One',
    'businessos-one-monthly',
    'Assinatura mensal do BusinessOS One. Preço ajustável no banco; o servidor nunca aceita preço enviado pelo cliente.',
    197.00,
    'BRL',
    'MONTHLY',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
