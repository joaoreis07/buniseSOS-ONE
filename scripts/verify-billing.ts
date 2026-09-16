/**
 * Billing / Asaas verification (FASE 16) — BusinessOS One only.
 * Uses FakeBillingProvider. Does not call the live Asaas API.
 * Run: npm run verify:billing
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { assertVerificationDatabase } from "./lib/assert-one-database";
import { hasPermission } from "../src/shared/permissions/rbac";
import { subscribeSchema } from "../src/modules/billing/schemas/billing.schemas";
import { isBillingEnforced } from "../src/modules/billing/lib/env";
import { hasProductAccess } from "../src/modules/billing/services/access.service";
import {
  cancelSubscriptionForTenant,
  createSubscriptionForTenant,
  ensureBillingCustomer,
  getSubscriptionOverviewForTenant,
  syncSubscriptionFromProvider,
} from "../src/modules/billing/services/billing.service";
import {
  BillingAuthError,
  BillingPayloadError,
  ingestAsaasWebhook,
} from "../src/modules/billing/services/webhook.service";
import {
  resetFakeBillingProvider,
  setFakeBillingFailure,
} from "../src/modules/billing/providers/fake-billing-provider";
import { resetBillingProviderCache } from "../src/modules/billing/providers";

const prisma = new PrismaClient();
const WEBHOOK_TOKEN = "verify-billing-webhook-token-32chars";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function expectThrow(fn: () => Promise<unknown>, message: string) {
  let thrown = false;
  try {
    await fn();
  } catch {
    thrown = true;
  }
  assert(thrown, message);
}

async function registerTenant(input: {
  name: string;
  email: string;
  companyName: string;
}) {
  const passwordHash = await hash("TestPass123!", 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email.toLowerCase(), passwordHash },
    });
    const company = await tx.company.create({ data: { name: input.companyName } });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "ADMIN" },
    });
    await tx.companySettings.create({ data: { companyId: company.id } });
    return { user, company };
  });
}

async function addMember(params: {
  companyId: string;
  name: string;
  email: string;
  role: Role;
}) {
  const passwordHash = await hash("TestPass123!", 12);
  const user = await prisma.user.create({
    data: { name: params.name, email: params.email.toLowerCase(), passwordHash },
  });
  await prisma.membership.create({
    data: { userId: user.id, companyId: params.companyId, role: params.role },
  });
  return user;
}

function webhookPayload(params: {
  id: string;
  event: string;
  subscriptionId: string;
  customerId?: string;
  invoiceUrl?: string;
}) {
  return JSON.stringify({
    id: params.id,
    event: params.event,
    payment: params.event.startsWith("PAYMENT_")
      ? {
          id: `pay_${params.id}`,
          subscription: params.subscriptionId,
          customer: params.customerId,
          invoiceUrl: params.invoiceUrl ?? "https://sandbox.asaas.com/i/test",
          dueDate: "2026-10-01",
        }
      : undefined,
    subscription: params.event.startsWith("SUBSCRIPTION_")
      ? {
          id: params.subscriptionId,
          customer: params.customerId,
          status: params.event === "SUBSCRIPTION_DELETED" ? "INACTIVE" : "ACTIVE",
          deleted: params.event === "SUBSCRIPTION_DELETED",
          nextDueDate: "2026-10-01",
        }
      : undefined,
  });
}

async function main() {
  assertVerificationDatabase();
  process.env.BILLING_PROVIDER = "fake";
  process.env.ASAAS_WEBHOOK_TOKEN = WEBHOOK_TOKEN;
  process.env.BILLING_ENFORCE = "true";
  resetFakeBillingProvider();
  resetBillingProviderCache();

  assert(hasPermission("ADMIN", "billing:view"), "ADMIN billing:view");
  assert(hasPermission("ADMIN", "billing:manage"), "ADMIN billing:manage");
  assert(hasPermission("ADMIN", "billing:cancel"), "ADMIN billing:cancel");
  assert(hasPermission("MANAGER", "billing:view"), "MANAGER billing:view");
  assert(hasPermission("MANAGER", "billing:manage"), "MANAGER billing:manage");
  assert(!hasPermission("MANAGER", "billing:cancel"), "MANAGER no billing:cancel");
  assert(!hasPermission("SALES", "billing:view"), "SALES no billing:view");
  assert(!hasPermission("SALES", "billing:manage"), "SALES no billing:manage");
  assert(!hasPermission("FINANCE", "billing:manage"), "FINANCE no billing:manage");
  assert(!hasPermission("INVENTORY", "billing:manage"), "INVENTORY no billing:manage");

  const priceIgnored = subscribeSchema.safeParse({
    planId: "plan_one_monthly",
    price: "0.01",
    status: "ACTIVE",
    asaasCustomerId: "cus_hack",
  });
  assert(priceIgnored.success, "schema accepts planId");
  assert(
    priceIgnored.success && !("price" in priceIgnored.data),
    "frontend price is stripped",
  );

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin Billing A",
    email: `bill-a-${suffix}@example.com`,
    companyName: `Empresa Billing A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin Billing B",
    email: `bill-b-${suffix}@example.com`,
    companyName: `Empresa Billing B ${suffix}`,
  });
  const sales = await addMember({
    companyId: a.company.id,
    name: "Vendas Billing",
    email: `bill-sales-${suffix}@example.com`,
    role: "SALES",
  });
  const manager = await addMember({
    companyId: a.company.id,
    name: "Gestor Billing",
    email: `bill-mgr-${suffix}@example.com`,
    role: "MANAGER",
  });

  const plan = await prisma.plan.findUniqueOrThrow({
    where: { slug: "businessos-one-monthly" },
  });
  assert(plan.active, "seed plan active");
  assert(plan.product === "ONE", "seed plan is ONE");
  assert(plan.price.toFixed(2) === "197.00", "seed price from database");
  assert(plan.currency === "BRL", "BRL currency");

  const inactive = await prisma.plan.create({
    data: {
      product: "ONE",
      name: "Inativo",
      slug: `one-inactive-${suffix}`,
      price: "50.00",
      interval: "MONTHLY",
      active: false,
    },
  });

  await expectThrow(
    () =>
      createSubscriptionForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        planId: inactive.id,
      }),
    "inactive plan rejected",
  );

  assert(
    !(await hasProductAccess(a.company.id, "ONE")),
    "no subscription denied when enforced",
  );

  const firstCustomer = await ensureBillingCustomer(a.company.id);
  const secondCustomer = await ensureBillingCustomer(a.company.id);
  assert(firstCustomer.asaasCustomerId, "customer created");
  assert(
    firstCustomer.asaasCustomerId === secondCustomer.asaasCustomerId,
    "customer idempotent",
  );
  const [parallel1, parallel2] = await Promise.all([
    ensureBillingCustomer(a.company.id),
    ensureBillingCustomer(a.company.id),
  ]);
  assert(
    parallel1.asaasCustomerId === parallel2.asaasCustomerId,
    "parallel customer idempotent",
  );

  const companyA = await prisma.company.findUniqueOrThrow({
    where: { id: a.company.id },
  });
  const companyB = await prisma.company.findUniqueOrThrow({
    where: { id: b.company.id },
  });
  assert(companyA.asaasCustomerId, "customer stored on company A");
  assert(!companyB.asaasCustomerId, "customer not leaked to tenant B");

  setFakeBillingFailure("subscription", true);
  await expectThrow(
    () =>
      createSubscriptionForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        planId: plan.id,
      }),
    "provider failure bubbles",
  );
  const failed = await prisma.subscription.findUnique({
    where: { companyId_product: { companyId: a.company.id, product: "ONE" } },
  });
  assert(failed, "local row kept after provider failure");
  assert(failed.status !== "ACTIVE", "failed create is not ACTIVE");
  assert(failed.asaasSubscriptionId == null, "no external id after failure");
  assert(failed.lastError, "error recorded");

  const created = await createSubscriptionForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    planId: plan.id,
  });
  assert(created.status === "PENDING", "new subscription pending");
  assert(created.asaasSubscriptionId, "external subscription saved");
  assert(created.plan.price.toFixed(2) === "197.00", "server price used");
  assert(created.invoiceUrl, "checkout url from provider");

  const again = await createSubscriptionForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    planId: plan.id,
  });
  assert(again.id === created.id, "subscription row reused");
  assert(
    again.asaasSubscriptionId === created.asaasSubscriptionId,
    "subscription idempotent",
  );

  const [sub1, sub2] = await Promise.all([
    createSubscriptionForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      planId: plan.id,
    }),
    createSubscriptionForTenant({
      companyId: a.company.id,
      userId: manager.id,
      role: "MANAGER",
      planId: plan.id,
    }),
  ]);
  assert(sub1.asaasSubscriptionId === sub2.asaasSubscriptionId, "parallel sub idempotent");

  await expectThrow(
    () =>
      createSubscriptionForTenant({
        companyId: a.company.id,
        userId: sales.id,
        role: "SALES",
        planId: plan.id,
      }),
    "SALES cannot manage billing",
  );

  const overviewB = await getSubscriptionOverviewForTenant({
    companyId: b.company.id,
    role: "ADMIN",
  });
  assert(!overviewB.subscription, "tenant B has no subscription");

  await expectThrow(
    () =>
      ingestAsaasWebhook({
        rawBody: webhookPayload({
          id: `evt-auth-${suffix}`,
          event: "PAYMENT_CONFIRMED",
          subscriptionId: created.asaasSubscriptionId!,
        }),
        token: "wrong-token",
      }),
    "invalid webhook token rejected",
  );
  try {
    await ingestAsaasWebhook({
      rawBody: webhookPayload({
        id: `evt-auth2-${suffix}`,
        event: "PAYMENT_CONFIRMED",
        subscriptionId: created.asaasSubscriptionId!,
      }),
      token: "wrong-token",
    });
  } catch (error) {
    assert(error instanceof BillingAuthError, "auth error type");
  }

  await expectThrow(
    () =>
      ingestAsaasWebhook({
        rawBody: "not-json",
        token: WEBHOOK_TOKEN,
      }),
    "invalid json rejected",
  );
  try {
    await ingestAsaasWebhook({
      rawBody: "{}",
      token: WEBHOOK_TOKEN,
    });
  } catch (error) {
    assert(error instanceof BillingPayloadError, "missing id/event rejected");
  }

  const eventId = `evt-pay-${suffix}`;
  const confirmed = await ingestAsaasWebhook({
    rawBody: webhookPayload({
      id: eventId,
      event: "PAYMENT_CONFIRMED",
      subscriptionId: created.asaasSubscriptionId!,
      customerId: companyA.asaasCustomerId!,
    }),
    token: WEBHOOK_TOKEN,
  });
  assert(!confirmed.duplicate, "first webhook processed");
  const active = await prisma.subscription.findUniqueOrThrow({
    where: { id: created.id },
  });
  assert(active.status === "ACTIVE", "payment confirmed activates");
  assert(await hasProductAccess(a.company.id, "ONE"), "ACTIVE has access");

  const replay = await ingestAsaasWebhook({
    rawBody: webhookPayload({
      id: eventId,
      event: "PAYMENT_CONFIRMED",
      subscriptionId: created.asaasSubscriptionId!,
    }),
    token: WEBHOOK_TOKEN,
  });
  assert(replay.duplicate, "duplicate webhook ignored");

  const overdue = await ingestAsaasWebhook({
    rawBody: webhookPayload({
      id: `evt-overdue-${suffix}`,
      event: "PAYMENT_OVERDUE",
      subscriptionId: created.asaasSubscriptionId!,
    }),
    token: WEBHOOK_TOKEN,
  });
  assert(!overdue.duplicate, "overdue processed");
  const pastDue = await prisma.subscription.findUniqueOrThrow({
    where: { id: created.id },
  });
  assert(pastDue.status === "PAST_DUE", "overdue maps to PAST_DUE");
  assert(await hasProductAccess(a.company.id, "ONE"), "PAST_DUE still has access");

  await ingestAsaasWebhook({
    rawBody: webhookPayload({
      id: `evt-fail-${suffix}`,
      event: "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
      subscriptionId: created.asaasSubscriptionId!,
    }),
    token: WEBHOOK_TOKEN,
  });
  const failedPay = await prisma.subscription.findUniqueOrThrow({
    where: { id: created.id },
  });
  assert(failedPay.status === "PAST_DUE", "failed card does not cancel");
  assert(failedPay.lastPaymentStatus === "FAILED", "failed payment recorded");

  const ignored = await ingestAsaasWebhook({
    rawBody: JSON.stringify({
      id: `evt-split-${suffix}`,
      event: "SUBSCRIPTION_SPLIT_DISABLED",
      subscription: { id: created.asaasSubscriptionId },
    }),
    token: WEBHOOK_TOKEN,
  });
  assert(ignored.status === "IGNORED", "unneeded events ignored");

  const notified = await prisma.notification.findMany({
    where: { companyId: a.company.id, type: "BILLING" },
  });
  assert(notified.length > 0, "billing notifications created");

  const audits = await prisma.auditLog.findMany({
    where: { companyId: a.company.id, module: "billing" },
  });
  const actions = new Set(audits.map((item) => item.action));
  assert(actions.has("SUBSCRIPTION_CREATED"), "audit created");
  assert(actions.has("SUBSCRIPTION_ACTIVATED") || actions.has("PAYMENT_CONFIRMED"), "audit payment");
  assert(actions.has("SUBSCRIPTION_PAST_DUE"), "audit past due");

  await expectThrow(
    () =>
      cancelSubscriptionForTenant({
        companyId: a.company.id,
        userId: manager.id,
        role: "MANAGER",
      }),
    "MANAGER cannot cancel",
  );

  const cancelled = await cancelSubscriptionForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    reason: "Encerramento de teste",
  });
  assert(cancelled.status === "CANCELLED", "cancelled locally");
  assert(cancelled.cancelledAt, "cancel date stored");
  assert(cancelled.cancelReason === "Encerramento de teste", "reason stored");
  assert(!(await hasProductAccess(a.company.id, "ONE")), "cancelled denied when enforced");

  const stillThere = await prisma.subscription.findUniqueOrThrow({
    where: { id: created.id },
  });
  assert(stillThere.id === created.id, "history not deleted");

  process.env.BILLING_ENFORCE = "false";
  assert(isBillingEnforced() === false, "enforce off");
  assert(await hasProductAccess(b.company.id, "ONE"), "unenforced tenant keeps access");
  process.env.BILLING_ENFORCE = "true";

  const reactivated = await createSubscriptionForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    planId: plan.id,
  });
  assert(reactivated.status === "PENDING", "reactivation creates pending");
  assert(
    reactivated.asaasSubscriptionId !== created.asaasSubscriptionId,
    "reactivation uses new external subscription",
  );

  await ingestAsaasWebhook({
    rawBody: webhookPayload({
      id: `evt-b-should-not-${suffix}`,
      event: "PAYMENT_CONFIRMED",
      subscriptionId: "sub_unknown_other_tenant",
    }),
    token: WEBHOOK_TOKEN,
  });
  const bAfter = await prisma.subscription.findUnique({
    where: { companyId_product: { companyId: b.company.id, product: "ONE" } },
  });
  assert(!bAfter, "unknown webhook does not create tenant B subscription");

  await syncSubscriptionFromProvider({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
  });

  if (process.env.BILLING_SANDBOX_SMOKE === "1") {
    throw new Error("Sandbox smoke must use a dedicated script with ASAAS_API_KEY; skipped in verify:billing");
  }

  console.log("VERIFY BILLING PASSED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
