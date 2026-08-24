import Link from "next/link";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/shared/permissions/rbac";
import { cn } from "@/shared/utilities/cn";

export function CrmSubnav({
  role,
  active,
}: {
  role: Role;
  active: "customers" | "leads";
}) {
  const items = [
    hasPermission(role, "crm:view")
      ? { key: "customers" as const, href: "/app/crm", label: "Clientes" }
      : null,
    hasPermission(role, "crm:leads:view")
      ? { key: "leads" as const, href: "/app/crm/leads", label: "Leads" }
      : null,
  ].filter(Boolean) as Array<{
    key: "customers" | "leads";
    href: string;
    label: string;
  }>;

  if (items.length === 0) return null;

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-3">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            active === item.key
              ? "bg-emerald-50 font-medium text-emerald-900"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
