import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/shared/auth/auth";
import { validateMembership } from "@/modules/auth/services/auth.service";
import {
  assertPermission,
  hasPermission,
  type Permission,
} from "@/shared/permissions/rbac";

export type AppSessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  companyId: string;
  role: Role;
  emailVerified: Date | null;
};

export const getValidatedSessionUser = cache(async function getValidatedSessionUser(): Promise<AppSessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.companyId || !session.user.role) {
    return null;
  }

  const membership = await validateMembership({
    userId: session.user.id,
    companyId: session.user.companyId,
  });
  if (!membership) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    companyId: membership.companyId,
    role: membership.role,
    emailVerified: session.user.emailVerified ?? null,
  };
});

export async function requireSession(): Promise<AppSessionUser> {
  const user = await getValidatedSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(
  permission: Permission,
): Promise<AppSessionUser> {
  const user = await requireSession();
  if (!hasPermission(user.role, permission)) {
    redirect("/app");
  }
  assertPermission(user.role, permission);
  return user;
}

export function getUserInitials(
  name: string | null,
  email: string | null,
): string {
  if (name && name.trim().length > 0) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  return (email?.[0] ?? "U").toUpperCase();
}
