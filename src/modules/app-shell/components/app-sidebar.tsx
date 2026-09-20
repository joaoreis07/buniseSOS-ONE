"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { can } from "@/shared/permissions/can";
import { APP_NAV_GROUPS } from "@/modules/app-shell/nav";
import { BrandMark } from "@/shared/brand/brand-logo";
import { cn } from "@/shared/utilities/cn";

type AppSidebarProps = {
  role: Role;
  companyName: string;
};

export function AppSidebar({ role, companyName }: AppSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#071225] text-white shadow-xl print:hidden lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/app" aria-label="BusinessOS One">
          <span className="flex items-center gap-3">
            <BrandMark size={40} className="size-10 ring-1 ring-white/15" />
            <span>
              <span className="block font-semibold tracking-[-0.02em] text-white">
                BusinessOS One
              </span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-blue-300">
                Gestão integrada
              </span>
            </span>
          </span>
        </Link>
        <p className="mt-3 truncate rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-slate-300">
          {companyName}
        </p>
      </div>
      <SidebarNavigation role={role} />
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] leading-4 text-slate-500">
          Gestão integrada para sua empresa
        </p>
      </div>
    </aside>
  );
}

export function SidebarNavigation({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Menu principal">
      {APP_NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => can(role, item.permission));
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {group.label}
            </p>
            <div className="space-y-1">
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
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                        : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0",
                        active ? "text-blue-100" : "text-slate-500 group-hover:text-blue-300",
                      )}
                    />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      </nav>
  );
}
