import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import type {
  SupplierFormInput,
  SupplierListQuery,
} from "@/modules/purchases/schemas/supplier.schemas";
import { assertPlanLimit } from "@/modules/billing/services/entitlements.service";
import {
  createSupplier,
  findSupplierById,
  findSuppliers,
  getSupplierMetrics,
  listActiveSuppliers,
  updateSupplier,
} from "@/modules/purchases/repositories/supplier.repository";

export function canViewSuppliers(role: Role) {
  return hasPermission(role, "suppliers:view");
}

export function canManageSuppliers(role: Role) {
  return hasPermission(role, "suppliers:manage");
}

export async function listSuppliersForTenant(params: {
  companyId: string;
  role: Role;
  query: SupplierListQuery;
}) {
  assertPermission(params.role, "suppliers:view");
  return findSuppliers({ companyId: params.companyId, ...params.query });
}

export async function getSupplierForTenant(params: {
  companyId: string;
  role: Role;
  supplierId: string;
}) {
  assertPermission(params.role, "suppliers:view");
  const supplier = await findSupplierById(params);
  if (!supplier) return null;
  const metrics = await getSupplierMetrics(params);
  return { ...supplier, metrics };
}

export async function createSupplierForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: SupplierFormInput;
}) {
  assertPermission(params.role, "suppliers:manage");
  await assertPlanLimit({ companyId: params.companyId, feature: "suppliers" });
  const supplier = await createSupplier({
    companyId: params.companyId,
    data: params.data,
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "purchases",
    action: "SUPPLIER_CREATED",
    entity: "Supplier",
    entityId: supplier.id,
    metadata: { name: supplier.name, status: supplier.status },
  });
  return supplier;
}

export async function updateSupplierForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  supplierId: string;
  data: SupplierFormInput;
}) {
  assertPermission(params.role, "suppliers:manage");
  const supplier = await updateSupplier(params);
  if (!supplier) throw new Error("Fornecedor não encontrado");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "purchases",
    action: "SUPPLIER_UPDATED",
    entity: "Supplier",
    entityId: supplier.id,
    metadata: { name: supplier.name, status: supplier.status },
  });
  return supplier;
}

export async function listActiveSuppliersForTenant(companyId: string) {
  return listActiveSuppliers(companyId);
}
