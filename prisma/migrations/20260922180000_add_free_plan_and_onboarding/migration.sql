-- Free plan + onboarding flag
ALTER TABLE "public"."CompanySettings" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

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
    'plan_one_free',
    'ONE',
    'BusinessOS One Free',
    'businessos-one-free',
    'Plano gratuito do BusinessOS One com limites de uso.',
    0.00,
    'BRL',
    'MONTHLY',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO NOTHING;

-- Empresas existentes não passam pelo onboarding novamente
UPDATE "public"."CompanySettings"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "onboardingCompletedAt" IS NULL;

-- Backfill: empresas sem assinatura ONE recebem plano Free ativo
INSERT INTO "public"."Subscription" (
    "id",
    "companyId",
    "planId",
    "product",
    "status",
    "startedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'sub_free_' || c."id",
    c."id",
    'plan_one_free',
    'ONE'::"public"."BillingProduct",
    'ACTIVE'::"public"."SubscriptionStatus",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."Company" c
WHERE c."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "public"."Subscription" s
    WHERE s."companyId" = c."id" AND s."product" = 'ONE'
  );
