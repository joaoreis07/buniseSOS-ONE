import type { Role } from "@prisma/client";

export const PERMISSIONS = [
  "dashboard:view",
  "crm:view",
  "crm:manage",
  "crm:leads:view",
  "crm:leads:manage",
  "sales:view",
  "sales:manage",
  "products:view",
  "products:manage",
  "inventory:view",
  "inventory:manage",
  "finance:view",
  "finance:manage",
  "dre:view",
  "ecommerce:view",
  "ecommerce:manage",
  "reports:view",
  "settings:view",
  "settings:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, ReadonlyArray<Permission | "*">> = {
  ADMIN: ["*"],
  MANAGER: [
    "dashboard:view",
    "crm:view",
    "crm:manage",
    "crm:leads:view",
    "crm:leads:manage",
    "sales:view",
    "sales:manage",
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:manage",
    "finance:view",
    "finance:manage",
    "dre:view",
    "ecommerce:view",
    "ecommerce:manage",
    "reports:view",
    "settings:view",
    "settings:manage",
  ],
  SALES: [
    "dashboard:view",
    "crm:view",
    "crm:manage",
    "crm:leads:view",
    "crm:leads:manage",
    "sales:view",
    "sales:manage",
    "products:view",
    "reports:view",
  ],
  FINANCE: [
    "dashboard:view",
    "crm:view",
    "finance:view",
    "finance:manage",
    "dre:view",
    "reports:view",
    "sales:view",
  ],
  INVENTORY: [
    "dashboard:view",
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:manage",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return granted.includes("*") || granted.includes(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("Você não tem permissão para esta ação");
  }
}

export function listPermissions(role: Role): Permission[] {
  if (ROLE_PERMISSIONS[role].includes("*")) {
    return [...PERMISSIONS];
  }
  return ROLE_PERMISSIONS[role].filter(
    (permission): permission is Permission => permission !== "*",
  );
}
