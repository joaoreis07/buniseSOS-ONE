/**
 * CRM customers verification (FASE 4.1 + FASE 11) — BusinessOS One only.
 * Run: npm run verify:customers
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import {
  createCustomerForTenant,
  getCustomerProfileForTenant,
  listCustomersForTenant,
  updateCustomerForTenant,
} from "../src/modules/crm/services/customer.service";
import { completeSaleForTenant } from "../src/modules/sales/services/sale.service";
import { cancelSaleForTenant } from "../src/modules/sales/services/sale.service";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function registerTenant(input: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const passwordHash = await hash(input.password, 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      },
    });
    const company = await tx.company.create({
      data: { name: input.companyName },
    });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "ADMIN" },
    });
    return { user, company };
  });
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

const blankCustomer = {
  type: "INDIVIDUAL" as const,
  tradeName: null,
  document: null,
  email: null,
  phone: null,
  mobile: null,
  whatsapp: null,
  zipCode: null,
  street: null,
  number: null,
  complement: null,
  district: null,
  city: null,
  state: null,
  country: "BR",
  status: "ACTIVE" as const,
  origin: null,
  notes: null,
  ownerId: null,
};

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

  const suffix = randomBytes(3).toString("hex");
  const password = "TestPass123!";

  const a = await registerTenant({
    name: "Admin A",
    email: `crm-a-${suffix}@example.com`,
    password,
    companyName: `Empresa CRM A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `crm-b-${suffix}@example.com`,
    password,
    companyName: `Empresa CRM B ${suffix}`,
  });

  const customerA = await createCustomerForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      ...blankCustomer,
      name: "Cliente Alpha",
      email: `alpha-${suffix}@example.com`,
      document: "12345678901",
      phone: "11999990000",
      origin: "Indicação",
      ownerId: a.user.id,
    },
  });
  const customerB = await createCustomerForTenant({
    companyId: b.company.id,
    userId: b.user.id,
    role: "ADMIN",
    data: {
      ...blankCustomer,
      name: "Cliente Beta",
      email: `beta-${suffix}@example.com`,
      document: "12345678901",
      origin: "Site",
    },
  });
  assert(customerB.document === "12345678901", "same document allowed in other tenant");

  const listedA = await listCustomersForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { q: "Alpha", page: 1, pageSize: 20 },
  });
  assert(listedA.items.length === 1, "search should find customer A");
  assert(
    listedA.items.every((item) => item.id !== customerB.id),
    "tenant A must not see customer B",
  );

  await expectThrow(
    () =>
      createCustomerForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        data: {
          ...blankCustomer,
          name: "Duplicado doc",
          document: "123.456.789-01",
        },
      }),
    "duplicate document blocked",
  );
  await expectThrow(
    () =>
      createCustomerForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        data: {
          ...blankCustomer,
          name: "Duplicado email",
          email: `ALPHA-${suffix}@example.com`,
        },
      }),
    "duplicate email blocked",
  );
  await expectThrow(
    () =>
      createCustomerForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        data: {
          ...blankCustomer,
          name: "Duplicado fone",
          phone: "(11) 99999-0000",
        },
      }),
    "duplicate phone blocked",
  );

  const noId1 = await createCustomerForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: { ...blankCustomer, name: `Sem id 1 ${suffix}` },
  });
  const noId2 = await createCustomerForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: { ...blankCustomer, name: `Sem id 2 ${suffix}` },
  });
  assert(noId1.id !== noId2.id, "customers without identifier are allowed");

  const updated = await updateCustomerForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    customerId: customerA.id,
    data: {
      ...blankCustomer,
      name: customerA.name,
      email: customerA.email,
      document: customerA.document,
      phone: customerA.phone,
      city: "São Paulo",
      status: "INACTIVE",
      origin: customerA.origin,
      ownerId: a.user.id,
    },
  });
  assert(updated.city === "São Paulo", "update city");
  assert(updated.status === "INACTIVE", "update status");

  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço ${suffix}`,
      sku: `CRM-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 100,
    },
  });
  await prisma.customer.update({
    where: { id: customerA.id },
    data: { status: "ACTIVE" },
  });

  const sale1 = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customerA.id,
      paymentMethod: "PIX",
      paymentMode: "CASH",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customerA.id,
      paymentMethod: "TED",
      paymentMode: "INSTALLMENT",
      installmentsCount: 1,
      firstDueDate: "2020-01-10",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 2, discountAmount: 0 }],
    },
  });
  const cancelled = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customerA.id,
      paymentMethod: "PIX",
      paymentMode: "INSTALLMENT",
      installmentsCount: 1,
      firstDueDate: "2026-12-01",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  await cancelSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    saleId: cancelled.id,
  });

  const profile = await getCustomerProfileForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    customerId: customerA.id,
  });
  assert(profile?.overview?.sales?.count === 2, "cancelled excluded from count");
  assert(profile?.overview?.sales?.total === 300, "100 + 200");
  assert(profile?.overview?.sales?.ticket === 150, "ticket 300/2");
  assert(profile?.overview?.finance?.open === 200, "unpaid installment open");
  assert(profile?.overview?.finance?.overdue === 200, "overdue installment");
  assert(
    profile?.overview?.products.some((item) => item.quantity === 3),
    "top product qty 1+2",
  );

  const withSales = await listCustomersForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { commerce: "with_sales", page: 1, pageSize: 20 },
  });
  assert(
    withSales.items.some((item) => item.id === customerA.id),
    "with_sales includes buyer",
  );
  assert(
    withSales.items.every((item) => item.id !== noId1.id),
    "with_sales excludes customers without completed sales",
  );

  const overdue = await listCustomersForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { balance: "overdue", page: 1, pageSize: 20 },
  });
  assert(
    overdue.items.some((item) => item.id === customerA.id),
    "overdue filter",
  );
  const metrics = withSales.items.find((item) => item.id === customerA.id)?.metrics;
  assert(metrics && metrics.salesCount === 2, "list metrics sales count");
  assert(metrics && metrics.salesTotal === 300, "list metrics total");
  assert(metrics && metrics.openBalance === 200, "list metrics open balance");

  const salesRole = await getCustomerProfileForTenant({
    companyId: a.company.id,
    role: "SALES",
    customerId: customerA.id,
  });
  assert(salesRole?.sections.sales, "SALES sees commercial");
  assert(!salesRole?.sections.finance, "SALES no finance");
  assert(salesRole?.overview?.sales, "SALES sales overview");
  assert(!salesRole?.overview?.finance, "SALES finance hidden");

  const foreignProfile = await getCustomerProfileForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    customerId: customerB.id,
  });
  assert(!foreignProfile, "cannot load other tenant customer");

  void sale1;
  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  assert(hasPermission("ADMIN", "crm:manage"), "ADMIN manage");
  assert(hasPermission("SALES", "crm:manage"), "SALES manage");
  assert(hasPermission("FINANCE", "crm:view"), "FINANCE view");
  assert(!hasPermission("FINANCE", "crm:manage"), "FINANCE no manage");
  assert(!hasPermission("INVENTORY", "crm:view"), "INVENTORY no crm");
  for (const role of roles) {
    assert(typeof hasPermission(role, "crm:view") === "boolean", `role ${role}`);
  }

  console.log("OK customers CRUD + soft identifiers");
  console.log("OK duplicate protection + tenant isolation");
  console.log("OK 360 sales/finance + list filters");
  console.log("OK RBAC matrix for CRM");
  console.log("CUSTOMERS VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("CUSTOMERS VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
