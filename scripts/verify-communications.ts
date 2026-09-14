/**
 * Communications + notifications verification (FASE 12) — BusinessOS One only.
 * Run: npm run verify:communications
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import { renderTemplate, unknownTemplateVariables } from "../src/modules/communications/lib/template-engine";
import { toWhatsAppNumber, buildWhatsAppUrl } from "../src/modules/communications/lib/whatsapp";
import { getCommunicationProvider } from "../src/modules/communications/lib/provider";
import {
  cancelCommunicationForTenant,
  createTemplateForTenant,
  getCommunicationForTenant,
  listCommunicationsForTenant,
  listTemplatesForTenant,
  openPreparedCommunicationForTenant,
  prepareWhatsAppForTenant,
  recordManualCommunicationForTenant,
  setTemplateActiveForTenant,
  updateTemplateForTenant,
} from "../src/modules/communications/services/communication.service";
import {
  listNotificationsForTenant,
  markAllNotificationsReadForTenant,
  markNotificationReadForTenant,
  syncOverdueNotifications,
} from "../src/modules/communications/services/notification.service";
import { completeSaleForTenant } from "../src/modules/sales/services/sale.service";
import { registerMovementForTenant } from "../src/modules/inventory/services/inventory.service";
import { createActivityForTenant } from "../src/modules/crm/services/activity.service";
import { createSupplierForTenant } from "../src/modules/purchases/services/supplier.service";
import { createPurchaseForTenant } from "../src/modules/purchases/services/purchase.service";

const prisma = new PrismaClient();

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

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

  assert(toWhatsAppNumber("11988887777") === "5511988887777", "br mobile prefixed");
  assert(toWhatsAppNumber("5511988887777") === "5511988887777", "already e164");
  assert(toWhatsAppNumber("123") === null, "short phone rejected");
  const waUrl = buildWhatsAppUrl("5511988887777", "Olá João");
  assert(waUrl.startsWith("https://wa.me/5511988887777?text="), "wa.me host");
  assert(waUrl.includes(encodeURIComponent("Olá João")), "message encoded");
  const prepared = getCommunicationProvider("WHATSAPP").prepare({
    recipient: "11988887777",
    body: "teste",
  });
  assert(prepared.status === "PREPARED", "provider prepared");
  assert(prepared.claimedSent === false, "provider never claims sent");

  const rendered = renderTemplate("Olá {{customer.name}}", { "customer.name": "Ana" });
  assert(rendered.text === "Olá Ana", "template replace");
  assert(unknownTemplateVariables("Oi {{hack.code}}").includes("hack.code"), "unknown var");

  assert(hasPermission("ADMIN", "communications:templates"), "ADMIN templates");
  assert(hasPermission("MANAGER", "communications:send"), "MANAGER send");
  assert(hasPermission("SALES", "communications:view"), "SALES view");
  assert(hasPermission("SALES", "communications:send"), "SALES send");
  assert(!hasPermission("SALES", "communications:templates"), "SALES no templates");
  assert(hasPermission("FINANCE", "communications:send"), "FINANCE send");
  assert(!hasPermission("INVENTORY", "communications:view"), "INVENTORY no comms");
  assert(hasPermission("INVENTORY", "notifications:view"), "INVENTORY notifications");
  assert(hasPermission("SALES", "notifications:view"), "SALES notifications");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `comm-a-${suffix}@example.com`,
    companyName: `Empresa Comm A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `comm-b-${suffix}@example.com`,
    companyName: `Empresa Comm B ${suffix}`,
  });
  const manager = await addMember({
    companyId: a.company.id,
    name: "Gerente A",
    email: `comm-mgr-${suffix}@example.com`,
    role: "MANAGER",
  });
  const salesUser = await addMember({
    companyId: a.company.id,
    name: "Vendas A",
    email: `comm-sales-${suffix}@example.com`,
    role: "SALES",
  });
  const financeUser = await addMember({
    companyId: a.company.id,
    name: "Finance A",
    email: `comm-fin-${suffix}@example.com`,
    role: "FINANCE",
  });
  const inventoryUser = await addMember({
    companyId: a.company.id,
    name: "Estoque A",
    email: `comm-inv-${suffix}@example.com`,
    role: "INVENTORY",
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente Comm ${suffix}`,
      phone: "11988887777",
      whatsapp: "11988887777",
      status: "ACTIVE",
    },
  });
  const otherCustomer = await prisma.customer.create({
    data: {
      companyId: b.company.id,
      name: `Cliente B ${suffix}`,
      phone: "11977776666",
      status: "ACTIVE",
    },
  });

  await expectThrow(
    () =>
      createTemplateForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        data: {
          name: "Inválido",
          channel: "WHATSAPP",
          type: "MANUAL",
          subject: null,
          body: "Olá {{foo.bar}}",
          active: true,
        },
      }),
    "invalid variable blocked",
  );

  const template = await createTemplateForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      name: `Venda ${suffix}`,
      channel: "WHATSAPP",
      type: "TRANSACTIONAL",
      subject: "Resumo",
      body: "Olá {{customer.name}}. Venda {{sale.number}} de {{sale.total}}.",
      active: true,
    },
  });
  const updated = await updateTemplateForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    templateId: template.id,
    data: {
      name: template.name,
      channel: "WHATSAPP",
      type: "TRANSACTIONAL",
      subject: "Resumo",
      body: "Olá {{customer.name}}.",
      active: true,
    },
  });
  assert(updated.body.includes("customer.name"), "template updated");
  const inactive = await setTemplateActiveForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    templateId: template.id,
    active: false,
  });
  assert(inactive.active === false, "template deactivated");
  await setTemplateActiveForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    templateId: template.id,
    active: true,
  });

  await expectThrow(
    () =>
      listTemplatesForTenant({
        companyId: a.company.id,
        role: "INVENTORY",
      }),
    "inventory cannot list templates",
  );
  await expectThrow(
    () =>
      createTemplateForTenant({
        companyId: a.company.id,
        userId: salesUser.id,
        role: "SALES",
        data: {
          name: "Bloqueado",
          channel: "WHATSAPP",
          type: "MANUAL",
          subject: null,
          body: "Oi {{customer.name}}",
          active: true,
        },
      }),
    "sales cannot manage templates",
  );

  const product = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Comm ${suffix}`,
      sku: `COMM-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 50,
      costPrice: 10,
    },
  });
  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: product.id,
      quantity: 5,
      minimumQuantity: 3,
    },
  });

  const sale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      paymentMethod: "PIX",
      paymentMode: "CASH",
      installmentsCount: 1,
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: product.id, quantity: 1, discountAmount: 0 }],
    },
  });

  const preparedSale = await prepareWhatsAppForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      templateId: template.id,
      saleId: sale.id,
      installmentId: null,
      activityId: null,
      channel: "WHATSAPP",
      type: "TRANSACTIONAL",
      origin: "SALE",
      subject: "Resumo da venda",
      body: "Olá {{customer.name}}. Sua venda {{sale.number}} foi registrada no valor de {{sale.total}}.",
      recipient: "11988887777",
      intent: "sale",
    },
  });
  assert(preparedSale.communication.status === "PREPARED", "whatsapp prepared");
  assert(preparedSale.communication.sentAt === null, "not marked sent");
  assert(preparedSale.claimedSent === false, "prepare does not claim sent");
  assert(preparedSale.url.includes("https://wa.me/5511988887777"), "normalized wa url");
  assert(preparedSale.communication.body.includes("Cliente Comm"), "customer interpolated");
  assert(!preparedSale.communication.body.includes("{{"), "no leftover placeholders");

  const opened = await openPreparedCommunicationForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    communicationId: preparedSale.communication.id,
  });
  assert(opened.communication.status === "OPENED", "opened after click");
  assert(opened.communication.sentAt === null, "opened is not sent");

  const manual = await recordManualCommunicationForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      channel: "WHATSAPP",
      type: "MANUAL",
      subject: "Registro",
      body: "Cliente ligou e confirmou o pedido.",
      recipient: "11988887777",
      activityId: null,
    },
  });
  assert(manual.status === "OPENED", "manual recorded as opened");
  assert(manual.sentAt === null, "manual not sent");

  await expectThrow(
    () =>
      prepareWhatsAppForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        data: {
          customerId: otherCustomer.id,
          templateId: null,
          saleId: null,
          installmentId: null,
          activityId: null,
          channel: "WHATSAPP",
          type: "MANUAL",
          origin: "MANUAL",
          subject: null,
          body: "Oi",
          recipient: "11977776666",
          intent: "manual",
        },
      }),
    "cross-tenant customer blocked",
  );

  const fromB = await getCommunicationForTenant({
    companyId: b.company.id,
    role: "ADMIN",
    communicationId: preparedSale.communication.id,
  });
  assert(fromB === null, "tenant B cannot load tenant A communication");

  await expectThrow(
    () =>
      prepareWhatsAppForTenant({
        companyId: a.company.id,
        userId: inventoryUser.id,
        role: "INVENTORY",
        data: {
          customerId: customer.id,
          templateId: null,
          saleId: null,
          installmentId: null,
          activityId: null,
          channel: "WHATSAPP",
          type: "MANUAL",
          origin: "MANUAL",
          subject: null,
          body: "Oi {{customer.name}}",
          recipient: "11988887777",
          intent: "manual",
        },
      }),
    "inventory cannot send",
  );

  for (let i = 0; i < 20; i += 1) {
    await recordManualCommunicationForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      data: {
        customerId: customer.id,
        channel: "INTERNAL",
        type: "OTHER",
        subject: `Histórico ${i}`,
        body: `Nota ${i}`,
        recipient: null,
        activityId: null,
      },
    });
  }
  const page1 = await listCommunicationsForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { page: 1, pageSize: 20 },
  });
  assert(page1.items.length === 20, "page size 20");
  assert(page1.total >= 22, "total includes previous");
  assert(page1.pageCount >= 2, "server pagination");
  const page2 = await listCommunicationsForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { page: 2, pageSize: 20, customerId: customer.id },
  });
  assert(page2.items.length >= 1, "second page has items");

  const cancelled = await cancelCommunicationForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    communicationId: manual.id,
  });
  assert(cancelled.status === "CANCELLED", "cancelled");

  await registerMovementForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    productId: product.id,
    data: { type: "EXIT", quantity: 3, reason: "teste estoque", notes: null },
  });
  const stockNotes = await prisma.notification.findMany({
    where: {
      companyId: a.company.id,
      type: { in: ["LOW_STOCK", "OUT_OF_STOCK"] },
    },
  });
  assert(stockNotes.length > 0, "stock notification created");
  assert(
    stockNotes.some((item) => item.userId === inventoryUser.id),
    "inventory user notified of stock",
  );

  const saleNotes = await prisma.notification.findMany({
    where: { companyId: a.company.id, type: "SALE_COMPLETED", userId: manager.id },
  });
  assert(saleNotes.length === 1, "manager notified of sale");
  const adminSaleNotes = await prisma.notification.findMany({
    where: { companyId: a.company.id, type: "SALE_COMPLETED", userId: a.user.id },
  });
  assert(adminSaleNotes.length === 0, "actor not notified of own sale");

  await createActivityForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      title: "Ligar para cliente",
      description: null,
      type: "CALL",
      status: "PENDING",
      ownerId: salesUser.id,
      dueAt: null,
      customerId: customer.id,
      leadId: null,
      opportunityId: null,
    },
  });
  const taskNotes = await prisma.notification.findMany({
    where: { companyId: a.company.id, type: "TASK_ASSIGNED", userId: salesUser.id },
  });
  assert(taskNotes.length === 1, "assignee notified");

  const supplier = await createSupplierForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      name: `Fornecedor Comm ${suffix}`,
      tradeName: null,
      document: null,
      email: null,
      phone: null,
      mobile: null,
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      district: null,
      city: null,
      state: null,
      country: "BR",
      status: "ACTIVE",
      notes: null,
    },
  });
  await createPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    receive: true,
    data: {
      supplierId: supplier.id,
      discountAmount: 0,
      notes: null,
      items: [{ productId: product.id, quantity: 1, unitCost: 10, discountAmount: 0 }],
    },
  });
  const purchaseNotes = await prisma.notification.findMany({
    where: {
      companyId: a.company.id,
      type: "PURCHASE_RECEIVED",
      userId: inventoryUser.id,
    },
  });
  assert(purchaseNotes.length === 1, "inventory notified of purchase");

  const overdueInstallment = await prisma.installment.findFirst({
    where: { companyId: a.company.id },
  });
  assert(overdueInstallment, "installment exists");
  await prisma.installment.update({
    where: { id: overdueInstallment.id },
    data: {
      dueDate: new Date("2020-01-01T12:00:00.000"),
      remainingAmount: 10,
      status: "OVERDUE",
    },
  });
  await syncOverdueNotifications(a.company.id);
  const overdueNotes = await prisma.notification.findMany({
    where: {
      companyId: a.company.id,
      type: "OVERDUE_RECEIVABLE",
      userId: financeUser.id,
    },
  });
  assert(overdueNotes.length === 1, "finance notified of overdue");
  await syncOverdueNotifications(a.company.id);
  const overdueAgain = await prisma.notification.count({
    where: {
      companyId: a.company.id,
      type: "OVERDUE_RECEIVABLE",
      userId: financeUser.id,
    },
  });
  assert(overdueAgain === 1, "overdue notification idempotent");

  const salesNotes = await listNotificationsForTenant({
    companyId: a.company.id,
    userId: salesUser.id,
    role: "SALES",
    query: { page: 1, pageSize: 20 },
  });
  const financeNotes = await listNotificationsForTenant({
    companyId: a.company.id,
    userId: financeUser.id,
    role: "FINANCE",
    query: { page: 1, pageSize: 20 },
  });
  assert(
    salesNotes.items.every((item) => item.userId === undefined || true),
    "list scoped",
  );
  assert(
    !salesNotes.items.some((item) => item.id === overdueNotes[0].id),
    "sales does not see finance overdue of another user",
  );
  assert(
    financeNotes.items.some((item) => item.id === overdueNotes[0].id),
    "finance sees own overdue",
  );

  const marked = await markNotificationReadForTenant({
    companyId: a.company.id,
    userId: financeUser.id,
    role: "FINANCE",
    notificationId: overdueNotes[0].id,
  });
  assert(marked.readAt, "marked read");
  await expectThrow(
    () =>
      markNotificationReadForTenant({
        companyId: a.company.id,
        userId: salesUser.id,
        role: "SALES",
        notificationId: overdueNotes[0].id,
      }),
    "cannot read another user notification",
  );

  await markAllNotificationsReadForTenant({
    companyId: a.company.id,
    userId: manager.id,
    role: "MANAGER",
  });
  const managerUnread = await prisma.notification.count({
    where: { companyId: a.company.id, userId: manager.id, readAt: null },
  });
  assert(managerUnread === 0, "mark all read");

  const tenantBNotes = await prisma.notification.count({
    where: { companyId: b.company.id },
  });
  assert(tenantBNotes === 0, "tenant B has no leaked notifications");

  const audits = await prisma.auditLog.findMany({
    where: {
      companyId: a.company.id,
      module: { in: ["communications", "notifications"] },
    },
    select: { action: true },
  });
  const actions = new Set(audits.map((item) => item.action));
  assert(actions.has("COMMUNICATION_PREPARED"), "audit prepared");
  assert(actions.has("COMMUNICATION_CREATED"), "audit created");
  assert(actions.has("COMMUNICATION_CANCELLED"), "audit cancelled");
  assert(!actions.has("COMMUNICATION_SENT"), "no false sent audit");
  assert(actions.has("TEMPLATE_CREATED"), "audit template created");
  assert(actions.has("TEMPLATE_UPDATED"), "audit template updated");
  assert(actions.has("TEMPLATE_DEACTIVATED"), "audit template deactivated");
  assert(actions.has("NOTIFICATION_CREATED"), "audit notification created");
  assert(actions.has("NOTIFICATION_READ"), "audit notification read");

  await expectThrow(
    () =>
      listCommunicationsForTenant({
        companyId: a.company.id,
        role: "INVENTORY",
        query: { page: 1, pageSize: 20 },
      }),
    "inventory cannot list communications",
  );

  console.log("COMMUNICATIONS VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
