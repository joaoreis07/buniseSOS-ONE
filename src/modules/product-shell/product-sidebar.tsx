import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, ChevronRight, HelpCircle, LogOut, User } from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";
import { SidebarNav } from "@/modules/product-shell/sidebar-nav";
import type { ShellCompany, ShellNavGroup, ShellNavItem, ShellUser } from "@/modules/product-shell/types";

type ProductSidebarProps = {
  homeHref: string;
  company: ShellCompany;
  user: ShellUser;
  navGroups: ShellNavGroup[];
  pathname: string;
  isDemo?: boolean;
  notificationsHref?: string;
  helpHref?: string;
  onNavigate?: () => void;
  onLogout?: ReactNode;
  filterNavItem?: (item: ShellNavItem) => boolean;
};

export function ProductSidebar({
  homeHref,
  company,
  user,
  navGroups,
  pathname,
  isDemo,
  notificationsHref,
  helpHref = "https://businessos-one-green.vercel.app",
  onNavigate,
  onLogout,
  filterNavItem,
}: ProductSidebarProps) {
  const initial = company.name.trim().charAt(0).toUpperCase() || "E";

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex h-screen flex-col print:hidden"
      style={{
        width: "var(--bos-sidebar-width)",
        background: "var(--bos-navy)",
      }}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <Link href={homeHref} aria-label="BusinessOS One" onClick={onNavigate}>
          <BrandMark size={24} className="size-6 brightness-0 invert" />
        </Link>
      </div>

      {isDemo ? (
        <div className="mx-3 mt-3 rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-2 text-center text-xs font-medium text-amber-300">
          Modo Demonstração
        </div>
      ) : null}

      <div className="mx-3 mt-3 flex cursor-default items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2.5">
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
          style={{ background: "var(--bos-primary)" }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{company.name}</p>
          {company.subtitle ? (
            <p className="truncate text-[10px] text-white/40">{company.subtitle}</p>
          ) : null}
        </div>
        <ChevronRight className="size-3 shrink-0 text-white/30" aria-hidden />
      </div>

      <SidebarNav
        groups={navGroups}
        pathname={pathname}
        onNavigate={onNavigate}
        filterNavItem={filterNavItem}
      />

      <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
        {notificationsHref ? (
          <Link
            href={notificationsHref}
            onClick={onNavigate}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80"
          >
            <Bell className="size-[15px]" />
            <span>Notificações</span>
          </Link>
        ) : null}
        <a
          href={helpHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80"
        >
          <HelpCircle className="size-[15px]" />
          <span>Ajuda</span>
        </a>
        <div className="mt-1 flex items-center gap-2.5 border-t border-white/10 px-3 py-2 pt-3">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--bos-primary)" }}
          >
            <User className="size-[13px] text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name}</p>
            <p className="truncate text-[10px] text-white/40">{user.roleLabel}</p>
          </div>
          {onLogout ?? (
            <span className="text-white/30">
              <LogOut className="size-[13px]" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
