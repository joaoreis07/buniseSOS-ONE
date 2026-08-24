import type { CustomerStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type { CustomerFormInput, CustomerListQuery } from "@/modules/crm/schemas/customer.schemas";

function digitsOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function toCustomerData(input: CustomerFormInput): Prisma.CustomerUncheckedCreateInput {
  return {
    companyId: "", // filled by caller
    type: input.type,
    name: input.name.trim(),
    tradeName: input.tradeName,
    document: digitsOnly(input.document),
    email: input.email?.toLowerCase() ?? null,
    phone: input.phone,
    mobile: input.mobile,
    whatsapp: input.whatsapp,
    zipCode: digitsOnly(input.zipCode),
    street: input.street,
    number: input.number,
    complement: input.complement,
    district: input.district,
    city: input.city,
    state: input.state?.toUpperCase() ?? null,
    country: input.country || "BR",
    status: input.status,
    origin: input.origin,
    notes: input.notes,
    ownerId: input.ownerId,
  };
}

export type CustomerListFilters = CustomerListQuery & {
  companyId: string;
};

export async function findCustomers(filters: CustomerListFilters) {
  const where: Prisma.CustomerWhereInput = {
    companyId: filters.companyId,
    ...notDeletedFilter,
  };

  if (filters.status) {
    where.status = filters.status as CustomerStatus;
  }
  if (filters.origin) {
    where.origin = { equals: filters.origin, mode: "insensitive" };
  }
  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt.gte = new Date(`${filters.createdFrom}T00:00:00.000Z`);
    }
    if (filters.createdTo) {
      where.createdAt.lte = new Date(`${filters.createdTo}T23:59:59.999Z`);
    }
  }

  const q = filters.q?.trim();
  if (q) {
    const qDigits = q.replace(/\D/g, "");
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tradeName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q, mode: "insensitive" } },
      ...(qDigits.length > 0
        ? [{ document: { contains: qDigits } }]
        : []),
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;

  const [total, items] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function findCustomerById(params: {
  companyId: string;
  customerId: string;
}) {
  return prisma.customer.findFirst({
    where: {
      id: params.customerId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createCustomer(params: {
  companyId: string;
  data: CustomerFormInput;
}) {
  const data = toCustomerData(params.data);
  return prisma.customer.create({
    data: {
      ...data,
      companyId: params.companyId,
    },
  });
}

export async function updateCustomer(params: {
  companyId: string;
  customerId: string;
  data: CustomerFormInput;
}) {
  const existing = await findCustomerById({
    companyId: params.companyId,
    customerId: params.customerId,
  });
  if (!existing) {
    return null;
  }

  const data = toCustomerData(params.data);
  // companyId is immutable — never update from form/client
  const { companyId, ...updateData } = data;
  void companyId;

  return prisma.customer.update({
    where: { id: existing.id },
    data: updateData,
  });
}

export async function softDeleteCustomer(params: {
  companyId: string;
  customerId: string;
}) {
  const existing = await findCustomerById({
    companyId: params.companyId,
    customerId: params.customerId,
  });
  if (!existing) {
    return null;
  }

  return prisma.customer.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
}

export async function listCustomerOrigins(companyId: string) {
  const rows = await prisma.customer.findMany({
    where: {
      companyId,
      ...notDeletedFilter,
      origin: { not: null },
    },
    distinct: ["origin"],
    select: { origin: true },
    orderBy: { origin: "asc" },
  });
  return rows
    .map((row) => row.origin)
    .filter((origin): origin is string => Boolean(origin));
}

export async function listCompanyOwners(companyId: string) {
  return prisma.membership.findMany({
    where: { companyId, ...notDeletedFilter },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
