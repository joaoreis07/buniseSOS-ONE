import type { ReactNode } from "react";
import { APP_NAV_ITEMS } from "@/modules/app-shell/nav";
import { AppHeader } from "@/modules/app-shell/components/app-header";
import { AppSidebar, SidebarNavigation } from "@/modules/app-shell/components/app-sidebar";
import type { AppSessionUser } from "@/shared/auth/session";
import { getUserInitials } from "@/shared/auth/session";
import type { NotificationType } from "@prisma/client";

type AppShellProps = {
  user: AppSessionUser;
  companyName: string;
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

export function AppShell({
  user,
  companyName,
  pathname,
  children,
  notifications,
}: AppShellProps) {
  const currentPath = pathname ?? "/app";
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const pageTitle =
    [...APP_NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) =>
        item.href === "/app" ? currentPath === "/app" : currentPath.startsWith(item.href),
      )?.title ?? "BusinessOS One";

  return (
    <div className="min-h-screen bg-[hsl(210_40%_98%)] text-foreground">
      <AppSidebar role={user.role} companyName={companyName} pathname={currentPath} />
      <div className="min-w-0 lg:pl-64">
        <AppHeader
          userName={user.name}
          userEmail={user.email}
          companyName={companyName}
          role={user.role}
          initials={getUserInitials(user.name, user.email)}
          pageTitle={pageTitle}
          dateLabel={dateLabel}
          notifications={notifications}
          mobileNav={<SidebarNavigation role={user.role} pathname={currentPath} />}
        />
        <main className="app-surface relative min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-9 lg:py-8 print:p-0">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_82%_0%,rgba(37,99,235,0.08),transparent_36%)]"
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
