import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/utilities/cn";
import type { ShellNavGroup, ShellNavItem } from "@/modules/product-shell/types";

function isActive(pathname: string, item: ShellNavItem) {
  if (item.matchPrefix) {
    return pathname.startsWith(item.href);
  }
  if (item.href === "/app" || item.href === "/demo/dashboard") {
    return pathname === item.href || pathname === item.href.replace("/dashboard", "");
  }
  return pathname === item.href;
}

export function SidebarNav({
  groups,
  pathname,
  onNavigate,
  filterNavItem,
}: {
  groups: ShellNavGroup[];
  pathname: string;
  onNavigate?: () => void;
  filterNavItem?: (item: ShellNavItem) => boolean;
}) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3" aria-label="Menu principal">
      {groups.map((group) => {
        const items = filterNavItem
          ? group.items.filter(filterNavItem)
          : group.items;
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      active
                        ? "bg-white/12 text-white"
                        : "text-white/60 hover:bg-white/[0.07] hover:text-white/90",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "size-[15px] shrink-0",
                        active ? "text-white" : "text-white/50 group-hover:text-white/80",
                      )}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{item.title}</span>
                    {active ? (
                      <ChevronRight className="size-3 shrink-0 text-white/40" aria-hidden />
                    ) : null}
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
