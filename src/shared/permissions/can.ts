import type { Role } from "@prisma/client";
import {
  assertPermission,
  hasPermission,
  listPermissions,
  type Permission,
} from "@/shared/permissions/rbac";

/** Central authorization helper: can(role, permission) */
export function can(role: Role, permission: Permission): boolean {
  return hasPermission(role, permission);
}

export { assertPermission, hasPermission, listPermissions };
export type { Permission };
