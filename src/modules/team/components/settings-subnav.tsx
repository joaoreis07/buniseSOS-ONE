import Link from "next/link";
import type { Role } from "@prisma/client";
import { can } from "@/shared/permissions/can";
import { cn } from "@/shared/utilities/cn";

type SettingsSubnavProps = {
  role: Role;
  active: "company" | "team" | "permissions" | "preferences";
};

const ITEMS = [
  {
    id: "company" as const,
    href: "/app/settings",
    title: "Empresa",
    permission: "settings:view" as const,
  },
  {
    id: "team" as const,
    href: "/app/settings/team",
    title: "Equipe",
    permission: "team:view" as const,
  },
  {
    id: "permissions" as const,
    href: "/app/settings/permissions",
    title: "Permissões",
    permission: "team:view" as const,
  },
  {
    id: "preferences" as const,
    href: "/app/settings/preferences",
    title: "Preferências",
    permission: "settings:view" as const,
  },
];

export function SettingsSubnav({ role, active }: SettingsSubnavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      {ITEMS.filter((item) => can(role, item.permission)).map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm",
            active === item.id
              ? "bg-emerald-50 font-medium text-emerald-900"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
