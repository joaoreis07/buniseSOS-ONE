import { APP_NAV_GROUPS } from "@/modules/app-shell/nav";
import { DEMO_NAV_GROUPS } from "@/modules/marketing/demo-nav";
import type { ShellNavGroup, ShellNavItem } from "@/modules/product-shell/types";
import type { Permission } from "@/shared/permissions/rbac";
import { can } from "@/shared/permissions/can";
import type { Role } from "@prisma/client";

export const APP_SHELL_NAV_GROUPS: ShellNavGroup[] = APP_NAV_GROUPS.map((group) => ({
  label: group.label,
  items: group.items.map((item) => ({
    title: item.title,
    href: item.href,
    icon: item.icon,
    matchPrefix: item.href === "/app/crm" || item.href === "/app/settings",
  })),
}));

export const DEMO_SHELL_NAV_GROUPS: ShellNavGroup[] = DEMO_NAV_GROUPS.map((group) => ({
  label: group.label,
  items: group.items.map((item) => ({
    title: item.label,
    href: item.href,
    icon: item.icon,
    matchPrefix: item.id === "crm" || item.id === "settings" || item.id === "products" || item.id === "communications",
  })),
}));

/** @deprecated Use APP_SHELL_NAV_GROUPS */
export function appShellNavGroups(): ShellNavGroup[] {
  return APP_SHELL_NAV_GROUPS;
}

/** @deprecated Use DEMO_SHELL_NAV_GROUPS */
export function demoShellNavGroups(): ShellNavGroup[] {
  return DEMO_SHELL_NAV_GROUPS;
}

export function filterAppNav(role: Role) {
  return (item: ShellNavItem & { permission?: Permission }) => {
    const navItem = APP_NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === item.href);
    return navItem ? can(role, navItem.permission) : true;
  };
}
