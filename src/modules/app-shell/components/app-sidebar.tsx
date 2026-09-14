"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { can } from "@/shared/permissions/can";
import { APP_NAV_ITEMS } from "@/modules/app-shell/nav";
import { cn } from "@/shared/utilities/cn";

type AppSidebarProps = {
  role: Role;
  companyName: string;
};

export function AppSidebar({ role, companyName }: AppSidebarProps) {
  const pathname = usePathname();
  const items = APP_NAV_ITEMS.filter((item) => can(role, item.permission));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card print:hidden md:flex md:flex-col">
      <div className="border-b border-border px-4 py-4">
        <p className="text-xs font-medium tracking-wider text-emerald-700 uppercase">
          BusinessOS One
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {companyName}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-emerald-50 font-medium text-emerald-900"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
