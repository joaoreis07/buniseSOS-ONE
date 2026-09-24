import type { ReactNode } from "react";
import type { AppSessionUser } from "@/shared/auth/session";
import { getUserInitials } from "@/shared/auth/session";
import type { NotificationType, Role } from "@prisma/client";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
import { NotificationBell } from "@/modules/communications/components/notification-bell";
import { ProductShellLayout } from "@/modules/product-shell/product-shell-layout";
import { APP_SHELL_NAV_GROUPS } from "@/modules/product-shell/shell-nav";
import { can } from "@/shared/permissions/can";
import { APP_NAV_GROUPS } from "@/modules/app-shell/nav";
import type { ShellNavItem } from "@/modules/product-shell/types";

type AppShellProps = {
  user: AppSessionUser;
  companyName: string;
  companySubtitle?: string | null;
  pathname?: string | null;
  children: ReactNode;
  notifications?: {
    unreadCount: number;
    items: Array<{
      id: string;
      type: NotificationType;
      title: string;
      message: string;
      link: string | null;
      readAt: Date | null;
      createdAt: Date;
    }>;
  } | null;
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SALES: "Vendedor",
  FINANCE: "Financeiro",
  INVENTORY: "Estoque",
};

function filterNavItem(role: Role) {
  return (item: ShellNavItem) => {
    const navItem = APP_NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === item.href);
    return navItem ? can(role, navItem.permission) : true;
  };
}

export function AppShell({
  user,
  companyName,
  companySubtitle,
  pathname,
  children,
  notifications,
}: AppShellProps) {
  const currentPath = pathname ?? "/app";

  return (
    <ProductShellLayout
      pathname={currentPath}
      navGroups={APP_SHELL_NAV_GROUPS}
      homeHref="/app"
      isDemo={false}
      notificationsHref="/app/notifications"
      company={{
        name: companyName,
        subtitle: companySubtitle,
      }}
      user={{
        name: user.name ?? "Usuário",
        email: user.email,
        roleLabel: ROLE_LABELS[user.role] ?? user.role,
        initials: getUserInitials(user.name, user.email),
      }}
      filterNavItem={filterNavItem(user.role)}
      notificationsSlot={
        notifications ? (
          <NotificationBell
            unreadCount={notifications.unreadCount}
            items={notifications.items}
          />
        ) : undefined
      }
      onLogout={
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-white/30 transition-colors hover:text-white/70"
            title="Sair"
          >
            <span className="sr-only">Sair</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </form>
      }
    >
      {children}
    </ProductShellLayout>
  );
}
