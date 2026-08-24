import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import type { CustomerFormInput, CustomerListQuery } from "@/modules/crm/schemas/customer.schemas";
import {
  createCustomer,
  findCustomerById,
  findCustomers,
  listCompanyOwners,
  listCustomerOrigins,
  softDeleteCustomer,
  updateCustomer,
} from "@/modules/crm/repositories/customer.repository";

export function canManageCustomers(role: Role): boolean {
  return hasPermission(role, "crm:manage");
}

export function canViewCustomers(role: Role): boolean {
  return hasPermission(role, "crm:view");
}

export async function listCustomersForTenant(params: {
  companyId: string;
  role: Role;
  query: CustomerListQuery;
}) {
  assertPermission(params.role, "crm:view");
  return findCustomers({
    companyId: params.companyId,
    ...params.query,
  });
}

export async function getCustomerForTenant(params: {
  companyId: string;
  role: Role;
  customerId: string;
}) {
  assertPermission(params.role, "crm:view");
  return findCustomerById({
    companyId: params.companyId,
    customerId: params.customerId,
  });
}

export async function createCustomerForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: CustomerFormInput;
}) {
  assertPermission(params.role, "crm:manage");

  if (params.data.ownerId) {
    const owners = await listCompanyOwners(params.companyId);
    const valid = owners.some((m) => m.userId === params.data.ownerId);
    if (!valid) {
      throw new Error("Responsável inválido para esta empresa");
    }
  }

  const customer = await createCustomer({
    companyId: params.companyId,
    data: params.data,
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "CUSTOMER_CREATE",
    entity: "Customer",
    entityId: customer.id,
    metadata: { name: customer.name, status: customer.status },
  });

  return customer;
}

export async function updateCustomerForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  customerId: string;
  data: CustomerFormInput;
}) {
  assertPermission(params.role, "crm:manage");

  if (params.data.ownerId) {
    const owners = await listCompanyOwners(params.companyId);
    const valid = owners.some((m) => m.userId === params.data.ownerId);
    if (!valid) {
      throw new Error("Responsável inválido para esta empresa");
    }
  }

  const customer = await updateCustomer({
    companyId: params.companyId,
    customerId: params.customerId,
    data: params.data,
  });
  if (!customer) {
    throw new Error("Cliente não encontrado");
  }

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "CUSTOMER_UPDATE",
    entity: "Customer",
    entityId: customer.id,
    metadata: { name: customer.name, status: customer.status },
  });

  return customer;
}

export async function deleteCustomerForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  customerId: string;
}) {
  assertPermission(params.role, "crm:manage");

  const customer = await softDeleteCustomer({
    companyId: params.companyId,
    customerId: params.customerId,
  });
  if (!customer) {
    throw new Error("Cliente não encontrado");
  }

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "CUSTOMER_DELETE",
    entity: "Customer",
    entityId: customer.id,
    metadata: { name: customer.name },
  });

  return customer;
}

export async function getCustomerFormMeta(companyId: string) {
  const [origins, owners] = await Promise.all([
    listCustomerOrigins(companyId),
    listCompanyOwners(companyId),
  ]);
  return {
    origins,
    owners: owners.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
  };
}
