import Link from "next/link";
import type { Role } from "@prisma/client";
import { can } from "@/shared/permissions/can";
import { cn } from "@/shared/utilities/cn";

type CommunicationsSubnavProps = {
  role: Role;
  active: "history" | "templates" | "compose";
};

const ITEMS = [
  { id: "history" as const, href: "/app/communications", title: "Histórico", permission: "communications:view" as const },
  { id: "compose" as const, href: "/app/communications/new", title: "Preparar WhatsApp", permission: "communications:send" as const },
  { id: "templates" as const, href: "/app/communications/templates", title: "Templates", permission: "communications:view" as const },
];

export function CommunicationsSubnav({ role, active }: CommunicationsSubnavProps) {
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
