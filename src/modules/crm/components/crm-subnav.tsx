import Link from "next/link";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/shared/permissions/rbac";
import { cn } from "@/shared/utilities/cn";

type CrmTab =
  | "customers"
  | "leads"
  | "opportunities"
  | "pipeline"
  | "activities"
  | "dashboard";

export function CrmSubnav({
  role,
  active,
}: {
  role: Role;
  active: CrmTab;
}) {
  const items = [
    hasPermission(role, "crm:dashboard:view")
      ? {
          key: "dashboard" as const,
          href: "/app/crm/dashboard",
          label: "Dashboard",
        }
      : null,
    hasPermission(role, "crm:view")
      ? { key: "customers" as const, href: "/app/crm", label: "Clientes" }
      : null,
    hasPermission(role, "crm:leads:view")
      ? { key: "leads" as const, href: "/app/crm/leads", label: "Leads" }
      : null,
    hasPermission(role, "crm:opportunities:view")
      ? {
          key: "opportunities" as const,
          href: "/app/crm/opportunities",
          label: "Oportunidades",
        }
      : null,
    hasPermission(role, "crm:pipeline:view")
      ? {
          key: "pipeline" as const,
          href: "/app/crm/pipeline",
          label: "Funil",
        }
      : null,
    hasPermission(role, "crm:activities:view")
      ? {
          key: "activities" as const,
          href: "/app/crm/activities",
          label: "Atividades",
        }
      : null,
  ].filter(Boolean) as Array<{ key: CrmTab; href: string; label: string }>;

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
