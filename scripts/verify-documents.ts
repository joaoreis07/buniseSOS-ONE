/**
 * Operational documents verification (FASE 14) — BusinessOS One only.
 * Run: npm run verify:documents
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import { completeSaleForTenant } from "../src/modules/sales/services/sale.service";
import { createPurchaseForTenant } from "../src/modules/purchases/services/purchase.service";
import {
  getPaymentReceiptView,
  getPurchaseRecordView,
  getSaleReceiptView,
  renderSaleReceiptPdf,
} from "../src/modules/documents/services/document.service";
import { formatOperationalDocumentNumber } from "../src/modules/documents/lib/document-labels";

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

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

  assert(hasPermission("SALES", "sales:view"), "SALES receipts via sales:view");
  assert(!hasPermission("SALES", "finance:view"), "SALES no payment receipts");
  assert(hasPermission("FINANCE", "finance:view"), "FINANCE payment receipts");
  assert(hasPermission("INVENTORY", "purchases:view"), "INVENTORY purchase docs");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin Docs A",
    email: `doc-a-${suffix}@example.com`,
    companyName: `Empresa Docs A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin Docs B",
    email: `doc-b-${suffix}@example.com`,
    companyName: `Empresa Docs B ${suffix}`,
  });
  const salesUser = await addMember({
    companyId: a.company.id,
    name: "Vendedor Docs",
    email: `doc-sales-${suffix}@example.com`,
    role: "SALES",
  });
  const financeUser = await addMember({
    companyId: a.company.id,
    name: "Financeiro Docs",
    email: `doc-fin-${suffix}@example.com`,
    role: "FINANCE",
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente Docs ${suffix}`,
      status: "ACTIVE",
    },
  });
  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço Docs ${suffix}`,
      sku: `DOC-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 80,
    },
  });
  const physical = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Docs ${suffix}`,
      sku: `DOCP-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 20,
      costPrice: 8,
    },
  });
  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: physical.id,
      quantity: 20,
      minimumQuantity: 0,
    },
  });

  const sale1 = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
          customerId: customer.id,
          paymentMethod: "PIX",
          discountAmount: 0,
          notes: null,
          items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const sale2 = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
          customerId: customer.id,
          paymentMethod: "PIX",
          discountAmount: 0,
          notes: null,
          items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });

  const [first, second] = await Promise.all([
    getSaleReceiptView({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      saleId: sale1.id,
    }),
    getSaleReceiptView({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      saleId: sale2.id,
    }),
  ]);
  assert(first.document.number !== second.document.number, "concurrent numbers differ");
  assert(
    new Set([first.document.number, second.document.number]).size === 2,
    "unique receipt numbers",
  );

  const reprint = await getSaleReceiptView({
    companyId: a.company.id,
    userId: salesUser.id,
    role: "SALES",
    saleId: sale1.id,
  });
  assert(reprint.document.number === first.document.number, "reprint keeps number");
  assert(reprint.company.displayName.includes("Docs A"), "tenant A branding");
  assert(reprint.fields.some((field) => field.value === customer.name), "customer on receipt");

  await expectThrow(
    () =>
      getSaleReceiptView({
        companyId: b.company.id,
        userId: b.user.id,
        role: "ADMIN",
        saleId: sale1.id,
      }),
    "IDOR sale receipt blocked",
  );

  await expectThrow(
    () =>
      getPurchaseRecordView({
        companyId: a.company.id,
        userId: salesUser.id,
        role: "SALES",
        purchaseId: "clxxxxxxxxxxxxxxxxxxxx",
      }),
    "SALES cannot view purchase document",
  );

  const pdf = await renderSaleReceiptPdf({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    saleId: sale1.id,
  });
  assert(Buffer.from(pdf.bytes).subarray(0, 4).toString() === "%PDF", "pdf header");
  assert(
    formatOperationalDocumentNumber("SALE_RECEIPT", first.document.number).startsWith("RV-"),
    "sale receipt prefix",
  );

  const payment = await prisma.installmentPayment.findFirstOrThrow({
    where: {
      companyId: a.company.id,
      installment: { accountReceivable: { saleId: sale1.id } },
    },
  });
  const proof = await getPaymentReceiptView({
    companyId: a.company.id,
    userId: financeUser.id,
    role: "FINANCE",
    paymentId: payment.id,
  });
  assert(proof.document.kind === "PAYMENT_RECEIPT", "payment kind");
  assert(proof.fields.some((field) => field.label === "Parcela"), "installment on proof");
  await expectThrow(
    () =>
      getPaymentReceiptView({
        companyId: b.company.id,
        userId: b.user.id,
        role: "ADMIN",
        paymentId: payment.id,
      }),
    "IDOR payment receipt blocked",
  );
  await expectThrow(
    () =>
      getPaymentReceiptView({
        companyId: a.company.id,
        userId: salesUser.id,
        role: "SALES",
        paymentId: payment.id,
      }),
    "SALES cannot issue payment proof",
  );

  const supplier = await prisma.supplier.create({
    data: {
      companyId: a.company.id,
      name: `Fornecedor Docs ${suffix}`,
      status: "ACTIVE",
    },
  });
  const purchase = await createPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      supplierId: supplier.id,
      discountAmount: 0,
      notes: "Compra docs",
      items: [{ productId: physical.id, quantity: 2, unitCost: 8, discountAmount: 0 }],
    },
  });
  const purchaseDoc = await getPurchaseRecordView({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    purchaseId: purchase.id,
  });
  assert(purchaseDoc.document.kind === "PURCHASE_RECORD", "purchase kind");
  assert(purchaseDoc.lines.length === 1, "purchase lines");
  await expectThrow(
    () =>
      getPurchaseRecordView({
        companyId: b.company.id,
        userId: b.user.id,
        role: "ADMIN",
        purchaseId: purchase.id,
      }),
    "IDOR purchase document blocked",
  );

  const docCountA = await prisma.operationalDocument.count({
    where: { companyId: a.company.id },
  });
  const docCountB = await prisma.operationalDocument.count({
    where: { companyId: b.company.id },
  });
  assert(docCountA >= 3, "tenant A documents exist");
  assert(docCountB === 0, "tenant B has no documents");

  const generated = await prisma.auditLog.findMany({
    where: {
      companyId: a.company.id,
      action: { in: ["RECEIPT_GENERATED", "DOCUMENT_GENERATED"] },
    },
  });
  assert(
    generated.some((item) => item.action === "RECEIPT_GENERATED"),
    "receipt audit",
  );
  assert(
    generated.some((item) => item.action === "DOCUMENT_GENERATED"),
    "purchase document audit",
  );

  console.log("DOCUMENTS VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
